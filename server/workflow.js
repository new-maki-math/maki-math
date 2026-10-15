'use strict';
/* 编辑提交、审核、版本、回滚、隐藏分、反馈、路线、申请 */
const crypto = require('node:crypto');
const { one, all, run, insert, tx, now, log } = require('./db');
const course = require('./course');
const render = require('./render');
const { toNew } = require('./convert');
/* 旧写法的节点 → 新写法（只换正文，结构不变） */
const convertNode = n => { const c = JSON.parse(JSON.stringify(n)); const f = x => { x.src = toNew(x.body); }; f(c); (c.variants || []).forEach(f); course.proofsOf(c).forEach(f); return c; };
const { httpError, canEdit, canReview } = require('./auth');

/* ---------- 内容清洗：只保留白名单标签 ---------- */
const TAGS = new Set(['p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'strong', 'em', 'b', 'i', 'br', 'sub', 'sup', 'img']);
const CLASSES = new Set(['small', 'plain', 'tt', 'tt-wrap', 'vt', 'vf', 'tip', 'fig', 'en']);
function sanitize(html) {
  html = course.fixMath(String(html || '').replace(/<!--[\s\S]*?-->/g, ''));
  return html.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, close, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!TAGS.has(tag)) return m.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (close) return tag === 'img' ? '' : `</${tag}>`;
    /* 图片只允许本站 /fig/ 下的文件 */
    if (tag === 'img') { const src = /src\s*=\s*"(\/fig\/[\w\/.-]+\.(?:svg|png|jpg))"/i.exec(attrs); return src ? `<img src="${src[1]}" alt="">` : ''; }
    const cls = /class\s*=\s*"([^"]*)"/i.exec(attrs);
    const keep = cls ? cls[1].split(/\s+/).filter(c => CLASSES.has(c)) : [];
    return `<${tag}${keep.length ? ` class="${keep.join(' ')}"` : ''}>`;
  });
}
/* 简化写法：空行分段，$...$ 行内公式，$$...$$ 独立公式，[[节点ID]] 引用 */
function toHtml(src) {
  src = String(src || '').trim();
  if (/^\s*</.test(src)) return sanitize(src);
  return src.split(/\n\s*\n/).map(par => {
    par = par.trim();
    if (/^\$\$[\s\S]*\$\$$/.test(par)) return par;
    return `<p>${par.replace(/</g, '&lt;').replace(/\n/g, ' ')}</p>`;
  }).join('');
}
const str = (v, max, name) => {
  if (typeof v !== 'string') throw httpError(400, `${name} 必须是文字`);
  if (v.length > max) throw httpError(400, `${name} 太长了（最多 ${max} 字）`);
  return v;
};
const ids = v => (Array.isArray(v) ? v : []).map(String).filter(s => /^([a-z0-9-]{1,40}:)?[A-Za-z0-9_]{1,40}$/.test(s)).slice(0, 60);
/* 新写法（Markdown + Typst）的课程：前端提交的是源文，服务器编译成 HTML；存储时两份都保留 */
const isTypst = st => !!(st && st.settings && st.settings.format === 'typst');
async function cleanNode(d, typst) {
  if (!d || typeof d !== 'object') throw httpError(400, '节点内容为空');
  if (!course.TYPES.includes(d.type)) throw httpError(400, '节点类型不对');
  const imp = Number(d.imp);
  if (![1, 2, 3].includes(imp)) throw httpError(400, '重要性只能是 1、2、3');
  /* 旧课程：HTML 或简化写法；新课程：源文（已存的数据里源文在 src，编辑器送来的在 body） */
  const parts = [];
  const body = (x, name) => {
    if (!typst) return toHtml(str(x.body || '', 20000, name));
    /* 已存的数据：body 是编译好的 HTML，源文在 src；编辑器送来的：body 就是源文 */
    const useSrc = x.src != null && (/^\s*</.test(x.body || '') || !x.body);
    const src = str(useSrc ? x.src : (x.body || ''), 20000, name);
    const slot = { src, name, body: '' };
    parts.push(slot);
    return slot;
  };
  const n = { type: d.type, imp, title: str(d.title, 60, '标题').trim(), alias: (Array.isArray(d.alias) ? d.alias : []).map(a => str(String(a), 30, '别名')).slice(0, 20),
    deps: ids(d.deps), body: body(d, '正文') };
  if (!n.title) throw httpError(400, '标题不能为空');
  /* 等价说法（变体）：同一个概念的其他等价定义或叙述 */
  const vs = Array.isArray(d.variants) ? d.variants.slice(0, 6) : [];
  const variants = vs.filter(v => String(v.src != null ? v.src : v.body || '').trim()).map(v => ({ name: str(v.name || '等价说法', 30, '说法名称').trim() || '等价说法', body: body(v, '说法正文') }));
  if (variants.length) n.variants = variants;
  if (course.isQ(n.type)) n.attach = ids(d.attach);
  const ps = Array.isArray(d.proofs) ? d.proofs : Array.isArray(d.sols) ? d.sols : [];
  const proofs = ps.slice(0, 8).map(p => ({ name: str(p.name || '证明', 30, '证明名称'), deps: ids(p.deps), body: body(p, '证明正文') }));
  if (course.isQ(n.type)) n.sols = proofs; else if (proofs.length || ['thm', 'prop', 'axiom', 'method'].includes(n.type)) n.proofs = proofs;
  if (typst) {
    const out = await render.renderMany(parts.map(x => x.src));
    const problems = [];
    out.forEach((r, i) => r.errors.forEach(e => problems.push(`${parts[i].name}里的公式 $${e.formula}$：${e.msg}`)));
    if (problems.length) { const e = httpError(422, '有公式没有通过 Typst 编译'); e.problems = problems.slice(0, 30); throw e; }
    const fill = x => { const k = parts.indexOf(x.body); x.src = parts[k].src; x.body = out[k].html; };
    fill(n); (n.variants || []).forEach(fill); course.proofsOf(n).forEach(fill);
  }
  return n;
}

