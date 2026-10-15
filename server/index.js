'use strict';
/* maki-math 服务器入口 */
const path = require('node:path');
const fs = require('node:fs');
const Fastify = require('fastify');
const { one, all, run, now, close } = require('./db');
const course = require('./course');
const auth = require('./auth');
const wf = require('./workflow');
const tex = require('./tex');
const render = require('./render');
const typpdf = require('./typpdf');
const search = require('./search');
const pow = require('./pow');
const crypto = require('node:crypto');
const POW_IP_SALT = process.env.POW_SECRET || crypto.randomBytes(16).toString('hex');
const { seedAll } = require('./seed');

const PROD = process.env.NODE_ENV === 'production';
const app = Fastify({ logger: { level: process.env.LOG_LEVEL || (PROD ? 'warn' : 'info') }, bodyLimit: 1_000_000, trustProxy: true });
app.register(require('@fastify/cookie'));
app.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'public'), prefix: '/', index: false, cacheControl: false,
  /* 页面引用脚本时都带版本号（?v=），内容一变地址就变，所以可以让浏览器长期缓存 */
  setHeaders(res, p) {
    if (/[\\/](core|online|atlas)\.js$/.test(p)) res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    else if (/[\\/]fig[\\/]/.test(p)) res.setHeader('cache-control', 'public, max-age=2592000');
    else res.setHeader('cache-control', PROD ? 'public, max-age=3600' : 'no-cache');
  }
});
app.register(require('@fastify/static'), { root: path.join(__dirname, '..', 'node_modules', 'mathjax', 'es5'), prefix: '/mathjax/', decorateReply: false, maxAge: '30d', immutable: true });


/* ---------- 通用 ---------- */
const COOKIE = 'mm_session';
app.decorateRequest('user', null);
app.addHook('onRequest', async (req, reply) => {
  req.user = await auth.userFromToken(req.cookies[COOKIE]);
  /* 跨站请求防护：所有修改类接口必须带自定义头（浏览器跨站时带不上） */
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.url.startsWith('/api/') && req.headers['x-mm'] !== '1')
    return reply.code(403).send({ error: '请求来源不对，请刷新页面重试' });
});
app.setErrorHandler((err, req, reply) => {
  const code = err.statusCode || 500;
  if (code >= 500) req.log.error(err);
  reply.code(code).send({ error: code >= 500 && PROD ? '服务器出错了，请稍后再试' : err.message, problems: err.problems, code: typeof err.code === 'string' && /^[a-z_]+$/.test(err.code) ? err.code : undefined });
});
const need = req => { if (!req.user) throw auth.httpError(401, '请先登录'); return req.user; };
const needCourse = async slug => { const st = await course.load(slug); if (!st) throw auth.httpError(404, '课程不存在'); return st; };
/* 暂时下架的课程：只有超级管理员看得到 */
const canSee = (st, req) => !(st.settings || {}).hidden || !!(req.user && req.user.is_admin);
const needVisible = async (slug, req) => { const st = await needCourse(slug); if (!canSee(st, req)) throw auth.httpError(404, '课程不存在'); return st; };

/* 简单限流：每个 IP 每分钟最多 n 次 */
const buckets = new Map(), RATE_MULT = Number(process.env.RATE_MULT || 1);
function limit(req, key, n) {
  const k = `${key}:${req.ip}`, t = Date.now(), b = buckets.get(k) || { t, n: 0 };
  if (t - b.t > 60_000) { b.t = t; b.n = 0; }
  if (++b.n > n * RATE_MULT) throw auth.httpError(429, '操作太频繁，请稍后再试');
  buckets.set(k, b);
  if (buckets.size > 20000) for (const [kk, bb] of buckets) if (t - bb.t > 60_000) buckets.delete(kk);
}
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (t - b.t > 120_000) buckets.delete(k); }, 300_000).unref();

