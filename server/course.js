'use strict';
/* 课程结构：读取、缓存、顺序合法性检查 */
const { one, all } = require('./db');

const TYPES = ['axiom', 'def', 'thm', 'prop', 'method', 'note', 'example', 'exercise'];
const isQ = t => t === 'example' || t === 'exercise';
/* 跨课程引用写成「课程:节点」，例如 shuxue-jichu:prop */
const isExt = d => typeof d === 'string' && d.includes(':');
const splitExt = d => { const i = d.indexOf(':'); return [d.slice(0, i), d.slice(i + 1)]; };

const cache = new Map();   // slug -> { B, N, graph, meta, js, at }
function invalidate(slug) { cache.delete(slug); }
function invalidateAll() { cache.clear(); }

async function load(slug) {
  if (cache.has(slug)) return cache.get(slug);
  const c = await one('SELECT * FROM courses WHERE slug = ?', slug);
  if (!c) return null;
  const B = c.tree_json, N = {}, ver = {};
  for (const r of await all('SELECT id, data_json, version, reviewer_id FROM nodes WHERE course = ?', slug)) {
    N[r.id] = r.data_json;
    ver[r.id] = { v: r.version, reviewer: r.reviewer_id };
  }
  const st = { slug, meta: c, B, N, ver, graph: c.graph_json, prereqs: c.prereqs_json || [], settings: c.settings_json || {} };
  st.idx = index(B, N);
  st.ext = await extInfo(st, N);
  cache.set(slug, st);
  return st;
}

/* 跨课程引用：只能引用本课程的前置课程里存在的节点 */
async function extInfo(st, N) {
  const out = {};
  const inline = n => [n.body, ...proofsOf(n).map(p => p.body), ...(n.variants || []).map(v => v.body)].join(' ').match(/\[\[[a-z0-9-]+:\w+\]\]/g) || [];
  for (const n of Object.values(N)) for (const d of [...(n.deps || []), ...(n.attach || []), ...proofsOf(n).flatMap(p => p.deps || []), ...inline(n).map(m => m.slice(2, -2))]) {
    if (!isExt(d) || out[d] !== undefined) continue;
    const [cs, id] = splitExt(d);
    const o = st.prereqs.includes(cs) && cs !== st.slug ? await load(cs) : null;
    out[d] = o && o.N[id] ? { title: o.N[id].title, type: o.N[id].type, imp: o.N[id].imp, course: cs, courseTitle: o.meta.title } : null;
  }
  return out;
}
async function checkFull(st, B, N) {
  const ext = await extInfo(st, N);
  return check(B, N, d => !!ext[d], st.settings);
}

/* 把树展平，得到每个节点的路径、父泡泡、顺序编号 */
function index(B, N) {
  const npath = {}, nparent = {}, bparent = {}, order = [];
  const seen = new Set();
  (function walk(bid, path) {
    if (seen.has(bid)) throw new Error(`泡泡「${bid}」出现了两次`);
    seen.add(bid);
    (B[bid].kids || []).forEach((k, i) => {
      const p = path.concat([{ b: bid, i }]);
      if (B[k]) { bparent[k] = bid; walk(k, p); }
      else if (N[k]) {
        if (npath[k]) throw new Error(`节点「${k}」被放进了两个泡泡`);
        npath[k] = p; nparent[k] = bid; order.push(k);
      }
      else throw new Error(`泡泡「${bid}」里引用了不存在的「${k}」`);
    });
  })('root', []);
  const ord = {}; order.forEach((k, i) => { ord[k] = i; });
  return { npath, nparent, bparent, order, ord };
}

function makeEarlier(B, idx) {
  return function earlier(a, b) {
    const pa = idx.npath[a], pb = idx.npath[b];
    if (!pa || !pb) return false;
    for (let k = 0; k < Math.min(pa.length, pb.length); k++) {
      if (pa[k].b !== pb[k].b) return false;
      if (pa[k].i !== pb[k].i) return B[pa[k].b].ordered && pa[k].i < pb[k].i;
    }
    return false;
  };
}
const proofsOf = n => n.proofs || n.sols || [];

/* 公式里的 < > 要转义，否则浏览器会把 $0<x$ 里的 <x 当成标签吃掉 */
const fixMath = h => typeof h === 'string' ? h.replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, m => m.replace(/</g, '&lt;').replace(/>/g, '&gt;')) : h;
function fixNode(n) {
  if (!n) return n;
  n.body = fixMath(n.body);
  for (const p of proofsOf(n)) p.body = fixMath(p.body);
  for (const v of n.variants || []) v.body = fixMath(v.body);
  return n;
}