/* 泡泡树：只保留认识的字段 */
function cleanTree(nb) {
  if (!nb || typeof nb !== 'object' || !nb.root) throw httpError(400, '泡泡树缺少根');
  const out = {};
  for (const [bid, b] of Object.entries(nb)) {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(bid)) throw httpError(400, `泡泡编号「${bid}」不合法`);
    if (!b || !Array.isArray(b.kids)) throw httpError(400, '泡泡格式不对');
    const c = { title: b.title == null ? null : str(String(b.title), 60, '泡泡名称'), ordered: !!b.ordered, kids: b.kids.map(String).filter(k => /^[A-Za-z0-9_]{1,40}$/.test(k)) };
    if (b.tag) c.tag = str(String(b.tag), 10, '章节编号');
    if (b.desc) c.desc = str(String(b.desc), 300, '泡泡简介');
    if (b.green != null && b.green !== '') {
      const g = Number(b.green);
      if (!(g >= 0.5 && g <= 1)) throw httpError(400, `「${c.title || bid}」的变绿阈值要在 50% 到 100% 之间`);
      c.green = Math.round(g * 100) / 100;
    }
    out[bid] = c;
  }
  return out;
}

/* ---------- 把提交应用到课程状态上（不写库） ---------- */
async function applyToState(st, kind, target, payload) {
  const B = JSON.parse(JSON.stringify(st.B)), N = JSON.parse(JSON.stringify(st.N));
  if (kind === 'tree') return { B: cleanTree(payload.B), N };
  if (payload.data === null) {               // 删除节点
    if (!N[target]) throw httpError(404, '节点不存在');
    delete N[target];
    for (const b of Object.values(B)) b.kids = b.kids.filter(k => k !== target);
    return { B, N };
  }
  const data = await cleanNode(payload.data, isTypst(st));
  if (!N[target]) {                          // 新节点
    if (!/^[A-Za-z0-9_]{1,40}$/.test(target)) throw httpError(400, '节点编号只能用字母、数字、下划线');
    if (B[target]) throw httpError(400, '节点编号和某个泡泡重名');
    const bub = B[payload.bubble];
    if (!bub || payload.bubble === 'root') throw httpError(400, '请选择新节点放在哪个泡泡里');
    const pos = Math.max(0, Math.min(bub.kids.length, Number.isInteger(payload.pos) ? payload.pos : bub.kids.length));
    bub.kids.splice(pos, 0, target);
  }
  N[target] = data;
  return { B, N, data };
}