/* ---------- 页面 ---------- */
const INDEX = path.join(__dirname, '..', 'public', 'index.html');
/* 页面里的脚本地址带上内容版本号，更新后浏览器会自动拿新文件 */
const PUB = path.join(__dirname, '..', 'public');
const ASSET_VER = require('node:crypto').createHash('sha1').update(['core.js', 'online.js', 'atlas.js', 'index.html'].map(f => fs.readFileSync(path.join(PUB, f))).join('')).digest('hex').slice(0, 10);
const INDEX_SRC = fs.readFileSync(INDEX, 'utf8').replace(/src="\/(core|online|atlas)\.js"/g, `src="/$1.js?v=${ASSET_VER}"`);
/* 每门课的页面：换上这门课的数据脚本（带版本号，可长期缓存）和它需要的公式扩展 */
function indexFor(st) {
  const ext = (st.settings && st.settings.mathjax) || [];
  let h = INDEX_SRC.replace('src="/c/shuxue-jichu/data.js"', `src="/c/${st.slug}/data.js?v=${ASSET_VER}-${st.meta.updated_at}-${st.meta.tree_version}"`)
    .replace('/*MJX_LOAD*/', ext.map(e => `'[tex]/${e}'`).join(','))
    .replace('/*MJX_PKG*/', ext.map(e => `'${e}'`).join(','));
  /* 新写法的课程：公式已经是 MathML，换成 MathML 版的 MathJax */
  if ((st.settings || {}).format === 'typst') h = h.replace('src="/mathjax/tex-svg.js"', 'src="/mathjax/mml-svg.js"');
  if (ext.includes('unicode')) h = h.replace('/*MJX_MACROS*/', ", macros: { oiint: '\\\\mathop{\\\\large\\\\unicode{x222F}}\\\\nolimits' }");
  return h;
}
const sendIndex = async (req, reply) => reply.type('text/html; charset=utf-8').header('cache-control', 'no-cache').send(indexFor(await needCourse('shuxue-jichu')));
app.get('/', sendIndex);
for (const p of ['/kb', '/kb/*', '/n/*', '/notes', '/routes', '/me', '/review', '/login', '/r/*', '/edit/*', '/courses', '/search', '/invite/*']) app.get(p, sendIndex);
/* 其他课程：/c/<课程>/... 用同一个页面，换成那门课的数据 */
async function sendCourseIndex(req, reply) {
  const slug = req.params.slug;
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) throw auth.httpError(404, '课程不存在');
  const c = await one('SELECT slug, live FROM courses WHERE slug = ?', slug);
  if (!c) throw auth.httpError(404, '课程不存在');
  return reply.type('text/html; charset=utf-8').header('cache-control', 'no-cache').send(indexFor(await needVisible(slug, req)));
}
app.get('/c/:slug', sendCourseIndex);
app.get('/c/:slug/*', sendCourseIndex);

app.get('/c/:slug/data.js', async (req, reply) => {
  const st = await needVisible(req.params.slug, req);
  const etag = `"${st.meta.updated_at}-${st.meta.tree_version}"`;
  if (req.headers['if-none-match'] === etag) return reply.code(304).send();
  if (!st.js) {
    const names = {};
    for (const u of await all('SELECT DISTINCT u.id, u.nickname FROM nodes n JOIN users u ON u.id = n.reviewer_id WHERE n.course = ?', st.slug)) names[u.id] = u.nickname;
    const rv = {};
    for (const [id, v] of Object.entries(st.ver)) rv[id] = v.reviewer ? names[v.reviewer] : null;
    st.js = course.clientScript(st) + `window.COURSE.reviewers=${JSON.stringify(rv)};`;
  }
  /* 地址里带了版本号就让浏览器长期缓存；内容一改版本号就变 */
  reply.header('etag', etag).header('cache-control', req.query && req.query.v ? 'public, max-age=31536000, immutable' : 'no-cache').type('application/javascript; charset=utf-8').send(st.js);
});

