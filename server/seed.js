'use strict';
/* 首次导入：把 content/<课程>/ 里的原始数据写进数据库。
   已经导入过的课程不会被覆盖（线上改动以数据库为准）。加 --force 可以重新导入。 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { run, one, all, tx, now, migrate, close } = require('./db');
const { check, fixNode, proofsOf } = require('./course');
const { renderMany } = require('./render');
const { toNew } = require('./convert');

const COURSES = [
  { slug: 'shuxue-jichu', title: '数学基础', category: '逻辑与基础', live: 1, pos: 1,
    descr: '高中到大学的衔接：命题、集合、映射、实数、复数、组合与初等数论。',
    files: ['data.js', 'ch1b.js', 'ch2.js', 'ch3.js', 'ch4.js', 'ch5.js', 'ch67.js', 'ch89.js', 'data_extra.js'], settings: { format: 'typst' } },
  { slug: 'xiandai-feishuxue', title: '非数学系线性代数', category: '代数', live: 1, pos: 2,
    descr: '只在 ℝ 和 ℂ 上讨论：向量、点乘、线性映射与矩阵、行列式、线性方程组、特征值与对角化。以「数学基础」为前置课。',
    files: ['data.js', 'data2.js'], prereqs: ['shuxue-jichu'], contentVersion: 2, settings: { proofOptional: true, hidden: true } },
  { slug: 'xiandai-shuxue', title: '数学系线性代数', category: '代数', live: 0, pos: 3,
    descr: '一般域 F 上的线性代数，可以引用非数学系版的节点。', files: null, prereqs: ['shuxue-jichu', 'xiandai-feishuxue'], settings: { hidden: true } },
  { slug: 'chudeng-shulun', title: '初等数论', category: '数论', live: 1, pos: 4,
    descr: '整除、最大公因数、算术基本定理、同余、中国剩余定理、Euler/Fermat/Wilson、二次互反律与原根。以「数学基础」为前置课。',
    files: ['data.js'], prereqs: ['shuxue-jichu'], settings: { hidden: true } },
  { slug: 'kaoyan', title: '考研数学', category: '考研', live: 1, pos: 10,
    descr: '数一、数二、数三全覆盖：8 编 66 讲，2010–2026 年 843 道真题逐题详解。自成体系，不需要前置课程。',
    files: ['data.js'], contentVersion: 2, settings: { proofOptional: true, lazy: true, mathjax: ['mathtools', 'unicode'], hidden: true } }
];

function evalCourse(dir, files) {
  const code = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
    '\n;({ B, N, CH_EDGES, CH_POS })';
  return vm.runInNewContext(code, {}, { timeout: 5000 });
}

/* ---------- 新写法（Markdown + Typst） ----------
   content/<课>/typst.json 是人工核对过的转换结果（键为「节点/字段」，字段是 body、p0、v0…）。
   旧内容和内容文件里的原文完全一样时用它；不一样（线上改过）就自动转换。 */
function fieldsOf(n) {
  const out = [['body', n]];
  proofsOf(n).forEach((p, i) => out.push(['p' + i, p]));
  (n.variants || []).forEach((v, i) => out.push(['v' + i, v]));
  return out;
}
async function typstify(c, N, orig) {
  const f = path.join(__dirname, '..', 'content', c.slug, 'typst.json');
  const cur = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  const slots = [];
  for (const [id, n] of Object.entries(N)) for (const [w, x] of fieldsOf(n)) {
    if (x.src != null) continue;
    const o = orig && orig[id] && (fieldsOf(orig[id]).find(([k]) => k === w) || [])[1];
    const same = !orig || (o && o.body === x.body);
    slots.push({ x, src: same && cur[`${id}/${w}`] ? cur[`${id}/${w}`].src : toNew(x.body), key: `${id}/${w}` });
  }
  const out = await renderMany(slots.map(s => s.src));
  let bad = 0;
  slots.forEach((s, i) => { s.x.src = s.src; s.x.body = out[i].html; if (out[i].errors.length) { bad++; console.warn(`  ${s.key}：${out[i].errors[0].msg}`); } });
  console.log(`${c.title}：${slots.length} 段转成 Markdown + Typst${bad ? `，其中 ${bad} 段有公式需要手工修改` : ''}`);
}
async function migrateTypst(c) {
  const rows = await all('SELECT id, data_json, version FROM nodes WHERE course = ?', c.slug);
  const N = {};
  for (const r of rows) N[r.id] = r.data_json;
  let orig = null;
  if (c.files) { orig = JSON.parse(JSON.stringify(evalCourse(path.join(__dirname, '..', 'content', c.slug), c.files).N)); for (const n of Object.values(orig)) fixNode(n); }
  await typstify(c, N, orig);
  const subs = await all("SELECT id, payload_json FROM submissions WHERE course = ? AND status = 'pending' AND kind = 'node'", c.slug);
  await tx(async () => {
    for (const r of rows) {
      const n = N[r.id], v = (await one('SELECT MAX(version) AS v FROM versions WHERE course = ? AND target = ?', c.slug, r.id) || {}).v || r.version;
      await run('UPDATE nodes SET data_json = ?, version = ?, updated_at = ? WHERE course = ? AND id = ?', JSON.stringify(n), v + 1, now(), c.slug, r.id);
      await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
        c.slug, r.id, v + 1, JSON.stringify(n), '改用 Markdown + Typst 写法', null, null, now());
    }
    /* 还没审核的提交：把正文转成新写法，审核时再编译 */
    for (const sub of subs) {
      const p = sub.payload_json;
      if (p && p.data) { for (const [, x] of fieldsOf(p.data)) if (x.src == null) x.src = toNew(x.body); }
      await run('UPDATE submissions SET payload_json = ? WHERE id = ?', JSON.stringify(p), sub.id);
    }
    await run('UPDATE courses SET updated_at = ? WHERE slug = ?', now(), c.slug);
  });
}