async function submit(user, slug, { kind, target, payload, summary }) {
  if (!canEdit(user, slug)) throw httpError(403, '你还没有这门课的编辑权限，请先申请成为编辑');
  const st = await course.load(slug);
  if (!st) throw httpError(404, '课程不存在');
  summary = str(summary || '', 200, '变更摘要').trim();
  if (!summary) throw httpError(400, '每次修改都要写变更摘要');
  if (!['node', 'tree'].includes(kind)) throw httpError(400, '提交类型不对');
  if (kind === 'tree') target = '#tree';
  const next = await applyToState(st, kind, target, payload || {});
  const problems = await course.checkFull(st, next.B, next.N);
  if (problems.length) { const e = httpError(422, '没有通过顺序检查'); e.problems = problems.slice(0, 30); throw e; }
  const base = kind === 'tree' ? st.meta.tree_version : (st.ver[target] ? st.ver[target].v : 0);
  const stored = kind === 'node' ? { ...payload, data: next.data === undefined ? null : next.data } : payload;
  const id = await insert('INSERT INTO submissions(course,kind,target,base_version,payload_json,summary,author_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    slug, kind, target, base, JSON.stringify(stored), summary, user.id, now());
  await log(user.id, 'submit', { id, slug, target });
  return id;
}

async function writeState(slug, st, next, kind, target, summary, authorId, reviewerId) {
  if (kind === 'tree') {
    const v = st.meta.tree_version + 1;
    await run('UPDATE courses SET tree_json = ?, tree_version = ?, updated_at = ? WHERE slug = ?', JSON.stringify(next.B), v, now(), slug);
    await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
      slug, '#tree', v, JSON.stringify({ B: next.B, graph: st.graph }), summary, authorId, reviewerId, now());
    return v;
  }
  const lastV = (await one('SELECT MAX(version) AS v FROM versions WHERE course = ? AND target = ?', slug, target) || {}).v || 0;
  const v = lastV + 1, data = next.N[target];
  if (data) await run('INSERT INTO nodes(course,id,data_json,version,reviewer_id,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(course,id) DO UPDATE SET data_json=excluded.data_json, version=excluded.version, reviewer_id=excluded.reviewer_id, updated_at=excluded.updated_at',
    slug, target, JSON.stringify(data), v, reviewerId, now());
  else await run('DELETE FROM nodes WHERE course = ? AND id = ?', slug, target);
  await run('UPDATE courses SET updated_at = ? WHERE slug = ?', now(), slug);
  await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
    slug, target, v, data ? JSON.stringify(data) : null, summary, authorId, reviewerId, now());
  /* 结构变化（新增或删除节点）也要记一次树的版本 */
  if (JSON.stringify(next.B) !== JSON.stringify(st.B)) {
    const tv = st.meta.tree_version + 1;
    await run('UPDATE courses SET tree_json = ?, tree_version = ?, updated_at = ? WHERE slug = ?', JSON.stringify(next.B), tv, now(), slug);
    await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
      slug, '#tree', tv, JSON.stringify({ B: next.B, graph: st.graph }), `随「${target}」一起变化：${summary}`, authorId, reviewerId, now());
  }
  return v;
}

async function decide(reviewer, id, { approve, score, note }) {
  const s = await one('SELECT * FROM submissions WHERE id = ?', id);
  if (!s) throw httpError(404, '提交不存在');
  if (!canReview(reviewer, s.course)) throw httpError(403, '你没有这门课的审核权限');
  if (s.status !== 'pending') throw httpError(409, '这条提交已经处理过了');
  if (s.author_id === reviewer.id && !reviewer.is_admin) throw httpError(403, '不能审核自己的提交');
  note = str(note || '', 500, '审核意见');
  if (!approve) {
    if (!note.trim()) throw httpError(400, '拒绝时请写明原因');
    await run('UPDATE submissions SET status = ?, reviewer_id = ?, review_note = ?, decided_at = ? WHERE id = ?', 'rejected', reviewer.id, note, now(), id);
    await log(reviewer.id, 'reject', { id });
    return { status: 'rejected' };
  }
  score = Number(score);
  if (![1, 2, 3].includes(score)) throw httpError(400, '请给这次提交打 1–3 分');
  return await tx(async () => {
    await run('SELECT 1 FROM courses WHERE slug = ? FOR UPDATE', s.course);
    course.invalidate(s.course);
    const st = await course.load(s.course);
    const cur = s.kind === 'tree' ? st.meta.tree_version : (st.ver[s.target] ? st.ver[s.target].v : 0);
    const warn = cur !== s.base_version ? `提交之后内容已经被改过（当时是第 ${s.base_version} 版，现在是第 ${cur} 版），已按最新内容合并。` : null;
    const next = await applyToState(st, s.kind, s.target, s.payload_json);
    const problems = await course.checkFull(st, next.B, next.N);
    if (problems.length) { const e = httpError(422, '按当前课程内容，这条提交已经不能通过顺序检查'); e.problems = problems.slice(0, 30); throw e; }
    const v = await writeState(s.course, st, next, s.kind, s.target, s.summary, s.author_id, reviewer.id);
    await run('UPDATE submissions SET status = ?, reviewer_id = ?, score = ?, review_note = ?, decided_at = ? WHERE id = ?', 'approved', reviewer.id, score, note, now(), id);
    await run('INSERT INTO score_events(user_id,course,delta,reason,submission_id,created_at) VALUES (?,?,?,?,?,?)', s.author_id, s.course, score, 'accepted', id, now());
    course.invalidate(s.course);
    await log(reviewer.id, 'approve', { id, version: v });
    return { status: 'approved', version: v, warning: warn };
  });
}