/* ---------- 课程与搜索 ---------- */
app.get('/api/courses', async req => {
  const rows = await all('SELECT slug, title, category, descr, live, pos, settings_json FROM courses ORDER BY pos');
  const cats = [];
  for (const c of ['逻辑与基础', '代数', '数论', '分析', '几何与拓扑']) cats.push({ name: c, courses: [] });
  for (const r of rows) {
    const hidden = !!(r.settings_json || {}).hidden;
    if (hidden && !(req.user && req.user.is_admin)) continue;
    let cat = cats.find(x => x.name === r.category);
    if (!cat) cats.push(cat = { name: r.category, courses: [] });
    const st = r.live ? await course.load(r.slug) : null;
    cat.courses.push({ id: r.slug, title: r.title + (hidden ? '（已下架）' : ''), desc: r.descr, live: !!r.live, nodes: st ? st.idx.order.length : 0, hidden });
  }
  return { cats: cats.filter(c => c.courses.length) };   // 没有课程的分类不显示
});
/* 按需取证明、解答的正文（大课程首屏不带这些） */
app.get('/api/bodies/:slug', async req => {
  const st = await needCourse(req.params.slug);
  const out = {};
  for (const id of String(req.query.ids || '').split(',').slice(0, 300)) {
    const n = st.N[id]; if (!n) continue;
    out[id] = course.proofsOf(n).map(p => p.body);
  }
  return { bodies: out };
});
app.get('/api/search/:slug', async req => ({ ids: search.query(await needVisible(req.params.slug, req), String(req.query.q || '')).slice(0, 50) }));
/* 新写法：编辑器取源文、实时预览 */
app.get('/api/src/:slug/:id', async req => {
  const st = await needVisible(req.params.slug, req), n = st.N[req.params.id];
  if (!n) throw auth.httpError(404, '节点不存在');
  return { src: n.src, proofs: course.proofsOf(n).map(p => p.src), variants: (n.variants || []).map(v => v.src) };
});
app.post('/api/render', async req => {
  limit(req, 'render', 120);
  const src = String((req.body || {}).src || '');
  if (src.length > 20000) throw auth.httpError(400, '内容太长了');
  return await render.render(src);
});

/* ---------- 账号 ---------- */
const setSession = async (reply, uid) => { reply.setCookie(COOKIE, await auth.newSession(uid), { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === '1' : PROD, maxAge: 30 * 86400 }); };
app.get('/api/pow', async req => { limit(req, 'pow', 30); return pow.issue(); });
app.post('/api/auth/login', async (req, reply) => { limit(req, 'auth', 10); const uid = await auth.login(req.body || {}); await setSession(reply, uid); return { ok: true }; });
/* 邀请链接：查看、接受（开通账号或重设密码） */
app.get('/api/invite/:token', async req => { limit(req, 'invite', 30); const i = await auth.getInvite(req.params.token); return { kind: i.kind, admin: !!i.is_admin, nickname: i.nickname || null }; });
app.post('/api/invite/:token', async (req, reply) => { limit(req, 'invite', 10); const uid = await auth.acceptInvite(req.params.token, req.body || {}); await setSession(reply, uid); return { ok: true }; });
app.post('/api/me/password', async req => { limit(req, 'auth', 10); await auth.changePassword(need(req), req.body || {}); return { ok: true }; });
app.post('/api/auth/logout', async (req, reply) => { await auth.logout(req.cookies[COOKIE]); reply.clearCookie(COOKIE, { path: '/' }); return { ok: true }; });

app.get('/api/me', async req => {
  const u = req.user;
  if (!u) return { user: null };
  const slug = String(req.query.course || 'shuxue-jichu');
  const s = await one('SELECT state_json FROM user_state WHERE user_id = ? AND course = ?', u.id, slug);
  const pending = {
    submissions: (await one("SELECT COUNT(*) AS n FROM submissions WHERE author_id = ? AND status = 'pending'", u.id)).n,
    review: auth.canReviewAny(u) ? (await reviewCounts(u)).total : 0
  };
  return { user: auth.publicUser(u), state: s ? s.state_json : null, score: await course.load(slug) ? await wf.scoreOf(u.id, slug) : null, pending };
});
app.put('/api/state/:slug', async req => {
  const u = need(req); await needCourse(req.params.slug);
  const b = req.body || {};
  const st = { mastered: Array.isArray(b.mastered) ? b.mastered.slice(0, 5000).map(String) : [],
    hand: Array.isArray(b.hand) ? b.hand.slice(0, 400).map(x => ({ id: String(x.id), p: Number.isInteger(x.p) ? x.p : 0, note: x.note ? String(x.note).slice(0, 2000) : '',
      ...([1, 2, 3].includes(x.imp) ? { imp: x.imp } : {}), ...(Number.isInteger(x.v) && x.v > 0 && x.v <= 6 ? { v: x.v } : {}) })) : [],
    refs: Array.isArray(b.refs) ? b.refs.slice(0, 400).map(String) : [], tpl: b.tpl === 'student' ? 'student' : 'teacher' };
  await run('INSERT INTO user_state(user_id,course,state_json,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,course) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at',
    u.id, req.params.slug, JSON.stringify(st), now());
  return { ok: true };
});
app.get('/api/me/submissions', async req => {
  const u = need(req);
  return { items: await all(`SELECT s.id, s.course, s.kind, s.target, CASE WHEN s.kind = 'batch' THEN jsonb_array_length(COALESCE(s.payload_json->'items', '[]'::jsonb)) END AS n_items, (s.kind = 'batch' AND (s.payload_json->'B') IS NOT NULL) AS has_tree, s.summary, s.status, s.score, s.review_note, s.created_at, s.decided_at, r.nickname AS reviewer FROM submissions s LEFT JOIN users r ON r.id = s.reviewer_id WHERE s.author_id = ? ORDER BY s.id DESC LIMIT 100`, u.id) };
});
app.get('/api/me/applications', async req => ({ items: await all('SELECT id, kind, course, status, note, created_at FROM applications WHERE user_id = ? ORDER BY id DESC', need(req).id) }));
app.post('/api/applications', async req => { const u = need(req); await wf.apply(u, req.body || {}); return { ok: true }; });