/* 顺序合法性检查（PRD 第 3 节）。返回问题列表；空列表表示合法 */
function check(B, N, extOk = () => false, opts = {}) {
  const problems = [];
  let idx;
  try { idx = index(B, N); } catch (e) { return [e.message]; }
  const inner = makeEarlier(B, idx);
  const earlier = (a, b) => isExt(a) ? extOk(a) : inner(a, b);
  const name = id => `「${N[id] ? N[id].title : id}」`;
  for (const id of Object.keys(N)) if (!idx.npath[id]) problems.push(`${name(id)} 没有归位到任何泡泡`);
  for (const id of idx.order) {
    const n = N[id];
    if (!TYPES.includes(n.type)) problems.push(`${name(id)} 的类型不对`);
    const refs = [...(n.deps || []), ...(n.attach || []), ...proofsOf(n).flatMap(p => p.deps || [])];
    for (const d of refs) {
      if (isExt(d)) { if (!extOk(d)) problems.push(`${name(id)} 引用的「${d}」不存在，或者那门课不是本课程的前置课程`); }
      else if (!N[d]) problems.push(`${name(id)} 引用了不存在的节点「${d}」`);
    }
    for (const d of (n.deps || [])) if (N[d] && !earlier(d, id)) problems.push(`${name(id)} 的前置 ${name(d)} 在课程顺序里不在它前面`);
    for (const d of (n.attach || [])) if (N[d] && !earlier(d, id)) problems.push(`${name(id)} 挂靠的 ${name(d)} 在课程顺序里不在它前面`);
    const ps = proofsOf(n);
    if (['thm', 'prop'].includes(n.type) && !ps.length && !opts.proofOptional) problems.push(`${name(id)} 是定理，但没有任何证明`);
    if (n.type !== 'axiom' && ps.length && !ps.some(p => (p.deps || []).every(d => earlier(d, id))))
      problems.push(`${name(id)} 没有一套${isQ(n.type) ? '解答' : '证明'}只用到课程里更早的节点`);
    const bp = B[idx.nparent[id]];
    if (!bp.ordered) {
      const sib = new Set(bp.kids);
      const def = ps.find(p => (p.deps || []).every(d => earlier(d, id)));
      const used = [...(n.deps || []), ...(def ? def.deps : [])];
      for (const d of used) if (sib.has(d)) problems.push(`${name(id)} 和 ${name(d)} 在同一个无序泡泡里，却互相依赖`);
    }
  }
  /* 默认依赖不得成环 */
  const state = {};
  const dflt = id => {
    const n = N[id], ps = proofsOf(n), p = ps.find(q => (q.deps || []).every(d => earlier(d, id)));
    return [...(n.deps || []), ...(p ? p.deps : [])].filter(d => N[d]);
  };
  const visit = (x, stack) => {
    if (state[x] === 2) return;
    if (state[x] === 1) { problems.push(`默认依赖成环：${stack.concat(x).map(name).join(' → ')}`); return; }
    state[x] = 1; dflt(x).forEach(d => visit(d, stack.concat(x))); state[x] = 2;
  };
  idx.order.forEach(x => visit(x, []));
  return [...new Set(problems)];
}

/* 前端用的数据脚本：保持原型里 B / N / CH_EDGES / CH_POS 的写法 */
function clientScript(st) {
  const ver = {};
  for (const [id, v] of Object.entries(st.ver)) ver[id] = v.v;
  /* 大课程：证明和解答的正文不放进首屏脚本，打开时再取（/api/bodies） */
  /* 源文只在编辑时用（/api/src），不放进首屏脚本 */
  let N = st.N;
  if (Object.values(N).some(n => n.src != null)) {
    const strip = x => { const { src, ...rest } = x; return rest; };
    N = {};
    for (const [id, n] of Object.entries(st.N)) {
      const m = strip(n);
      if (m.variants) m.variants = m.variants.map(strip);
      for (const k of ['proofs', 'sols']) if (m[k]) m[k] = m[k].map(strip);
      N[id] = m;
    }
  }
  if (st.settings.lazy) {
    const src = N; N = {};
    for (const [id, n] of Object.entries(src)) {
      const ps = n.proofs ? 'proofs' : n.sols ? 'sols' : null;
      N[id] = ps ? { ...n, [ps]: n[ps].map(p => ({ ...p, body: null })) } : n;
    }
  }
  return `window.COURSE=${JSON.stringify({ slug: st.slug, title: st.meta.title, category: st.meta.category, descr: st.meta.descr, settings: st.settings, treeVersion: st.meta.tree_version, ver, prereqs: st.prereqs })};` +
    `const B=${JSON.stringify(st.B)};const N=${JSON.stringify(N)};` +
    `const EXT=${JSON.stringify(st.ext || {})};` +
    `const CH_EDGES=${JSON.stringify(st.graph.edges || [])};const CH_POS=${JSON.stringify(st.graph.pos || {})};`;
}

module.exports = { isExt, splitExt, checkFull, fixMath, fixNode, load, invalidate, invalidateAll, index, check, makeEarlier, clientScript, TYPES, proofsOf, isQ };
