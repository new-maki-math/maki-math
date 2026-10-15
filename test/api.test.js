'use strict';
/* 端到端测试：用测试数据库跑一遍注册、申请、提交、审核、回滚、反馈、路线、PDF */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://maki:maki-dev@127.0.0.1:5432/maki_test';
process.env.POW_BITS = '8';
process.env.RATE_MULT = '100';
const crypto = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pool, one } = require('../server/db');
const { app } = require('../server/index');
const { seedAll } = require('../server/seed');
const auth = require('../server/auth');

const H = { 'x-mm': '1' };
function client() {
  let cookie = '';
  const call = async (method, url, payload) => {
    const r = await app.inject({ method, url, payload, headers: { ...H, cookie } });
    const sc = r.headers['set-cookie'];
    if (sc) cookie = (Array.isArray(sc) ? sc : [sc]).map(c => c.split(';')[0]).join('; ');
    let body; try { body = r.json(); } catch { body = r.body; }
    return { status: r.statusCode, body, raw: r };
  };
  return call;
}
async function solve(call) {
  const { challenge, bits } = (await call('GET', '/api/pow')).body;
  const { zeroBits } = require('../server/pow');
  for (let i = 0; ; i++) if (zeroBits(crypto.createHash('sha256').update(`${challenge}:${i}`).digest()) >= bits) return { challenge, nonce: String(i) };
}
async function join(call, token, nickname, email) {
  const r = await call('POST', `/api/invite/${token}`, { nickname, email, password: 'password123' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
}

test.before(async () => {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await seedAll(false);
  await app.ready();
});
test.after(async () => { await app.close(); await pool.end(); });

test('完整流程', async () => {
  const admin = client(), ed = client(), anon = client();

  /* 课程数据 */
  const data = await anon('GET', '/c/shuxue-jichu/data.js');
  assert.equal(data.status, 200);
  assert.match(data.raw.body, /const N=/);
  const courses = await anon('GET', '/api/courses');
  assert.equal(courses.body.cats[0].courses[0].nodes, 321);

  /* 没有自定义头的修改请求被拒绝 */
  const csrf = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { account: 'x', password: 'y' } });
  assert.equal(csrf.statusCode, 403);
  /* 没有公开注册接口 */
  assert.equal((await anon('POST', '/api/auth/register', { email: 'a@b.cn' })).status, 404);

  /* 第一次启动：用「设置超管」链接开通超管，链接只能用一次 */
  const setup = await auth.ensureAdminSetup();
  assert.equal((await anon('GET', `/api/invite/${setup}`)).body.admin, true);
  await join(admin, setup, 'Maki');
  assert.equal(await auth.ensureAdminSetup(), null);
  assert.equal((await client()('POST', `/api/invite/${setup}`, { nickname: '冒充', password: 'password123' })).status, 404);

  /* 超管生成邀请链接 → 编辑甲开通账号 */
  assert.equal((await ed('POST', '/api/admin/invites', {})).status, 401);
  const inv = (await admin('POST', '/api/admin/invites', { note: '编辑甲' })).body.token;
  await join(ed, inv, '编辑甲', 'Editor@Example.com');
  assert.equal((await admin('GET', '/api/me')).body.user.isAdmin, true);
  assert.equal((await ed('GET', '/api/me')).body.user.isAdmin, false);
  /* 昵称或邮箱都能登录；错误密码不行 */
  assert.equal((await client()('POST', '/api/auth/login', { account: 'editor@example.com', password: 'password123' })).status, 200);
  assert.equal((await client()('POST', '/api/auth/login', { account: '编辑甲', password: 'password123' })).status, 200);
  assert.equal((await client()('POST', '/api/auth/login', { account: '编辑甲', password: 'wrong-password' })).status, 400);
  /* 超管登记手机号后，手机号也能登录 */
  const edId = (await ed('GET', '/api/me')).body.user.id;
  assert.equal((await admin('POST', `/api/admin/users/${edId}`, { phone: '13900000001' })).status, 200);
  assert.equal((await client()('POST', '/api/auth/login', { account: '13900000001', password: 'password123' })).status, 200);
  /* 重设密码链接 */
  const rs = (await admin('POST', '/api/admin/invites', { resetFor: edId })).body.token;
  assert.equal((await anon('GET', `/api/invite/${rs}`)).body.nickname, '编辑甲');
  const ed2 = client();
  assert.equal((await ed2('POST', `/api/invite/${rs}`, { password: 'newpassword1' })).status, 200);
  assert.equal((await ed('GET', '/api/me')).body.user, null);   // 旧会话失效
  assert.equal((await ed('POST', '/api/auth/login', { account: '编辑甲', password: 'newpassword1' })).status, 200);

  /* 没有编辑权限不能提交 */
  const no = await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'prop', payload: { data: {} }, summary: 'x' });
  assert.equal(no.status, 403);

  /* 申请编辑 → 超管通过 */
  assert.equal((await ed('POST', '/api/applications', { kind: 'editor', course: 'shuxue-jichu', material: '样稿：命题的定义……' })).status, 200);
  const rv = await admin('GET', '/api/review');
  assert.equal(rv.body.applications.length, 1);
  assert.equal((await admin('POST', `/api/applications/${rv.body.applications[0].id}/decide`, { approve: true })).status, 200);

  /* 违反顺序的提交被挡下：让「命题」依赖后面的「蕴含」 */
  const N0 = (await one("SELECT data_json FROM nodes WHERE course = 'shuxue-jichu' AND id = 'prop'")).data_json;
  const bad = await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'prop', payload: { data: { ...N0, deps: ['imp'] } }, summary: '加个前置' });
  assert.equal(bad.status, 422);
  assert.ok(bad.body.problems.some(p => p.includes('不在它前面')));

  /* 正常提交 → 审核通过 → 版本 +1，放行人记录在案 */
  const good = await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'prop', payload: { data: { ...N0, body: '命题是**能判断真假**的陈述句，比如 $1 + 1 = 2$。' } }, summary: '改写定义' });
  assert.equal(good.status, 200, JSON.stringify(good.body));
  const selfReview = await ed('POST', `/api/submissions/${good.body.id}/decide`, { approve: true, score: 3 });
  assert.equal(selfReview.status, 403);
  const ok = await admin('POST', `/api/submissions/${good.body.id}/decide`, { approve: true, score: 3 });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.version, 2);
  const row = await one("SELECT data_json, reviewer_id FROM nodes WHERE course = 'shuxue-jichu' AND id = 'prop'");
  assert.match(row.data_json.body, /能判断真假/);
  assert.match(row.data_json.body, /<strong>能判断真假<\/strong>/);
  assert.match(row.data_json.body, /<math>/);
  assert.equal(row.data_json.src, '命题是**能判断真假**的陈述句，比如 $1 + 1 = 2$。');
  assert.ok(row.reviewer_id);
  assert.match((await anon('GET', '/c/shuxue-jichu/data.js')).raw.body, /能判断真假/);

  /* 新增节点 */
  const add = await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'ex_new', payload: { bubble: 'b1a', data: { type: 'example', imp: 1, title: '例：一个新例子', body: '判断 $1+1=2$ 是不是命题。', attach: ['prop'], sols: [{ name: '直接', deps: ['prop'], body: '是，而且为真。' }] } }, summary: '新增例题' });
  assert.equal(add.status, 200, JSON.stringify(add.body));
  assert.equal((await admin('POST', `/api/submissions/${add.body.id}/decide`, { approve: true, score: 2 })).status, 200);
  assert.ok((await anon('GET', '/c/shuxue-jichu/data.js')).raw.body.includes('ex_new'));

  /* 回滚「命题」到第 1 版，作者被扣分 */
  const rb = await admin('POST', '/api/rollback', { course: 'shuxue-jichu', target: 'prop', version: 1, reason: '测试回滚' });
  assert.equal(rb.status, 200, JSON.stringify(rb.body));
  assert.equal(rb.body.version, 3);
  const me = await ed('GET', '/api/me');
  assert.equal(me.body.score.accepted, 2);
  assert.equal(me.body.score.hidden, 2);   // 3 + 2 − 3
  const hist = await anon('GET', '/api/node/shuxue-jichu/prop/history');
  assert.equal(hist.body.versions.length, 3);

  /* 打包提交：先存进待提交（草稿篮），再一次性提交多个节点 + 结构调整 */
  assert.deepEqual((await ed('GET', '/api/draft/shuxue-jichu')).body.items, []);
  const ex1 = { type: 'example', imp: 1, title: '例：打包一', body: '判断 $2 > 1$ 是不是命题。', attach: ['prop'], sols: [{ name: '直接', deps: ['prop'], body: '是。' }] };
  const ex2 = { type: 'exercise', imp: 1, title: '练习：打包二', body: '仿照 [[ex_b1]] 再举一个例子。', attach: ['ex_b1'], sols: [{ name: '提示', deps: ['ex_b1'], body: '比如 $3 > 2$。' }] };
  assert.equal((await ed('PUT', '/api/draft/shuxue-jichu', { items: [{ target: 'ex_b1', data: ex1, bubble: 'b1a', isNew: true }], summary: '草稿' })).status, 200);
  assert.equal((await ed('GET', '/api/draft/shuxue-jichu')).body.items[0].target, 'ex_b1');
  assert.equal((await anon('PUT', '/api/draft/shuxue-jichu', { items: [] })).status, 401);
  const Bnow = (await one("SELECT tree_json FROM courses WHERE slug = 'shuxue-jichu'")).tree_json;
  const B2 = JSON.parse(JSON.stringify(Bnow)); B2.b1a.desc = '打包时顺手改的简介';
  const N1 = (await one("SELECT data_json FROM nodes WHERE course = 'shuxue-jichu' AND id = 'prop'")).data_json;
  const batch = { B: B2, items: [{ target: 'ex_b1', data: ex1, bubble: 'b1a' }, { target: 'ex_b2', data: ex2, bubble: 'b1a' }, { target: 'prop', data: { ...N1, body: '命题：能判断真假的陈述句。' } }] };
  /* 包里引用了不存在的节点：整包被挡下，并指出是哪一个 */
  const badB = await ed('POST', '/api/check/shuxue-jichu', { kind: 'batch', payload: { items: [batch.items[1]] } });
  assert.equal(badB.body.ok, false);
  assert.equal((await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'batch', payload: { items: [batch.items[0], batch.items[0]] }, summary: 'x' })).status, 400);
  assert.equal((await ed('POST', '/api/check/shuxue-jichu', { kind: 'batch', payload: batch })).body.ok, true);
  const bs = await ed('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'batch', payload: batch, summary: '一次加两道题' });
  assert.equal(bs.status, 200, JSON.stringify(bs.body));
  const rvB = (await admin('GET', '/api/review')).body.submissions.find(x => x.id === bs.body.id);
  assert.equal(rvB.n_items, 3); assert.equal(rvB.has_tree, true);
  const detB = await admin('GET', `/api/submissions/${bs.body.id}`);
  assert.equal(detB.body.current.N.ex_b1, null);
  assert.match(detB.body.current.N.prop.body, /陈述句/);
  /* 审核前「命题」又被别人改了一版：通过时提示已合并 */
  const okB = await admin('POST', `/api/submissions/${bs.body.id}/decide`, { approve: true, score: 3 });
  assert.equal(okB.status, 200, JSON.stringify(okB.body));
  assert.equal(okB.body.count, 3);
  const ids = (await pool.query("SELECT id FROM nodes WHERE course = 'shuxue-jichu' AND id IN ('ex_b1','ex_b2')")).rows.map(r => r.id).sort();
  assert.deepEqual(ids, ['ex_b1', 'ex_b2']);
  assert.match((await one("SELECT data_json FROM nodes WHERE course = 'shuxue-jichu' AND id = 'prop'")).data_json.src, /能判断真假的陈述句/);
  const treeAfter = (await one("SELECT tree_json FROM courses WHERE slug = 'shuxue-jichu'")).tree_json;
  assert.equal(treeAfter.b1a.desc, '打包时顺手改的简介');
  assert.ok(treeAfter.b1a.kids.indexOf('ex_b1') < treeAfter.b1a.kids.indexOf('ex_b2'));
  assert.ok(await one("SELECT 1 AS x FROM versions WHERE course = 'shuxue-jichu' AND target = '#tree' AND summary LIKE '打包提交%'"));
  assert.equal((await ed('GET', '/api/me')).body.score.accepted, 5);   // 包里 3 个节点各算一次
  /* 清空草稿 */
  assert.equal((await ed('PUT', '/api/draft/shuxue-jichu', { items: [] })).status, 200);
  assert.equal((await one("SELECT COUNT(*)::int AS n FROM drafts")).n, 0);

  /* 反馈 → 处理 → 公开 */
  /* 访客也能反馈，但要先做计算验证 */
  assert.equal((await anon('POST', '/api/feedback/shuxue-jichu/prop', { kind: '内容有错', text: 'x' })).status, 400);
  assert.equal((await anon('POST', '/api/feedback/shuxue-jichu/prop', { kind: '内容有错', text: '访客反馈', pow: await solve(anon) })).status, 200);
  assert.equal((await ed('POST', '/api/feedback/shuxue-jichu/prop', { kind: '表述不清', text: '「陈述句」能不能举个例子？' })).status, 200);
  const fbs = (await admin('GET', '/api/review')).body.feedback;
  assert.equal(fbs.length, 2);
  const fb = fbs[1];
  assert.equal((await admin('POST', `/api/feedback/${fb.id}/resolve`, { resolution: '已在例题里补充' })).status, 200);
  assert.equal((await anon('GET', '/api/node/shuxue-jichu/prop/history')).body.feedback.length, 1);

  /* 路线：保存（私有）→ 申请分享 → 审核通过 → 分享链接可见 */
  const route = await ed('POST', '/api/routes', { course: 'shuxue-jichu', title: '命题入门', descr: '三节课', items: [{ id: 'prop', p: 0, note: '先讲定义' }, { id: 'not', p: 0 }], wantFeatured: true });
  assert.equal(route.status, 200);
  let mine = (await ed('GET', '/api/routes/mine')).body.items[0];
  assert.equal(mine.status, 'private');
  assert.equal(mine.share, null);
  await ed('POST', `/api/routes/${route.body.id}/share`);
  const rq = (await admin('GET', '/api/review')).body.routes;
  assert.equal(rq.length, 1);
  assert.equal(rq[0].items[0].note, '先讲定义');
  assert.equal((await admin('POST', `/api/routes/${route.body.id}/decide`, { approve: true, featured: true })).status, 200);
  mine = (await ed('GET', '/api/routes/mine')).body.items[0];
  assert.ok(mine.share);
  const shared = await anon('GET', `/api/r/${mine.share.slice(3)}`);
  assert.equal(shared.body.title, '命题入门');
  assert.equal((await anon('GET', '/api/routes/featured')).body.items.length, 1);
  /* 修改已分享的路线：重新待审，分享链接仍显示上次通过的版本 */
  await ed('POST', '/api/routes', { id: route.body.id, course: 'shuxue-jichu', title: '命题入门（改）', items: [{ id: 'prop', p: 0 }] });
  assert.equal((await anon('GET', `/api/r/${mine.share.slice(3)}`)).body.title, '命题入门');

  /* 学习状态同步 */
  assert.equal((await ed('PUT', '/api/state/shuxue-jichu', { mastered: ['prop'], hand: [{ id: 'not', p: 0 }], refs: [], tpl: 'student' })).status, 200);
  assert.deepEqual((await ed('GET', '/api/me')).body.state.mastered, ['prop']);

  /* PDF：排队 → 完成 → 下载；相同内容直接命中缓存 */

  /* ---------- 等价说法（变体） ---------- */
  const D0 = (await one("SELECT data_json FROM nodes WHERE course = 'shuxue-jichu' AND id = 'not'")).data_json;
  const vsub = await admin('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'not', payload: { data: { ...D0, variants: [{ name: '真值表说法', body: '$not p$ 与 $p$ 真假相反。' }] } }, summary: '加等价说法' });
  assert.equal(vsub.status, 200, JSON.stringify(vsub.body));
  /* 新写法：LaTeX 命令、# 代码都被挡下 */
  const lx = await admin('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'not', payload: { data: { ...D0, body: '$\\neg p$ 与 $p$ 相反' } }, summary: 'LaTeX' });
  assert.equal(lx.status, 422); assert.ok(lx.body.problems.some(p => p.includes('LaTeX') && p.includes('not')));
  const hs = await admin('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'node', target: 'not', payload: { data: { ...D0, body: '$#read("/etc/passwd")$' } }, summary: 'code' });
  assert.equal(hs.status, 422);
  const rd = await anon('POST', '/api/render', { src: '**粗** $x^2$ 和 $ab$' });
  assert.equal(rd.status, 200); assert.match(rd.body.html, /<strong>粗<\/strong>/); assert.equal(rd.body.errors.length, 1);
  assert.equal((await admin('POST', `/api/submissions/${vsub.body.id}/decide`, { approve: true, score: 3 })).status, 200);
  const dj = (await anon('GET', '/c/shuxue-jichu/data.js')).raw.body;
  assert.match(dj, /真值表说法/);

  /* ---------- 泡泡变绿阈值 ---------- */
  const B0 = (await one("SELECT tree_json FROM courses WHERE slug = 'shuxue-jichu'")).tree_json;
  const badT = JSON.parse(JSON.stringify(B0)); badT.b1.green = 0.3;
  assert.equal((await admin('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'tree', payload: { B: badT }, summary: "阈值" })).status, 400);
  const goodT = JSON.parse(JSON.stringify(B0)); goodT.b1.green = 0.9; goodT.b1.junk = "<script>";
  const gsub = await admin('POST', '/api/submissions', { course: 'shuxue-jichu', kind: 'tree', payload: { B: goodT }, summary: "P1 要求 90%" });
  assert.equal(gsub.status, 200, JSON.stringify(gsub.body));
  assert.equal((await admin('POST', `/api/submissions/${gsub.body.id}/decide`, { approve: true, score: 2 })).status, 200);
  const B1 = (await one("SELECT tree_json FROM courses WHERE slug = 'shuxue-jichu'")).tree_json;
  assert.equal(B1.b1.green, 0.9); assert.equal(B1.b1.junk, undefined);

  /* ---------- 跨课程前置 ---------- */
  const LA = 'xiandai-shuxue';   // 还没有内容的课程
  const t1 = await admin('POST', '/api/submissions', { course: LA, kind: 'tree', payload: { B: { root: { title: '数学系线性代数', ordered: true, kids: ['v1'] }, v1: { title: '向量', ordered: true, kids: [] } } }, summary: '建第一节' });
  assert.equal(t1.status, 200, JSON.stringify(t1.body));
  assert.equal((await admin('POST', `/api/submissions/${t1.body.id}/decide`, { approve: true, score: 2 })).status, 200);
  const vecNode = deps => ({ bubble: 'v1', data: { type: 'def', imp: 3, title: '向量', body: '由 [[shuxue-jichu:prop]] 出发……', deps } });
  const x1 = await admin('POST', '/api/submissions', { course: LA, kind: 'node', target: 'vec', payload: vecNode(['shuxue-jichu:nope']), summary: 'x' });
  assert.equal(x1.status, 422);
  const x2 = await admin('POST', '/api/submissions', { course: LA, kind: 'node', target: 'vec', payload: vecNode(['kaoyan:abc']), summary: 'x' });
  assert.equal(x2.status, 422);
  assert.ok(x2.body.problems.some(p => p.includes('前置课程')));
  const x3 = await admin('POST', '/api/submissions', { course: LA, kind: 'node', target: 'vec', payload: vecNode(['shuxue-jichu:prop']), summary: '新增向量' });
  assert.equal(x3.status, 200, JSON.stringify(x3.body));
  assert.equal((await admin('POST', `/api/submissions/${x3.body.id}/decide`, { approve: true, score: 2 })).status, 200);
  /* 下架的课程只有超管看得到 */
  assert.equal((await anon('GET', `/c/${LA}/data.js`)).status, 200);
  await pool.query(`UPDATE courses SET settings_json = settings_json || '{"hidden": true}'::jsonb WHERE slug = $1`, [LA]);
  require('../server/course').invalidate(LA);
  assert.equal((await anon('GET', `/c/${LA}/data.js`)).status, 404);
  assert.equal((await admin('GET', `/c/${LA}/data.js`)).status, 200);
  assert.ok(!(await anon('GET', '/api/courses')).body.cats.some(c => c.courses.some(x => x.id === LA)));
  assert.ok((await admin('GET', '/api/courses')).body.cats.some(c => c.courses.some(x => x.id === LA && x.hidden)));
  await pool.query(`UPDATE courses SET settings_json = settings_json - 'hidden' WHERE slug = $1`, [LA]);
  require('../server/course').invalidate(LA);
  const laJs = (await admin('GET', `/c/${LA}/data.js`)).raw.body;
  assert.match(laJs, /"shuxue-jichu:prop":\{"title":"命题"/);
  assert.match(laJs, /"prereqs":\["shuxue-jichu","xiandai-feishuxue"\]/);
  const laTex = await admin('POST', `/api/tex/${LA}`, { hand: [{ id: 'vec', p: 0 }], tpl: 'teacher' });
  assert.equal(laTex.status, 200);
  assert.match(laTex.raw.body, /《数学基础》命题/);

  /* ---------- 讲义和路线：改重要性、选说法 ---------- */
  assert.equal((await ed('PUT', '/api/state/shuxue-jichu', { mastered: [], hand: [{ id: 'not', p: 0, imp: 1, v: 1 }], refs: [], tpl: 'teacher' })).status, 200);
  assert.deepEqual((await ed('GET', '/api/me')).body.state.hand[0], { id: 'not', p: 0, note: '', imp: 1, v: 1 });
  const r2 = await ed('POST', '/api/routes', { course: 'shuxue-jichu', title: '改星级', items: [{ id: 'not', p: 0, imp: 1, v: 1 }] });
  assert.equal((await ed('GET', '/api/routes/mine')).body.items.find(r => r.id === r2.body.id).items[0].imp, 1);
  const t2 = await anon('POST', '/api/tex/shuxue-jichu', { hand: [{ id: 'not', p: 0, imp: 1, v: 1 }], tpl: 'teacher' });
  assert.match(t2.raw.body, /真假相反/);
  assert.match(t2.raw.body, /#set page/);   // 新写法的课程：Typst 源文件
  assert.match(t2.raw.body, /\[★\]/);

  const pdf = await anon('POST', '/api/pdf/shuxue-jichu', { hand: [{ id: 'prop', p: 0 }, { id: 'contrapos', p: 0 }], refs: ['imp'], tpl: 'teacher' });
  assert.equal(pdf.status, 200, JSON.stringify(pdf.body));
  let st;
  for (let i = 0; i < 60; i++) { st = (await anon('GET', `/api/pdf/job/${pdf.body.id}`)).body; if (st.status === 'done' || st.status === 'error') break; await new Promise(r => setTimeout(r, 500)); }
  assert.equal(st.status, 'done', st.error);
  const file = await anon('GET', `/api/pdf/file/${pdf.body.id}`);
  assert.equal(file.raw.headers['content-type'], 'application/pdf');
  const again = await anon('POST', '/api/pdf/shuxue-jichu', { hand: [{ id: 'prop', p: 0 }, { id: 'contrapos', p: 0 }], refs: ['imp'], tpl: 'teacher' });
  assert.equal((await anon('GET', `/api/pdf/job/${again.body.id}`)).body.status, 'done');
  /* 讲义备注里的代码不会被执行：按普通文字转义 */
  const evil = await ed('POST', '/api/tex/shuxue-jichu', { hand: [{ id: 'prop', p: 0, note: '#read("/etc/passwd") $x$' }], tpl: 'teacher' });
  assert.equal(evil.status, 200); assert.match(evil.raw.body, /\\#read/); assert.match(evil.raw.body, /\\\$x\\\$/);
});