/* ---------- 节点：历史、反馈 ---------- */
app.get('/api/node/:slug/:id/history', async req => {
  await needCourse(req.params.slug);
  const rows = await all('SELECT v.version, v.summary, v.created_at, v.data_json IS NULL AS deleted, r.nickname AS reviewer FROM versions v LEFT JOIN users r ON r.id = v.reviewer_id WHERE v.course = ? AND v.target = ? ORDER BY v.version DESC', req.params.slug, req.params.id);
  const fb = await all("SELECT f.id, f.kind, f.text, f.resolution, f.decided_at, h.nickname AS handler FROM feedback f LEFT JOIN users h ON h.id = f.handler_id WHERE f.course = ? AND f.node_id = ? AND f.status = 'resolved' ORDER BY f.id DESC LIMIT 50", req.params.slug, req.params.id);
  return { versions: rows, feedback: fb };
});
app.get('/api/version/:slug/:target/:version', async req => {
  const r = await one('SELECT data_json FROM versions WHERE course = ? AND target = ? AND version = ?', req.params.slug, req.params.target, Number(req.params.version));
  if (!r) throw auth.httpError(404, '版本不存在');
  return { data: r.data_json };
});
app.post('/api/feedback/:slug/:id', async req => {
  const u = req.user, b = req.body || {};
  limit(req, 'fb', 10);
  if (!u) pow.verify(b.pow);
  await wf.addFeedback(u, req.params.slug, req.params.id, b, crypto.createHash('sha256').update(`${POW_IP_SALT}:${req.ip}`).digest('hex').slice(0, 24));
  return { ok: true };
});

/* ---------- 编辑提交 ---------- */
app.post('/api/submissions', { bodyLimit: 8_000_000 }, async req => {
  const u = need(req), b = req.body || {};
  limit(req, 'submit', 20);
  const id = await wf.submit(u, String(b.course || ''), b);
  return { id };
});
/* 草稿篮：还没提交的改动 */
app.get('/api/draft/:slug', async req => wf.getDraft(need(req), req.params.slug));
app.put('/api/draft/:slug', { bodyLimit: 8_000_000 }, async req => { const u = need(req); limit(req, 'draft', 60); return wf.saveDraft(u, req.params.slug, req.body || {}); });
app.post('/api/check/:slug', { bodyLimit: 8_000_000 }, async req => {
  const u = need(req);
  if (!auth.canEdit(u, req.params.slug)) throw auth.httpError(403, '你还没有这门课的编辑权限');
  const b = req.body || {};
  try { return await wfCheck(await needCourse(req.params.slug), b.kind, b.kind === 'tree' ? '#tree' : b.kind === 'batch' ? '#batch' : String(b.target || ''), b.payload || {}); }
  catch (e) { if (e.statusCode && e.statusCode < 500) return { ok: false, problems: e.problems || [e.message] }; throw e; }
});
async function wfCheck(st, kind, target, payload) {
  const next = kind === 'batch' ? await wf.applyBatch(st, payload) : await wf.applyToState(st, kind, target, payload);
  const p = await course.checkFull(st, next.B, next.N);
  return { ok: !p.length, problems: p.slice(0, 30) };
}