/* 回滚到某个历史版本：生成一个新版本；被撤销的那次修改扣分 */
async function rollback(reviewer, slug, target, toVersion, reason) {
  if (!canReview(reviewer, slug)) throw httpError(403, '你没有这门课的审核权限');
  reason = str(reason || '', 300, '回滚原因').trim();
  if (!reason) throw httpError(400, '请写明回滚原因');
  const old = await one('SELECT * FROM versions WHERE course = ? AND target = ? AND version = ?', slug, target, Number(toVersion));
  if (!old) throw httpError(404, '找不到这个版本');
  return await tx(async () => {
    await run('SELECT 1 FROM courses WHERE slug = ? FOR UPDATE', slug);
    course.invalidate(slug);
    const st = await course.load(slug);
    let next;
    if (target === '#tree') next = { B: old.data_json.B, N: st.N };
    else {
      const B = JSON.parse(JSON.stringify(st.B)), N = JSON.parse(JSON.stringify(st.N));
      if (old.data_json) {
        if (!N[target]) throw httpError(400, '这个节点已经被删除；请先通过泡泡树把它放回去');
        N[target] = isTypst(st) && !old.data_json.src ? await cleanNode(convertNode(old.data_json), true) : old.data_json;
      } else { delete N[target]; for (const b of Object.values(B)) b.kids = b.kids.filter(k => k !== target); }
      next = { B, N };
    }
    const problems = await course.checkFull(st, next.B, next.N);
    if (problems.length) { const e = httpError(422, '回滚后无法通过顺序检查'); e.problems = problems.slice(0, 30); throw e; }
    const undone = await all('SELECT * FROM versions WHERE course = ? AND target = ? AND version > ? AND author_id IS NOT NULL', slug, target, old.version);
    const v = await writeState(slug, st, next, target === '#tree' ? 'tree' : 'node', target, `回滚到第 ${old.version} 版：${reason}`, null, reviewer.id);
    for (const u of undone) await run('INSERT INTO score_events(user_id,course,delta,reason,submission_id,created_at) VALUES (?,?,?,?,NULL,?)', u.author_id, slug, -3, 'rolled_back', now());
    course.invalidate(slug);
    await log(reviewer.id, 'rollback', { slug, target, to: old.version });
    return { version: v };
  });
}

/* ---------- 隐藏分与晋升门槛（PRD 第 6 节） ---------- */
const PROMOTE = { accepted: 30, avg: 2.5, cleanDays: 90 };
async function scoreOf(userId, slug) {
  const acc = await one("SELECT COUNT(*) AS n, AVG(delta) AS a, COALESCE(SUM(delta),0) AS s FROM score_events WHERE user_id = ? AND course = ? AND reason = 'accepted'", userId, slug);
  const neg = await one("SELECT COALESCE(SUM(delta),0) AS s, MAX(created_at) AS last FROM score_events WHERE user_id = ? AND course = ? AND reason = 'rolled_back'", userId, slug);
  const eligible = acc.n >= PROMOTE.accepted && (acc.a || 0) >= PROMOTE.avg && (!neg.last || now() - neg.last > PROMOTE.cleanDays * 86400_000);
  return { hidden: acc.s + neg.s, accepted: acc.n, avg: acc.a || 0, eligible };
}