async function seedCourse(c, force) {
  const exists = await one('SELECT slug, settings_json, tree_version FROM courses WHERE slug = ?', c.slug);
  /* 内容升级：代码里的内容版本更新了，而且线上还没有人改过这门课，就自动重新导入 */
  if (exists && !force && c.contentVersion && ((exists.settings_json || {}).contentVersion || 1) < c.contentVersion) {
    const edited = exists.tree_version > 1 || await one('SELECT 1 AS x FROM versions WHERE course = ? AND version > 1 LIMIT 1', c.slug);
    if (edited) console.warn(`${c.title} 已有线上修改，不自动覆盖新内容（需要的话手动运行 seed --force --only=${c.slug}）`);
    else force = true;
  }
  /* 改用新写法：线上已有的内容就地转换（保留所有线上修改），转换完成后才记下新格式 */
  if (exists && !force && (c.settings || {}).format === 'typst' && (exists.settings_json || {}).format !== 'typst') await migrateTypst(c);
  /* 前置课程关系以这里为准，每次启动都同步 */
  if (exists) await run('UPDATE courses SET prereqs_json = ?, settings_json = ?, live = ? WHERE slug = ?', JSON.stringify(c.prereqs || []), JSON.stringify({ ...(c.settings || {}), ...(c.contentVersion ? { contentVersion: c.contentVersion } : {}) }), !!c.live, c.slug);
  if (exists && !force) return false;
  let B = { root: { title: c.title, ordered: true, kids: [] } }, N = {}, graph = {};
  if (c.files) {
    const r = evalCourse(path.join(__dirname, '..', 'content', c.slug), c.files);
    B = JSON.parse(JSON.stringify(r.B)); N = JSON.parse(JSON.stringify(r.N));
    for (const n of Object.values(N)) fixNode(n);
    graph = { edges: r.CH_EDGES, pos: r.CH_POS };
    /* 跨课程引用：前置课程已经在数据库里（COURSES 按顺序导入） */
    const extIds = new Set();
    for (const cs of c.prereqs || []) for (const r of await all('SELECT id FROM nodes WHERE course = ?', cs)) extIds.add(`${cs}:${r.id}`);
    const problems = check(B, N, d => extIds.has(d), c.settings || {});
    if (problems.length) { console.error(problems.slice(0, 20).join('\n')); throw new Error(`${c.title} 未通过顺序检查`); }
    if ((c.settings || {}).format === 'typst') await typstify(c, N, null);
  }
  await tx(async () => {
    if (exists) { await run('DELETE FROM versions WHERE course = ?', c.slug); await run('DELETE FROM nodes WHERE course = ?', c.slug); await run('DELETE FROM courses WHERE slug = ?', c.slug); }
    await run('INSERT INTO courses(slug,title,category,descr,live,pos,tree_json,graph_json,tree_version,updated_at,prereqs_json,settings_json) VALUES (?,?,?,?,?,?,?,?,1,?,?,?)',
      c.slug, c.title, c.category, c.descr, !!c.live, c.pos, JSON.stringify(B), JSON.stringify(graph), now(), JSON.stringify(c.prereqs || []), JSON.stringify({ ...(c.settings || {}), ...(c.contentVersion ? { contentVersion: c.contentVersion } : {}) }));
    await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
      c.slug, '#tree', 1, JSON.stringify({ B, graph }), '首次导入', null, null, now());
    for (const [id, n] of Object.entries(N)) {
      await run('INSERT INTO nodes(course,id,data_json,version,reviewer_id,updated_at) VALUES (?,?,?,1,NULL,?)', c.slug, id, JSON.stringify(n), now());
      await run('INSERT INTO versions(course,target,version,data_json,summary,author_id,reviewer_id,created_at) VALUES (?,?,?,?,?,?,?,?)',
        c.slug, id, 1, JSON.stringify(n), '由 Maki 手写讲义录入', null, null, now());
    }
  });
  console.log(`已导入 ${c.title}：${Object.keys(N).length} 个节点`);
  return true;
}

/* 彻底删除的课程：启动时清掉数据库里与它有关的一切（课程、节点、版本、提交、反馈、进度、路线、权限、日志） */
const PURGED = [];   // 要彻底删除的课程编号，例如 ['old-course']
async function purge() {
  for (const slug of PURGED) {
    if (!await one('SELECT 1 AS x FROM courses WHERE slug = ?', slug)) continue;
    await tx(async () => {
      for (const t of ['nodes', 'versions', 'course_roles', 'applications', 'submissions', 'score_events', 'feedback', 'user_state', 'routes']) await run(`DELETE FROM ${t} WHERE course = ?`, slug);
      await run('DELETE FROM audit_log WHERE detail LIKE ?', `%"${slug}"%`);
      await run('DELETE FROM courses WHERE slug = ?', slug);
    });
    /* 讲义 PDF 缓存里可能有这门课的内容：全部清掉（只是缓存，需要时会重新生成） */
    const dir = path.join(__dirname, '..', 'data', 'pdf');
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.pdf')) fs.rmSync(path.join(dir, f), { force: true });
    console.log(`已彻底删除课程 ${slug}`);
  }
}
async function seedAll(force, only) { await migrate(); for (const c of COURSES) await seedCourse(c, force && (!only || only === c.slug)); await purge(); }

/* node server/seed.js --force --only=kaoyan 只重新导入一门课 */
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || null;
if (require.main === module) seedAll(process.argv.includes('--force'), ONLY).then(close, e => { console.error(e); process.exit(1); });
module.exports = { seedAll, evalCourse };