/* ---------- 审核台 ---------- */
async function reviewCourses(u) { return u.is_admin ? (await all('SELECT slug FROM courses')).map(r => r.slug) : u.roles.filter(r => r.role === 'reviewer').map(r => r.course); }
async function reviewCounts(u) {
  const cs = await reviewCourses(u);
  if (!cs.length && !u.is_admin) return { total: 0 };
  const q = `(${cs.map(() => '?').join(',') || "''"})`;
  const subs = (await one(`SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending' AND course IN ${q} AND author_id != ?`, ...cs, u.is_admin ? -1 : u.id)).n;
  const fb = (await one(`SELECT COUNT(*) AS n FROM feedback WHERE status = 'open' AND course IN ${q}`, ...cs)).n;
  const rt = (await one(`SELECT COUNT(*) AS n FROM routes WHERE status = 'pending' AND course IN ${q}`, ...cs)).n;
  const apps = (await all("SELECT * FROM applications WHERE status = 'pending'")).filter(a => wf.canHandleApp(u, a)).length;
  return { subs, fb, routes: rt, apps, total: subs + fb + rt + apps };
}
app.get('/api/review', async req => {
  const u = need(req);
  if (!auth.canReviewAny(u)) throw auth.httpError(403, '你还不是审核者');
  const cs = await reviewCourses(u), q = `(${cs.map(() => '?').join(',') || "''"})`;
  return {
    counts: await reviewCounts(u),
    submissions: await all(`SELECT s.id, s.course, s.kind, s.target, CASE WHEN s.kind = 'batch' THEN jsonb_array_length(COALESCE(s.payload_json->'items', '[]'::jsonb)) END AS n_items, (s.kind = 'batch' AND (s.payload_json->'B') IS NOT NULL) AS has_tree, s.summary, s.created_at, s.base_version, a.nickname AS author FROM submissions s JOIN users a ON a.id = s.author_id WHERE s.status = 'pending' AND s.course IN ${q} ORDER BY s.id`, ...cs),
    feedback: await all(`SELECT f.id, f.course, f.node_id, f.kind, f.text, f.created_at, a.nickname AS author FROM feedback f LEFT JOIN users a ON a.id = f.user_id WHERE f.status = 'open' AND f.course IN ${q} ORDER BY f.id`, ...cs),
    routes: (await all(`SELECT r.id, r.course, r.title, r.descr, r.items_json AS items, r.want_featured, r.approved_json IS NOT NULL AS reshare, a.nickname AS owner, a.is_teacher AS teacher FROM routes r JOIN users a ON a.id = r.owner_id WHERE r.status = 'pending' AND r.course IN ${q} ORDER BY r.updated_at`, ...cs)),
    applications: await Promise.all((await all("SELECT p.*, u.nickname FROM applications p JOIN users u ON u.id = p.user_id WHERE p.status = 'pending' ORDER BY p.id"))
      .filter(a => wf.canHandleApp(u, a)).map(async a => ({ ...a, score: a.course ? await wf.scoreOf(a.user_id, a.course) : null })))
  };
});
app.get('/api/submissions/:id', async req => {
  const u = need(req);
  const s = await one('SELECT s.*, a.nickname AS author FROM submissions s JOIN users a ON a.id = s.author_id WHERE s.id = ?', Number(req.params.id));
  if (!s) throw auth.httpError(404, '提交不存在');
  if (s.author_id !== u.id && !auth.canReview(u, s.course)) throw auth.httpError(403, '无权查看');
  const st = await needCourse(s.course);
  const current = s.kind === 'tree' ? { B: st.B } : s.kind === 'batch' ? { B: st.B, N: Object.fromEntries((s.payload_json.items || []).map(it => [it.target, st.N[it.target] || null])) } : (st.N[s.target] || null);
  return { submission: { ...s, payload: s.payload_json, payload_json: undefined }, current, authorScore: await wf.scoreOf(s.author_id, s.course) };
});
app.post('/api/submissions/:id/decide', async req => { const r = await wf.decide(need(req), Number(req.params.id), req.body || {}); course.invalidateAll(); return r; });
app.post('/api/rollback', async req => { const b = req.body || {}; const r = await wf.rollback(need(req), String(b.course), String(b.target), b.version, b.reason); course.invalidate(String(b.course)); return r; });
app.post('/api/feedback/:id/resolve', async req => { await wf.resolveFeedback(need(req), Number(req.params.id), (req.body || {}).resolution); return { ok: true }; });
app.post('/api/applications/:id/decide', async req => { await wf.decideApp(need(req), Number(req.params.id), req.body || {}); return { ok: true }; });