/* ---------- 申请 ---------- */
async function apply(user, { kind, course: slug, material }) {
  material = str(material || '', 5000, '申请材料').trim();
  if (!['teacher', 'editor', 'reviewer'].includes(kind)) throw httpError(400, '申请类型不对');
  if (!material) throw httpError(400, kind === 'editor' ? '请附上样稿' : '请填写申请材料');
  if (kind !== 'teacher' && !await course.load(slug)) throw httpError(404, '课程不存在');
  if (kind === 'teacher' && user.is_teacher) throw httpError(409, '你已经是认证老师');
  if (kind === 'reviewer' && !(await scoreOf(user.id, slug)).eligible) throw httpError(403, `还没达到申请门槛：同一门课累计被采纳 ≥ ${PROMOTE.accepted} 次、平均评分 ≥ ${PROMOTE.avg}、最近 ${PROMOTE.cleanDays} 天没有被回滚`);
  if (await one("SELECT id FROM applications WHERE user_id = ? AND kind = ? AND COALESCE(course,'') = COALESCE(?, '') AND status = 'pending'", user.id, kind, slug || null)) throw httpError(409, '你已经有一份同类申请在审核中');
  await run('INSERT INTO applications(user_id,kind,course,material,created_at) VALUES (?,?,?,?,?)', user.id, kind, kind === 'teacher' ? null : slug, material, now());
}
function canHandleApp(u, a) {
  if (u.is_admin) return true;
  if (a.kind === 'reviewer') return false;
  if (a.kind === 'teacher') return u.roles.some(r => r.role === 'reviewer');
  return canReview(u, a.course);
}
async function decideApp(u, id, { approve, note }) {
  const a = await one('SELECT * FROM applications WHERE id = ?', id);
  if (!a) throw httpError(404, '申请不存在');
  if (!canHandleApp(u, a)) throw httpError(403, '你不能处理这类申请');
  if (a.status !== 'pending') throw httpError(409, '已经处理过了');
  await tx(async () => {
    await run('UPDATE applications SET status = ?, handler_id = ?, note = ?, decided_at = ? WHERE id = ?', approve ? 'approved' : 'rejected', u.id, str(note || '', 500, '备注'), now(), id);
    if (approve) {
      if (a.kind === 'teacher') await run('UPDATE users SET is_teacher = TRUE WHERE id = ?', a.user_id);
      else await run('INSERT INTO course_roles(user_id,course,role,granted_by,created_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING', a.user_id, a.course, a.kind, u.id, now());
    }
  });
  await log(u.id, approve ? 'app_approve' : 'app_reject', { id });
}

/* ---------- 反馈 ---------- */
const FB_KINDS = ['内容有错', '表述不清', '顺序有问题', '其他'];
/* 反馈：登录用户和访客都可以；访客按 IP（只存哈希）限流，全站每天也有上限，防止刷屏 */
async function addFeedback(user, slug, nodeId, { kind, text }, ipHash) {
  const st = await course.load(slug);
  if (!st || !st.N[nodeId]) throw httpError(404, '节点不存在');
  if (!FB_KINDS.includes(kind)) throw httpError(400, '问题类型不对');
  text = str(text || '', 2000, '反馈内容').trim();
  if (!text) throw httpError(400, '请写明具体是哪里');
  const t = now();
  if (user) {
    if ((await one('SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created_at > ?', user.id, t - 3600_000)).n >= 20) throw httpError(429, '一小时内反馈太多了，请稍后再试');
  } else {
    if ((await one('SELECT COUNT(*) AS n FROM feedback WHERE ip_hash = ? AND created_at > ?', ipHash, t - 3600_000)).n >= 5) throw httpError(429, '一小时内反馈太多了，请稍后再试');
    if ((await one('SELECT COUNT(*) AS n FROM feedback WHERE user_id IS NULL AND created_at > ?', t - 86400_000)).n >= Number(process.env.ANON_FEEDBACK_DAILY_MAX || 200))
      throw httpError(503, '今天收到的反馈太多了，请明天再试');
  }
  await run('INSERT INTO feedback(course,node_id,user_id,kind,text,created_at,ip_hash) VALUES (?,?,?,?,?,?,?)', slug, nodeId, user ? user.id : null, kind, text, t, user ? null : ipHash);
}
async function resolveFeedback(u, id, resolution) {
  const f = await one('SELECT * FROM feedback WHERE id = ?', id);
  if (!f) throw httpError(404, '反馈不存在');
  if (!canReview(u, f.course)) throw httpError(403, '你没有这门课的审核权限');
  resolution = str(resolution || '', 1000, '处理结果').trim();
  if (!resolution) throw httpError(400, '请写明处理结果，它会公开显示');
  await run("UPDATE feedback SET status = 'resolved', resolution = ?, handler_id = ?, decided_at = ? WHERE id = ?", resolution, u.id, now(), id);
}