/* ---------- 路线 ---------- */
const routeOut = r => ({ id: r.id, course: r.course, title: r.title, descr: r.descr, items: r.items_json, status: r.status, wantFeatured: !!r.want_featured,
  featured: !!r.featured, share: r.share_token && r.approved_json ? `${r.course === 'shuxue-jichu' ? '' : `/c/${r.course}`}/r/${r.share_token}` : null, reviewNote: r.review_note, updatedAt: r.updated_at });
app.get('/api/routes/mine', async req => ({ items: (await all('SELECT * FROM routes WHERE owner_id = ? ORDER BY updated_at DESC', need(req).id)).map(routeOut) }));
app.post('/api/routes', async req => ({ id: await wf.saveRoute(need(req), req.body || {}) }));
app.post('/api/routes/:id/share', async req => { const u = need(req); await wf.requestShare(u, Number(req.params.id)); return { ok: true }; });
app.delete('/api/routes/:id', async req => { await run('DELETE FROM routes WHERE id = ? AND owner_id = ?', Number(req.params.id), need(req).id); return { ok: true }; });
app.post('/api/routes/:id/decide', async req => { await wf.decideRoute(need(req), Number(req.params.id), req.body || {}); return { ok: true }; });
app.get('/api/routes/featured', async req => {
  const slug = String(req.query.course || 'shuxue-jichu');
  return { items: (await all('SELECT r.share_token, r.approved_json, u.nickname, u.is_teacher FROM routes r JOIN users u ON u.id = r.owner_id WHERE r.course = ? AND r.featured AND r.approved_json IS NOT NULL ORDER BY r.updated_at DESC LIMIT 50', slug))
    .map(r => ({ ...r.approved_json, token: r.share_token, author: r.nickname, teacher: !!r.is_teacher })) };
});
app.get('/api/r/:token', async req => {
  const r = await one('SELECT r.course, r.approved_json, u.nickname, u.is_teacher FROM routes r JOIN users u ON u.id = r.owner_id WHERE r.share_token = ? AND r.approved_json IS NOT NULL', req.params.token);
  if (!r) throw auth.httpError(404, '这个分享链接不存在，或路线还没有通过审核');
  return { course: r.course, ...r.approved_json, author: r.nickname, teacher: !!r.is_teacher };
});

/* ---------- PDF 与 .tex ---------- */
/* 新写法的课程用 Typst 排版，旧课程仍用 xelatex */
const buildDoc = async (slug, body, req) => {
  const st = await needVisible(slug, req);
  return wf.isTypst(st) ? { kind: 'typ', text: await typpdf.buildTyp(slug, body) } : { kind: 'tex', text: await tex.buildTex(slug, body) };
};
app.post('/api/pdf/:slug', async req => {
  limit(req, 'pdf', 6);
  const d = await buildDoc(req.params.slug, req.body || {}, req);
  return await tex.enqueue(d.text, req.user ? req.user.id : null, d.kind);
});
app.get('/api/pdf/job/:id', async req => {
  const s = await tex.jobStatus(req.params.id);
  if (!s) throw auth.httpError(404, '任务不存在');
  return { status: s.status, error: s.error, position: s.position };
});
app.get('/api/pdf/file/:id', async (req, reply) => {
  const s = await tex.jobStatus(req.params.id);
  if (!s || s.status !== 'done' || !fs.existsSync(s.file)) throw auth.httpError(404, 'PDF 还没生成好');
  reply.header('content-disposition', `attachment; filename="maki-notes.pdf"; filename*=UTF-8''${encodeURIComponent('我的讲义.pdf')}`).type('application/pdf');
  return reply.send(fs.createReadStream(s.file));
});
app.post('/api/tex/:slug', async (req, reply) => {
  const d = await buildDoc(req.params.slug, req.body || {}, req), ext = d.kind === 'typ' ? 'typ' : 'tex';
  reply.header('content-disposition', `attachment; filename="maki-notes.${ext}"; filename*=UTF-8''${encodeURIComponent('我的讲义.' + ext)}`).type('text/plain; charset=utf-8');
  return d.text;
});

/* ---------- 超级管理员 ---------- */
const needAdmin = req => { const u = need(req); if (!u.is_admin) throw auth.httpError(403, '只有超级管理员可以操作'); return u; };
app.get('/api/admin/users', async req => {
  needAdmin(req);
  const q = `%${String(req.query.q || '').trim()}%`;
  const users = await all('SELECT id, nickname, phone, email, is_admin, is_teacher, banned, created_at FROM users WHERE nickname LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY id DESC LIMIT 50', q, q, q);
  for (const u of users) { u.phone = auth.maskPhone(u.phone); u.email = auth.maskEmail(u.email); }
  for (const u of users) u.roles = await all('SELECT course, role FROM course_roles WHERE user_id = ?', u.id);
  return { items: users };
});
app.post('/api/admin/users/:id', async req => {
  const a = needAdmin(req), id = Number(req.params.id), b = req.body || {};
  if (b.role) {
    if (!['editor', 'reviewer'].includes(b.role) || !await course.load(b.course)) throw auth.httpError(400, '参数不对');
    if (b.grant) await run('INSERT INTO course_roles(user_id,course,role,granted_by,created_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING', id, b.course, b.role, a.id, now());
    else await run('DELETE FROM course_roles WHERE user_id = ? AND course = ? AND role = ?', id, b.course, b.role);
  }
  if (typeof b.phone === 'string') await auth.setPhone(id, b.phone);
  if (typeof b.teacher === 'boolean') await run('UPDATE users SET is_teacher = ? WHERE id = ?', b.teacher, id);
  if (typeof b.banned === 'boolean') { await run('UPDATE users SET banned = ? WHERE id = ?', b.banned, id); if (b.banned) await run('DELETE FROM sessions WHERE user_id = ?', id); }
  return { ok: true };
});

app.get('/api/admin/invites', async req => {
  needAdmin(req);
  return { items: await all("SELECT i.id, i.token, i.kind, i.note, i.expires_at, i.used_at, i.created_at, u.nickname AS used_nickname, t.nickname AS target FROM invites i LEFT JOIN users u ON u.id = i.used_by LEFT JOIN users t ON t.id = i.user_id ORDER BY i.id DESC LIMIT 50") };
});
app.post('/api/admin/invites', async req => {
  const a = needAdmin(req), b = req.body || {};
  if (b.resetFor) {
    const t = await one('SELECT id, nickname FROM users WHERE id = ?', Number(b.resetFor));
    if (!t) throw auth.httpError(404, '用户不存在');
    return { token: await auth.createInvite(a.id, { kind: 'reset', userId: t.id, note: `重设 ${t.nickname} 的密码`, days: 2 }) };
  }
  return { token: await auth.createInvite(a.id, { note: String(b.note || '').slice(0, 200) }) };
});
app.delete('/api/admin/invites/:id', async req => { needAdmin(req); await run('UPDATE invites SET expires_at = 0 WHERE id = ? AND used_at IS NULL', Number(req.params.id)); return { ok: true }; });

/* 编辑器用：前置课程的节点目录（跨课程引用时选择） */
app.get('/api/catalog/:slug', async req => {
  const st = await needCourse(req.params.slug);
  const out = {};
  for (const id of st.idx.order) { const n = st.N[id]; out[id] = [n.title, n.type]; }
  return { slug: st.slug, title: st.meta.title, nodes: out };
});

app.get('/healthz', async () => ({ ok: true }));

const PORT = Number(process.env.PORT || 3000), HOST = process.env.HOST || '127.0.0.1';
async function boot() {
  await seedAll(false);
  const setup = await auth.ensureAdminSetup();
  if (setup) {
    const url = `${process.env.PUBLIC_URL || `http://${HOST}:${PORT}`}/invite/${setup}`;
    console.log(`\n还没有超级管理员。用浏览器打开下面的链接设置（30 天内有效，只能用一次）：\n${url}\n`);
    try { fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '..', 'data', 'admin-setup-link.txt'), url + '\n', { mode: 0o600 }); } catch (e) { }
  }
  await run("UPDATE pdf_jobs SET status = 'error', error = '服务器重启，请重新生成' WHERE status IN ('queued','running')");
  await app.listen({ port: PORT, host: HOST });
  console.log(`maki-math 已启动：http://${HOST}:${PORT}`);
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await app.close(); await close(); process.exit(0); });
if (require.main === module) boot().catch(e => { console.error(e); process.exit(1); });
module.exports = { app, boot };