/* ---------- 路线 ---------- */
async function cleanItems(slug, items) {
  const st = await course.load(slug);
  if (!Array.isArray(items) || !items.length) throw httpError(400, '路线里至少要有一个节点');
  if (items.length > 400) throw httpError(400, '路线太长了');
  return items.map(x => {
    if (!st.N[x.id]) throw httpError(400, `节点「${x.id}」不存在`);
    const it = { id: x.id, p: Number.isInteger(x.p) ? x.p : 0 };
    if ([1, 2, 3].includes(x.imp)) it.imp = x.imp;
    if (Number.isInteger(x.v) && x.v > 0 && x.v <= 6) it.v = x.v;
    if (x.note) it.note = str(x.note, 2000, '过渡文字');
    if (x.ref) it.ref = true;
    return it;
  });
}
async function saveRoute(user, { id, course: slug, title, descr, items, wantFeatured }) {
  if (!await course.load(slug)) throw httpError(404, '课程不存在');
  title = str(title || '', 40, '路线名称').trim();
  if (!title) throw httpError(400, '请给路线起个名字');
  descr = str(descr || '', 300, '路线简介');
  const its = JSON.stringify(await cleanItems(slug, items));
  if (id) {
    const r = await one('SELECT * FROM routes WHERE id = ? AND owner_id = ?', id, user.id);
    if (!r) throw httpError(404, '路线不存在');
    /* 已分享的路线修改后要重新审核；审核通过前，分享链接仍然显示上次通过的版本 */
    const status = r.status === 'private' || r.status === 'rejected' ? r.status : 'pending';
    await run('UPDATE routes SET title=?, descr=?, items_json=?, want_featured=?, status=?, updated_at=? WHERE id=?', title, descr, its, !!wantFeatured, status, now(), id);
    return id;
  }
  return insert('INSERT INTO routes(owner_id,course,title,descr,items_json,want_featured,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', user.id, slug, title, descr, its, !!wantFeatured, now(), now());
}
async function requestShare(user, id) {
  const r = await one('SELECT * FROM routes WHERE id = ? AND owner_id = ?', id, user.id);
  if (!r) throw httpError(404, '路线不存在');
  await run("UPDATE routes SET status = 'pending', updated_at = ? WHERE id = ?", now(), id);
}
async function decideRoute(u, id, { approve, featured, note }) {
  const r = await one('SELECT * FROM routes WHERE id = ?', id);
  if (!r) throw httpError(404, '路线不存在');
  if (!canReview(u, r.course)) throw httpError(403, '你没有这门课的审核权限');
  if (r.status !== 'pending') throw httpError(409, '这条路线没有在等待审核');
  note = str(note || '', 500, '审核意见');
  if (!approve) {
    if (!note.trim()) throw httpError(400, '拒绝时请写明原因');
    await run("UPDATE routes SET status = CASE WHEN approved_json IS NULL THEN 'rejected' ELSE 'shared' END, review_note = ?, reviewer_id = ?, updated_at = ? WHERE id = ?", note, u.id, now(), id);
    return;
  }
  const snap = JSON.stringify({ title: r.title, descr: r.descr, items: r.items_json });
  await run("UPDATE routes SET status = 'shared', approved_json = ?, share_token = COALESCE(share_token, ?), featured = ?, review_note = ?, reviewer_id = ?, updated_at = ? WHERE id = ?",
    snap, crypto.randomBytes(9).toString('base64url'), !!(featured && r.want_featured), note, u.id, now(), id);
  await log(u.id, 'route_approve', { id });
}

module.exports = { applyToState, submit, decide, rollback, scoreOf, apply, decideApp, canHandleApp, addFeedback, resolveFeedback, FB_KINDS,
  saveRoute, requestShare, decideRoute, cleanNode, sanitize, toHtml, PROMOTE, isTypst, convertNode };
