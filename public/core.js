/* 前端核心（来自原型）。联网功能见 online.js */
var CATS = [], ROUTES = [];
/* ================= 结构计算 ================= */
const npath = {}, nparent = {}, bparent = {}, ord = {}, order = [], CHAPS = [];
(function walk(bid, path) {
  B[bid].kids.forEach((k, i) => {
    const p = path.concat([{ b: bid, i }]);
    if (B[k]) { bparent[k] = bid; if (B[k].tag) CHAPS.push(k); walk(k, p); }
    else if (N[k]) { npath[k] = p; nparent[k] = bid; ord[k] = order.length; order.push(k); }
  });
})('root', []);
const EXTN = typeof EXT !== 'undefined' ? EXT : {};
const isExt = d => typeof d === 'string' && d.includes(':');
const titleOf = d => N[d] ? N[d].title : EXTN[d] ? `《${EXTN[d].courseTitle}》${EXTN[d].title}` : d;
function earlier(a, b) {
  if (isExt(a)) return !!EXTN[a];        // 前置课程里的节点，总在本课程之前
  const pa = npath[a], pb = npath[b];
  if (!pa || !pb) return false;
  for (let k = 0; k < Math.min(pa.length, pb.length); k++) {
    if (pa[k].b !== pb[k].b) return false;
    if (pa[k].i !== pb[k].i) return B[pa[k].b].ordered && pa[k].i < pb[k].i;
  }
  return false;
}
const isQ = n => n.type === 'example' || n.type === 'exercise';
const pf = id => (N[id].proofs || N[id].sols || []);
const isLegal = (id, p) => p.deps.every(d => earlier(d, id));
function defaultIdx(id) { const i = pf(id).findIndex(p => isLegal(id, p)); return i >= 0 ? i : N[id].type === 'axiom' ? -1 : 0; }
function depsOf(id, idx) {
  const s = new Set(N[id].deps || []), ps = pf(id);
  if (ps.length) { const p = ps[idx == null ? defaultIdx(id) : idx]; if (p) p.deps.forEach(d => s.add(d)); }
  s.delete(id);
  return [...s].filter(d => N[d]);
}
const post = {};
order.forEach(id => { post[id] = new Set(); });
order.forEach(id => {
  (N[id].deps || []).forEach(d => post[d] && post[d].add(id));
  pf(id).forEach(p => p.deps.forEach(d => post[d] && post[d].add(id)));
});
function nodesUnder(bid) {
  const out = [];
  (function w(b) { B[b].kids.forEach(k => { if (B[k]) w(k); else if (N[k]) out.push(k); }); })(bid);
  return out;
}
function chapterOf(bid) { let b = bid; while (b && !B[b].tag) b = bparent[b]; return b; }
function sectionsOf(ch) {
  const b = B[ch];
  if (!b.kids.length || b.kids.every(k => N[k])) return b.kids.length ? [ch] : [];
  const out = [];
  (function w(x) { B[x].kids.forEach(k => { if (B[k]) { if (B[k].title) out.push(k); else w(k); } }); })(ch);
  return out;
}
const prereqSorted = id => depsOf(id).sort((a, b) => N[b].imp - N[a].imp || ord[b] - ord[a]);
const postSorted = id => [...post[id]].sort((a, b) => N[b].imp - N[a].imp || ord[a] - ord[b]);

/* ================= 状态（只存在这台设备的浏览器里） ================= */
/* 每门课的学习记录分开存；数学基础沿用最早的键名，老用户的记录不丢 */
const CSLUG = (window.COURSE && window.COURSE.slug) || 'shuxue-jichu';
const CK = k => CSLUG === 'shuxue-jichu' ? k : `${k}:${CSLUG}`;
const CBASE = CSLUG === 'shuxue-jichu' ? '' : `/c/${CSLUG}`;
const courseBase = slug => slug === 'shuxue-jichu' ? '' : `/c/${slug}`;
const courseURL = slug => courseBase(slug) + '/kb';
function load(k, d) { try { const v = localStorage.getItem(CK(k)); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
const S = {
  mastered: new Set(load('mm_m', [])), hand: load('mm_h', []), refs: load('mm_r', []), tpl: load('mm_t', 'teacher'),
  ign: load('mm_ign', {}), noWarn: load('mm_nowarn', false),
  sel: {}, psel: {}, vsel: {}, gaps: null, clearArm: false, kbOpen: true, mmZoom: 1, curCh: 'b1'
};
const handItem = x => ({ id: x.id, p: x.p, note: x.note || '', ...([1, 2, 3].includes(x.imp) ? { imp: x.imp } : {}), ...(x.v ? { v: x.v } : {}) });
function save() {
  try {
    localStorage.setItem(CK('mm_m'), JSON.stringify([...S.mastered]));
    localStorage.setItem(CK('mm_h'), JSON.stringify(S.hand.map(handItem)));
    localStorage.setItem(CK('mm_r'), JSON.stringify(S.refs));
    localStorage.setItem(CK('mm_t'), JSON.stringify(S.tpl));
    localStorage.setItem(CK('mm_ign'), JSON.stringify(S.ign));
    localStorage.setItem(CK('mm_nowarn'), JSON.stringify(S.noWarn));
  } catch (e) { }
  if (window.syncState) window.syncState();
}
/* 变绿阈值：泡泡自己设了就用自己的，否则沿用上级，全站默认 80% */
function greenOf(bid) { let b = bid; while (b) { if (B[b].green) return B[b].green; b = bparent[b]; } return 0.8; }
const impOf = x => [1, 2, 3].includes(x.imp) ? x.imp : N[x.id].imp;
const stmtOf = (id, v) => { const vs = N[id].variants || []; return v && vs[v - 1] ? vs[v - 1].body : N[id].body; };
function stats(bid) {
  const ns = nodesUnder(bid); let tw = 0, mw = 0, mc = 0;
  ns.forEach(id => { const w = N[id].imp; tw += w; if (S.mastered.has(id)) { mw += w; mc++; } });
  const pct = tw ? mw / tw : 0;
  return { total: ns.length, mastered: mc, pct, green: tw > 0 && pct >= greenOf(bid) };
}
const inHand = id => S.hand.some(x => x.id === id);

/* ================= 小部件 ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPE = { axiom: ['公理', 't-def', 'k-def'], note: ['注记', 't-ex', 'k-ex'], def: ['定义', 't-def', 'k-def'], thm: ['定理', 't-thm', 'k-thm'], prop: ['性质', 't-thm', 'k-thm'], method: ['方法', 't-method', 'k-method'], example: ['例题', 't-ex', 'k-ex'], exercise: ['练习', 't-ex', 'k-ex'] };
const IMP = ['', '铺垫', '常用', '核心'];
const CN = ['一', '二', '三', '四', '五', '六'];
const CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
const numOf = i => CIRC[i] || String(i + 1);
/* 有子泡泡的泡泡（比如考研的「讲」）：卡片里列出下一层 */
const hasSub = b => B[b].kids.some(k => B[k]);
const unitOf = b => /^L\d+/.test(B[b].title || '') ? '讲' : '节';
function titledParent(b) { let p = bparent[b]; while (p && !B[p].title) p = bparent[p]; return p; }
const chip = id => `<span class="chip ${TYPE[N[id].type][1]}">${TYPE[N[id].type][0]}</span>`;
const stars = id => `<span class="stars s${N[id].imp}" title="${IMP[N[id].imp]}" aria-label="${IMP[N[id].imp]}">${'★'.repeat(N[id].imp)}</span>`;
/* 其他课程的节点：显示课程名，暂不跳转 */
const extRef = id => { const e = EXTN[id]; return e ? `<button class="ref" data-act="ext" data-id="${esc(id)}">《${esc(e.courseTitle)}》${esc(e.title)}</button>` : `<span class="ref">${esc(id)}</span>`; };
const extBtn = id => { const e = EXTN[id]; return `<button class="link" data-act="ext" data-id="${esc(id)}"><span class="chip ${e ? TYPE[e.type][1] : 't-ex'}">${e ? TYPE[e.type][0] : '外部'}</span><span>${e ? `《${esc(e.courseTitle)}》${esc(e.title)}` : esc(id)}</span></button>`; };
const extDeps = (id, idx) => { const ps = pf(id), p = ps[idx == null ? defaultIdx(id) : idx]; return [...new Set([...(N[id].deps || []), ...(p ? p.deps : [])])].filter(isExt); };
const linkBtn = id => isExt(id) ? extBtn(id) : `<button class="link" data-act="node" data-id="${id}">${chip(id)}<span>${esc(N[id].title)}</span></button>`;
const refBtn = id => isExt(id) ? extRef(id) : `<button class="ref" data-act="node" data-id="${id}">${esc(N[id].title)}</button>`;
const fmt = (html, refFn) => html.replace(/\[\[((?:[a-z0-9-]+:)?\w+)\]\]/g, (m, id) => N[id] ? (refFn ? refFn(id) : refBtn(id)) : EXTN[id] ? extRef(id) : m);
/* 大课程的证明、解答正文按需加载 */
const LAZY = {};
const pbody = (id, p, refFn) => p.body == null ? `<p class="small lazy" data-lazy="${id}">正在加载……</p>` : fmt(p.body, refFn);
async function fillLazy() {
  const ids = [...new Set([...document.querySelectorAll('[data-lazy]')].map(e => e.dataset.lazy))].filter(id => N[id] && !LAZY[id]);
  if (!ids.length) return;
  ids.forEach(id => { LAZY[id] = 1; });
  try {
    for (let k = 0; k < ids.length; k += 200) {
      const r = await fetch(`/api/bodies/${CSLUG}?ids=${ids.slice(k, k + 200).join(',')}`, { credentials: 'same-origin' }).then(x => x.json());
      for (const [id, bs] of Object.entries(r.bodies || {})) pf(id).forEach((p, i) => { if (bs[i] != null) p.body = bs[i]; });
    }
  } catch (e) { ids.forEach(id => { delete LAZY[id]; }); toast('解答加载失败，请检查网络'); return; }
  const r = cur();
  if (r.v === 'kb') { const secs = new Set(ids.map(id => nparent[id])); secs.forEach(s => rerenderCard(s)); }
  else soft();
}
window.ensureBodies = async ids => {
  const need = ids.filter(id => N[id] && pf(id).some(p => p.body == null));
  if (!need.length) return;
  const r = await fetch(`/api/bodies/${CSLUG}?ids=${need.join(',')}`, { credentials: 'same-origin' }).then(x => x.json());
  for (const [id, bs] of Object.entries(r.bodies || {})) pf(id).forEach((p, i) => { if (bs[i] != null) p.body = bs[i]; });
};
const sec = (title, body) => `<section class="sec"><h3 class="h3">${title}</h3>${body}</section>`;
const chLabel = ch => `${B[ch].tag} ${B[ch].title}`;
const pathOf = id => bubbleChain(nparent[id]).slice(1).map(b => B[b].tag ? chLabel(b) : B[b].title).join(' › ');
const fid = b => (B[b].tag ? 'ch-' : 'sec-') + b;
function bubbleChain(bid) { const c = []; let b = bid; while (b) { if (B[b].title) c.unshift(b); b = bparent[b]; } return c; }
const ICON = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12h8" stroke="var(--sheet)" stroke-width="2.2" stroke-linecap="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>'
};
let toastT;
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ================= 公式 ================= */
/* MathJax 的排版要一个接一个做：同时排两处会互相干扰（实时预览时尤其明显） */
let MJQ = Promise.resolve();
function typeset(el) { if (window.mjReady && el) MJQ = MJQ.then(() => el.isConnected ? MathJax.typesetPromise([el]) : null).catch(() => { }); }
function clearMath(el) { if (window.mjReady && el) { try { MathJax.typesetClear([el]); } catch (e) { } } }
window.onMJ = () => { typeset($('#view')); typeset($('#rail')); };

/* ================= 搜索 ================= */
const plain = html => html.replace(/<[^>]+>/g, ' ').toLowerCase();
function search(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean), out = [];
  order.forEach(id => {
    const n = N[id], t = n.title.toLowerCase(), al = (n.alias || []).join(' ').toLowerCase(), body = plain(n.body);
    let s = 0;
    for (const w of terms) {
      const ws = t.includes(w) ? 10 : al.includes(w) ? 7 : body.includes(w) ? 2 : 0;
      if (!ws) { s = 0; break; }
      s += ws;
    }
    if (s) out.push([s + n.imp, id]);
  });
  return out.sort((a, b) => b[0] - a[0] || ord[a[1]] - ord[b[1]]).map(x => x[1]);
}
function searchSecs(q) {
  const w = q.trim().toLowerCase();
  return Object.keys(B).filter(b => b !== 'root' && B[b].title && (B[b].title.toLowerCase().includes(w) || (B[b].tag || '').toLowerCase() === w));
}
function drawDrop(input) {
  const drop = input.parentElement.querySelector('.sdrop'), q = input.value.trim();
  if (!q) { drop.hidden = true; return; }
  const ns = search(q).slice(0, 6), bs = searchSecs(q).slice(0, 4);
  let h = '';
  if (ns.length) h += '<div class="sgroup">节点</div>' + ns.map(id => `<button class="sitem" data-act="node" data-id="${id}">${chip(id)}<span><span class="sitem-t">${esc(N[id].title)}</span><span class="sitem-s">${esc(pathOf(id))}</span></span></button>`).join('');
  if (bs.length) h += '<div class="sgroup">章节</div>' + bs.map(b => `<button class="sitem" data-act="kbfocus" data-f="${fid(b)}"><span><span class="sitem-t">${esc(B[b].tag ? chLabel(b) : B[b].title)}</span><span class="sitem-s">${esc(B[b].desc || B[b].pending || '')}</span></span></button>`).join('');
  h += (ns.length || bs.length) ? `<button class="sitem" data-act="searchall" data-q="${esc(q)}"><span class="sitem-t" style="color:var(--blue)">查看全部结果</span></button>`
    : `<div class="sempty">没有找到「${esc(q)}」。试试符号 ⇒、∀，或者英文名。</div>`;
  drop.innerHTML = h; drop.hidden = false;
}
const searchBox = (id, ph) => `<div class="search">${ICON.search}<input type="search" id="${id}" class="sinput" placeholder="${ph}" autocomplete="off" aria-label="搜索"><div class="sdrop" hidden></div></div>`;

/* ================= 首页与课程 ================= */
function ccard(c) {
  if (!c.live) return `<div class="ccard off"><span class="ccard-tag">筹备中</span><span class="h3">${esc(c.title)}</span><p>${esc(c.desc)}</p></div>`;
  if (c.id !== CSLUG) return `<a class="ccard" href="${courseURL(c.id)}"><span class="ccard-tag">已上线</span><span class="h3">${esc(c.title)}</span><p>${esc(c.desc)}</p><span class="stat">${c.nodes} 个节点</span></a>`;
  const done = CHAPS.filter(ch => nodesUnder(ch).length).length;
  return `<button class="ccard" data-act="go" data-v="kb"><span class="ccard-tag">已上线</span><span class="h3">${esc(c.title)}</span><p>${esc(c.desc)}</p><span class="stat">${order.length} 个节点，已录入 ${done}/${CHAPS.length} 章</span></button>`;
}
function viewHome() {
  return `<section class="hero"><h1 class="h1">Maki 开源数学平台</h1><p>把一门课拆成定义、定理、证明和题目，按你的顺序拼成讲义。内容免费、开源。</p>${searchBox('hq', '')}</section>` +
    `<h2 class="h3">课程</h2><div class="courses">${CATS.flatMap(c => c.courses).map(ccard).join('')}</div>` +
    '<div class="center"><button class="btn" data-act="go" data-v="courses">更多课程</button></div>';
}
function viewCourses() {
  return '<h1 class="h1">全部课程</h1><p class="muted" style="margin:6px 0 0">按方向分类。筹备中的课程正在录入。</p>' +
    CATS.map(c => `<section class="cat-block"><h2 class="h3">${c.name}</h2>${c.courses.length ? `<div class="courses">${c.courses.map(ccard).join('')}</div>` : '<p class="none">暂无课程。</p>'}</section>`).join('');
}

/* ================= 知识库首页 ================= */
function nchip(id, sid) {
  const cls = [TYPE[N[id].type][2], S.mastered.has(id) ? 'done' : '', inHand(id) ? 'in' : '', S.sel[sid] === id ? 'cur' : ''].join(' ');
  return `<div class="nchip ${cls}"><button class="nchip-t" data-act="sel" data-sec="${sid}" data-id="${id}" aria-pressed="${S.sel[sid] === id}" title="${esc(N[id].title)}">${esc(N[id].title)}</button>` +
    `<button class="nchip-add" data-act="add" data-id="${id}" aria-label="${inHand(id) ? '移出我的讲义' : '加入我的讲义'}" title="${inHand(id) ? '移出我的讲义' : '加入我的讲义'}">${inHand(id) ? ICON.minus : ICON.plus}</button></div>`;
}
function chipsHTML(sid) {
  const b = B[sid], ks = b.kids.filter(k => N[k]);
  return b.ordered ? `<ol class="chain">${ks.map(k => `<li>${nchip(k, sid)}</li>`).join('')}</ol>`
    : `<p class="free-h" style="margin:0">无序节点，任选顺序</p><div class="free">${ks.map(k => nchip(k, sid)).join('')}</div>`;
}
function midIdle(sid) {
  const b = B[sid], ns = nodesUnder(sid), core = ns.filter(k => N[k].imp === 3).length, q = ns.filter(k => isQ(N[k])).length;
  return `<p class="small" style="margin-top:0">未选中节点</p><p>${esc(b.desc || '')}</p><p class="small">${ns.length} 个节点，核心 ${core} 个${q ? `，例题与练习 ${q} 个` : ''}。点左边的节点块看简介，点 ⊕ 直接加进讲义。</p>`;
}
function midSel(sid, id) {
  const ks = B[sid].kids.filter(k => N[k]), i = ks.indexOf(id), prev = ks[i - 1], next = ks[i + 1];
  const seq = `<div class="seq">${prev ? `<button data-act="sel" data-sec="${sid}" data-id="${prev}">${esc(N[prev].title)}</button><span>›</span>` : ''}<span class="on">${esc(N[id].title)}</span>${next ? `<span>›</span><button data-act="sel" data-sec="${sid}" data-id="${next}">${esc(N[next].title)}</button>` : ''}</div>`;
  const inH = inHand(id), m = S.mastered.has(id), n = pf(id).length;
  return seq + `<div class="mini-meta">${chip(id)}${stars(id)}${n ? `<span class="small">${n} 套${isQ(N[id]) ? '解答' : '证明'}</span>` : ''}</div><div class="mini-title">${esc(N[id].title)}</div><div class="body">${fmt(N[id].body)}</div>` +
    `<div class="acts"><button class="btn primary" data-act="detail" data-id="${id}" aria-expanded="${S.inline && isMob()}">${S.inline && isMob() ? '收起详情' : '查看详情与' + (isQ(N[id]) ? '解答' : '证明')}</button><button class="btn ${inH ? 'on' : ''}" data-act="add" data-id="${id}">${inH ? '已在讲义' : '加入讲义'}</button><button class="btn ${m ? 'on' : ''}" data-act="master" data-id="${id}">${m ? '已掌握' : '标记已掌握'}</button>${S.inline && isMob() ? '' : `<button class="btn ghost" data-act="sel" data-sec="${sid}" data-id="${id}">收起</button>`}</div>` + (S.inline && isMob() ? inlineDetail(id) : pnBar(id, 'jump'));
}
function graphHTML(id) {
  const pre = prereqSorted(id), po = postSorted(id);
  const row = arr => arr.length ? `<div class="g-row">${arr.slice(0, 4).map(d => `<button class="g-chip" data-act="jump" data-id="${d}" title="${esc(N[d].title)}">${esc(N[d].title)}</button>`).join('')}</div>${arr.length > 4 ? `<div class="g-more">还有 ${arr.length - 4} 个</div>` : ''}` : '<div class="g-none">无</div>';
  return `<div class="graph"><div class="g-lab">前置（${pre.length}）</div>${row(pre)}${pre.length ? '<div class="g-bus"></div>' : ''}<div class="g-line"></div><div class="g-me">${esc(N[id].title)}</div><div class="g-line"></div>${po.length ? '<div class="g-bus"></div>' : ''}${row(po)}<div class="g-lab">后置（${po.length}）</div></div>`;
}
function groupCardHTML(sid, i) {
  const b = B[sid], st = stats(sid), subs = sectionsOf(sid).filter(s => s !== sid), loose = b.kids.filter(k => N[k]);
  return `<article class="card group ${st.green ? 'green' : ''}" id="sec-${sid}" data-sec="${sid}"><div class="card-l"><div class="card-h"><span class="num">${numOf(i)}</span><h3 class="h3"><button class="card-link" data-act="kbfocus" data-f="sec-${sid}" title="打开">${esc(b.title)}</button></h3></div>` +
    (b.desc ? `<p class="small" style="margin:0 0 8px">${esc(b.desc)}</p>` : '') +
    `<ol class="subs">${subs.map(s => { const t = stats(s); return `<li class="${t.green ? 'green' : ''}"><button data-act="kbfocus" data-f="sec-${s}"><span class="subs-t">${esc(B[s].title)}</span><span class="subs-n">${t.mastered}/${t.total}</span></button></li>`; }).join('')}</ol>` +
    (loose.length ? chipsHTML(sid) : '') +
    `<div class="prog ${st.green ? 'green' : ''}"><span class="bar"><i style="width:${(st.pct * 100).toFixed(1)}%"></i></span><span>${st.mastered}/${st.total}</span></div></div></article>`;
}
function cardHTML(sid, i) {
  const b = B[sid];
  if (!b.kids.length) return `<article class="card pending" id="sec-${sid}"><h3 class="h3">${b.tag ? '' : numOf(i) + ' '}${esc(b.title)}</h3><p style="margin:4px 0 0">${esc(b.pending || '待录入')}</p></article>`;
  if (hasSub(sid) && !b.tag) return groupCardHTML(sid, i);
  const st = stats(sid), sel = S.sel[sid];
  return `<article class="card ${sel ? 'sel' : ''} ${st.green ? 'green' : ''}" id="sec-${sid}" data-sec="${sid}">` +
    `<div class="card-l"><div class="card-h"><span class="num">${numOf(i)}</span><h3 class="h3">${cur().b === sid ? esc(b.title) : `<button class="card-link" data-act="kbfocus" data-f="sec-${sid}" title="单独打开这一节">${esc(b.title)}</button>`}</h3><span class="kind">${b.ordered ? '有序' : '任选顺序'}</span></div>${chipsHTML(sid)}` +
    `<div class="prog ${st.green ? 'green' : ''}"><span class="bar"><i style="width:${(st.pct * 100).toFixed(1)}%"></i></span><span>${st.mastered}/${st.total}</span></div></div>` +
    `<div class="card-m">${sel ? midSel(sid, sel) : midIdle(sid)}</div>` +
    (sel ? `<div class="card-r">${graphHTML(sel)}</div>` : '') + '</article>';
}
function chapterHTML(ch) {
  const secs = sectionsOf(ch), preds = CH_EDGES.filter(e => e[1] === ch).map(e => e[0]);
  const after = preds.length ? `<span class="ch-after">学完 ${preds.map(p => `<button data-act="kbfocus" data-f="ch-${p}">${esc(chLabel(p))}</button>`).join('、')} 后可学</span>` : '<span class="ch-after">起点</span>';
  return `<section class="chapter" id="ch-${ch}" data-ch="${ch}"><div class="ch-head"><h2 class="h2"><span class="ch-tag">${B[ch].tag}</span> ${esc(B[ch].title)}</h2>${after}</div>` +
    `<div class="cards">${secs.length ? secs.map((s, i) => cardHTML(s, i)).join('') : cardHTML(ch, 0)}</div></section>`;
}
/* 知识库按泡泡分页：/kb 是全部章节，/kb/章 是一章，/kb/节 是一节。每页只显示一层。 */
function chOverview(ch) {
  const st = stats(ch), secs = sectionsOf(ch), preds = CH_EDGES.filter(e => e[1] === ch).map(e => B[e[0]].tag);
  const pend = !st.total;
  return `<button class="chcard ${st.green ? 'green' : ''} ${pend ? 'off' : ''}" data-act="kbfocus" data-f="ch-${ch}"><span class="chcard-h"><span class="ch-tag">${B[ch].tag}</span><span class="h3">${esc(B[ch].title)}</span></span>` +
    `<span class="chcard-d">${esc(B[ch].desc || B[ch].pending || '')}</span>` +
    `<span class="chcard-s">${pend ? '待录入' : `${secs.length} ${secs.some(s => unitOf(s) === '讲') ? '讲' : '节'} · ${st.total} 个节点`}${preds.length ? ` · 学完 ${preds.join('、')} 后可学` : ' · 起点'}</span>` +
    (pend ? '' : `<span class="prog ${st.green ? 'green' : ''}"><span class="bar"><i style="width:${(st.pct * 100).toFixed(1)}%"></i></span><span>${st.mastered}/${st.total}</span></span>`) + '</button>';
}
function kbCrumbs(bid) {
  const chain = bubbleChain(bid);
  return `<nav class="crumbs" aria-label="位置"><span class="arrows"><button data-act="hback" ${H.i ? '' : 'disabled'} aria-label="后退">${ICON.left}</button><button data-act="hfwd" ${H.i < H.list.length - 1 ? '' : 'disabled'} aria-label="前进">${ICON.right}</button></span>` +
    chain.map((b, i) => i === chain.length - 1 ? `<span class="now">${esc(b === 'root' ? B.root.title : B[b].tag ? chLabel(b) : B[b].title)}</span>`
      : `<button class="lvl" data-act="${b === 'root' ? 'go' : 'kbfocus'}" ${b === 'root' ? 'data-v="kb"' : `data-f="${fid(b)}"`}>${esc(b === 'root' ? B.root.title : B[b].tag ? chLabel(b) : B[b].title)}</button>`).join('<span class="sep">›</span>') + '</nav>';
}
function kbPager(list, bid, label) {
  const i = list.indexOf(bid), prev = list[i - 1], next = list[i + 1];
  const btn = (x, dir) => x ? `<button class="pn pn-${dir}" data-act="kbfocus" data-f="${fid(x)}"><span class="pn-l">${dir === 'prev' ? '‹ 上一' : '下一'}${label} ${dir === 'next' ? '›' : ''}</span><span class="pn-t">${esc(B[x].tag ? chLabel(x) : B[x].title)}</span></button>` : '<span></span>';
  return `<div class="pnbar" style="margin-top:22px">${btn(prev, 'prev')}${btn(next, 'next')}</div>`;
}
function viewKB(r) {
  const bid = r && r.b && B[r.b] ? r.b : 'root';
  if (bid === 'root') {
    const st = stats('root');
    S.curCh = S.curCh || CHAPS[0];
    const CM = window.COURSE || {};
    return `<div class="kb-head"><p class="small" style="margin:0">${esc(CM.category || '')}</p><h1 class="h1">${esc(B.root.title)}</h1><p>${esc(CM.descr || '')} 先选一章，再往下一层层点开；点节点块看简介和前后置关系，点 ⊕ 直接加进讲义。</p>` +
      `<div class="prog kb-prog ${st.green ? 'green' : ''}"><span>已掌握 ${Math.round(st.pct * 100)}%</span><span class="bar"><i style="width:${(st.pct * 100).toFixed(1)}%"></i></span><span>${st.mastered}/${st.total}</span></div>` +
      '<div class="legend"><span><i style="background:var(--blue)"></i>定义</span><span><i style="background:var(--red)"></i>定理</span><span><i style="background:var(--purple)"></i>方法</span><span><i style="background:var(--muted)"></i>例题与练习</span><span><i style="background:var(--green)"></i>已掌握</span></div></div>' +
      `<div class="chgrid">${CHAPS.map(chOverview).join('')}</div>`;
  }
  const ch = chapterOf(bid) || bid;
  S.curCh = ch;
  if (B[bid].tag) return kbCrumbs(bid) + chapterHTML(bid) + kbPager(CHAPS, bid, '章');
  /* 一节（或章里的分组）：只显示这一层 */
  const par = titledParent(bid), sibs = par ? sectionsOf(par).filter(s => s !== par) : [], mine = sectionsOf(bid);
  const sub = mine.length && !(mine.length === 1 && mine[0] === bid);
  const list = sub ? mine : [bid];
  return kbCrumbs(bid) + `<section class="chapter" data-ch="${ch}"><div class="ch-head"><h2 class="h2">${esc(B[bid].title)}</h2><span class="ch-after">${esc(chLabel(ch))}</span></div>` +
    (sub && B[bid].desc ? `<p class="small" style="margin:-4px 0 12px">${esc(B[bid].desc)}</p>` : '') +
    `<div class="cards">${list.map((s, k) => cardHTML(s, sub ? k : Math.max(0, sibs.indexOf(s)))).join('')}</div></section>` + (sibs.includes(bid) ? kbPager(sibs, bid, unitOf(bid)) : '');
}
function rerenderCard(sid) {
  const el = document.getElementById('sec-' + sid); if (!el) return;
  const par = titledParent(sid), secs = par ? sectionsOf(par) : [], i = Math.max(0, secs.indexOf(sid));
  clearMath(el);
  el.outerHTML = cardHTML(sid, i);
  typeset(document.getElementById('sec-' + sid));
  fillLazy();
}


function pnBar(id, act) {
  const k = ord[id], pv = order[k - 1], nx = order[k + 1];
  const side = (x, dir) => x
    ? `<button class="pn pn-${dir}" data-act="${act}" data-id="${x}"><span class="pn-l">${dir === 'prev' ? '‹ 上一个' : '下一个 ›'}</span><span class="pn-t">${esc(N[x].title)}</span>${nparent[x] !== nparent[id] ? `<span class="pn-s">${esc(B[nparent[x]].title)}</span>` : ''}</button>`
    : `<span class="pn pn-${dir} pn-off"><span class="pn-l">${dir === 'prev' ? '已经是第一个' : '已经是最后一个'}</span></span>`;
  return `<nav class="pnbar" aria-label="上一个与下一个知识点">${side(pv, 'prev')}${side(nx, 'next')}</nav>`;
}

const isMob = () => window.innerWidth <= 760;
const jumpBtn = id => isExt(id) ? extBtn(id) : `<button class="link" data-act="jump" data-id="${id}">${chip(id)}<span>${esc(N[id].title)}</span></button>`;
const jumpRef = id => isExt(id) ? extRef(id) : `<button class="ref" data-act="jump" data-id="${id}">${esc(N[id].title)}</button>`;
function inlineDetail(id) {
  const n = N[id], q = isQ(n), word = q ? '解答' : '证明', ps = pf(id);
  let h = '<div class="inline-detail">';
  if (n.attach) h += `<div class="isec"><div class="ih">挂靠的知识点</div><div class="links">${n.attach.map(jumpBtn).join('')}</div></div>`;
  if (ps.length) {
    const sel = S.psel[id] ?? Math.max(0, defaultIdx(id));
    const tabs = ps.map((p, i) => `<button class="ptab" role="tab" aria-selected="${i === sel}" data-act="ptab" data-id="${id}" data-i="${i}">${word}${CN[i]}：${esc(p.name)}${isLegal(id, p) ? '' : '<span class="warn-dot" aria-label="先用后证"></span>'}</button>`).join('');
    const panels = ps.map((p, i) => {
      const late = p.deps.filter(d => !earlier(d, id));
      return `<div class="pbox" data-panel="${id}-${i}" ${i === sel ? '' : 'hidden'}><div class="uses"><span>用到：</span>${p.deps.length ? p.deps.map(jumpRef).join('<span>、</span>') : '<span>无</span>'}</div>` +
        (late.length ? `<div class="flag">先用后证：用到了还没学到的${late.map(d => '「' + esc(titleOf(d)) + '」').join('')}。</div>` : '') +
        `<div class="pbody">${pbody(id, p, jumpRef)}</div></div>`;
    }).join('');
    h += `<div class="isec"><div class="ih">${n.type === 'axiom' ? '与其他结论的等价性' : ps.length > 1 ? `${word}（${ps.length} 套，可任选）` : word}</div><div class="ptabs" role="tablist">${tabs}</div>${panels}</div>`;
  } else if (q) h += '<div class="isec"><div class="ih">解答</div><p class="none" style="margin:0">暂无解答。</p></div>';
  const pre = prereqSorted(id), qs = order.filter(k => (N[k].attach || []).includes(id)), after = postSorted(id).filter(k => !qs.includes(k));
  h += pnBar(id, 'jump');
  h += `<div class="isec"><div class="ih">需要先懂</div>${pre.length ? `<div class="links">${pre.map(jumpBtn).join('')}</div>` : '<p class="none" style="margin:0">没有前置，可以直接学。</p>'}</div>`;
  if (after.length) h += `<div class="isec"><div class="ih">学完可以继续看</div><div class="links">${after.map(jumpBtn).join('')}</div></div>`;
  if (qs.length) h += `<div class="isec"><div class="ih">相关题目</div><div class="links">${qs.map(jumpBtn).join('')}</div></div>`;
  return h + `<button class="tr-exp" data-act="node" data-id="${id}" style="margin-top:4px">单独打开这个节点 ›</button></div>`;
}
/* ================= 节点详情 ================= */
function usesLine(id, p, word) {
  const late = p.deps.filter(d => !earlier(d, id));
  return `<div class="uses"><span>这套${word}用到：</span>${p.deps.length ? p.deps.map(refBtn).join('<span>、</span>') : '<span>无</span>'}</div>` +
    (late.length ? `<div class="flag">先用后证：用到了课程里还没学到的${late.map(d => '「' + esc(titleOf(d)) + '」').join('')}。默认路线会改用另一套${word}。</div>`
      : '<div class="legal">按课程顺序可以直接使用</div>');
}
function traceList(id) {
  const ds = prereqSorted(id), ex = extDeps(id);
  const exLine = ex.length ? `<li class="tr-more">来自前置课程：${ex.map(extRef).join('、')}</li>` : '';
  if (!ds.length) return `<ul class="trace">${exLine || '<li class="tr-more">没有前置，可以直接学。</li>'}</ul>`;
  const top = ds.slice(0, 3), rest = ds.slice(3);
  return '<ul class="trace">' + top.map(d => {
    const n = prereqSorted(d).length;
    return `<li data-tr="${d}"><div class="tr-row">${linkBtn(d)}${n ? `<button class="tr-exp" data-act="trace" data-id="${d}">它的前置（${n}）</button>` : ''}</div></li>`;
  }).join('') + (rest.length ? `<li class="tr-more">另有 ${rest.length} 个次要前置：${rest.map(refBtn).join('、')}</li>` : '') + exLine + '</ul>';
}
function crumbsHTML(id) {
  const chain = bubbleChain(nparent[id]);
  const lv = chain.map(b => b === 'root'
    ? `<button class="lvl" data-act="go" data-v="kb">${esc(B[b].title)}</button>`
    : `<button class="lvl" data-act="kbfocus" data-f="${fid(b)}">${esc(B[b].tag ? chLabel(b) : B[b].title)}</button>`);
  return `<nav class="crumbs" aria-label="位置"><span class="arrows"><button data-act="hback" ${H.i ? '' : 'disabled'} aria-label="后退">${ICON.left}</button><button data-act="hfwd" ${H.i < H.list.length - 1 ? '' : 'disabled'} aria-label="前进">${ICON.right}</button></span>` +
    lv.join('<span class="sep">›</span>') + `<span class="sep">›</span><span class="now">${esc(N[id].title)}</span></nav>`;
}
function viewNode(id) {
  const n = N[id], q = isQ(n), word = q ? '解答' : '证明', inH = inHand(id), m = S.mastered.has(id);
  let h = crumbsHTML(id);
  h += `<div class="title-row"><h1 class="h1">${esc(n.title)}</h1><button class="btn ${inH ? 'on' : ''}" data-act="add" data-id="${id}">${inH ? '已在讲义' : '加入讲义'}</button><button class="btn ${m ? 'on' : ''}" data-act="master" data-id="${id}">${m ? '已掌握' : '标记已掌握'}</button></div>`;
  h += `<div class="nmeta">${chip(id)}${stars(id)}<span class="small">${IMP[n.imp]}</span></div>`;
  const vs = n.variants || [];
  if (vs.length) {
    const vsel = S.vsel[id] || 0;
    h += `<div class="ptabs" role="tablist" aria-label="等价说法" style="margin-bottom:6px">${[n.type === 'def' ? '原定义' : '原叙述', ...vs.map(v => v.name)].map((nm, i) => `<button class="ptab" role="tab" aria-selected="${i === vsel}" data-act="vtab" data-id="${id}" data-i="${i}">${esc(nm)}</button>`).join('')}</div>` +
      [n.body, ...vs.map(v => v.body)].map((b, i) => `<div class="stmt" data-vpanel="${id}-${i}" ${i === vsel ? '' : 'hidden'}>${fmt(b)}</div>`).join('') +
      `<p class="small" style="margin:6px 0 0">这几种说法互相等价，${n.type === 'def' ? '任选一种作为定义都可以' : '可以任选一种'}；做讲义时可以选用哪一种。</p>`;
  } else h += `<div class="stmt">${fmt(n.body)}</div>`;
  if (n.attach) h += sec('挂靠的知识点', `<div class="links">${n.attach.map(linkBtn).join('')}</div>`);
  const ps = pf(id);
  if (ps.length) {
    const sel = S.psel[id] ?? Math.max(0, defaultIdx(id));
    const tabs = ps.map((p, i) => `<button class="ptab" role="tab" aria-selected="${i === sel}" data-act="ptab" data-id="${id}" data-i="${i}">${word}${CN[i]}：${esc(p.name)}${isLegal(id, p) ? '' : '<span class="warn-dot" aria-label="先用后证"></span>'}</button>`).join('');
    const panels = ps.map((p, i) => `<div class="pbox" data-panel="${id}-${i}" ${i === sel ? '' : 'hidden'}>${usesLine(id, p, word)}<div class="pbody">${pbody(id, p)}</div></div>`).join('');
    h += sec(n.type === 'axiom' ? '与其他结论的等价性' : ps.length > 1 ? `${word}（${ps.length} 套，可任选）` : word, (n.type === 'axiom' ? '<p class="none" style="margin:0 0 8px">公理本身不需要证明。下面说明它可以由别的结论推出，默认路线不使用。</p>' : '') + `<div class="ptabs" role="tablist">${tabs}</div>${panels}`);
  } else if (q) h += sec('解答', '<p class="none">暂无解答。可以在页面底部提交你的解法。</p>');
  h += pnBar(id, 'node');
  h += sec(`溯源：理解它需要先懂${ps.length > 1 && defaultIdx(id) >= 0 ? `（按${word}${CN[defaultIdx(id)]}）` : ''}`, traceList(id));
  const qs = order.filter(k => (N[k].attach || []).includes(id)), after = postSorted(id).filter(k => !qs.includes(k));
  h += sec('学完它可以继续看', after.length ? `<div class="links">${after.map(linkBtn).join('')}</div>` : '<p class="none">暂时还没有节点用到它。</p>');
  if (qs.length) h += sec('相关题目', `<div class="links">${qs.map(linkBtn).join('')}</div>`);
  h += window.nodeFoot ? window.nodeFoot(id) : '';
  h += `<details class="fb"><summary>反馈这个节点</summary><form class="fb-form" data-node="${id}"><label class="small" for="fbt">问题类型</label><select id="fbt"><option>内容有错</option><option>表述不清</option><option>顺序有问题</option><option>其他</option></select><textarea id="fbx" placeholder="具体是哪里？"></textarea><button class="btn primary" type="submit" style="justify-self:start">提交给审核者</button></form></details>`;
  h += `<div id="history" data-id="${id}"></div>`;
  return h;
}

/* ================= 搜索页 ================= */
function resultsHTML(q) {
  if (!q.trim()) return '<p class="res-hint">常被查的</p><div class="results">' + ['contrapos', 'demorgan', 'implaw', 'mix1', 'm_case', 'syllog'].filter(id => N[id]).concat(order.filter(id => N[id].imp === 3).slice(0, CSLUG === 'shuxue-jichu' ? 0 : 6)).map(resRow).join('') + '</div>';
  const ns = search(q), bs = searchSecs(q);
  if (!ns.length && !bs.length) return `<p class="res-hint">没有找到「${esc(q)}」。换个说法试试，比如用符号 ⇒、∀，或者英文名。</p>`;
  return (ns.length ? `<p class="res-hint">节点（${ns.length}）</p><div class="results">${ns.map(resRow).join('')}</div>` : '') +
    (bs.length ? `<p class="res-hint">章节（${bs.length}）</p><div class="results">${bs.map(b => `<button class="res" data-act="kbfocus" data-f="${fid(b)}"><span class="res-t"><span>${esc(B[b].tag ? chLabel(b) : B[b].title)}</span><span class="small">${esc(B[b].desc || B[b].pending || '')}</span></span></button>`).join('')}</div>` : '');
}
const resRow = id => `<button class="res" data-act="node" data-id="${id}">${chip(id)}<span class="res-t"><span>${esc(N[id].title)}</span><span class="small">${esc(pathOf(id))}</span></span>${stars(id)}</button>`;
function viewSearch(q) {
  return `<h1 class="h1" style="margin-bottom:12px">搜索</h1><div class="search" style="max-width:720px">${ICON.search}<input type="search" id="pq" class="field" style="padding-left:34px" placeholder="搜节点、章节：逆否、De Morgan、⇒" value="${esc(q || '')}" autocomplete="off" aria-label="搜索"></div><div id="pres">${resultsHTML(q || '')}</div>`;
}

/* ================= 讲义推荐 ================= */
function viewRoutes() {
  return '<h1 class="h1">讲义推荐</h1><p class="muted" style="margin:6px 0 18px">别人整理好的学习路线，可以一键复制到「我的讲义」再改。公开路线都经过审核；老师认证过的带「老师」标识。</p><div class="routes">' +
    ROUTES.map((r, i) => `<article class="route"><div class="route-h"><h2 class="h3">${esc(r.title)}</h2><span class="small">${esc(r.author)}</span>${r.teacher ? '<span class="teacher">老师</span>' : ''}</div><p>${esc(r.desc)}</p>` +
      `<div class="links">${r.items.map(linkBtn).join('')}</div><div class="acts"><button class="btn primary" data-act="copyroute" data-i="${i}">复制到我的讲义</button><span class="small" style="align-self:center">${r.items.length} 个节点</span></div></article>`).join('') + '</div>';
}

/* ================= 我的讲义 ================= */
function closureOf(x) {
  const seen = new Set(), q = [...depsOf(x.id, x.p)];
  while (q.length) { const d = q.shift(); if (seen.has(d)) continue; seen.add(d); depsOf(d).forEach(e => q.push(e)); }
  return seen;
}
function computeGaps() {
  const inBody = new Set(S.hand.map(x => x.id)), inRef = new Set(S.refs), miss = new Set(), q = [], direct = new Set();
  S.hand.forEach(x => depsOf(x.id, x.p).forEach(d => { q.push(d); direct.add(d); }));
  while (q.length) { const d = q.shift(); if (inBody.has(d) || inRef.has(d) || miss.has(d)) continue; miss.add(d); depsOf(d).forEach(e => q.push(e)); }
  S.gaps = [...miss].sort((a, b) => (direct.has(b) - direct.has(a)) || N[b].imp - N[a].imp || ord[a] - ord[b])
    .map(id => ({ id, direct: direct.has(id), mode: direct.has(id) && N[id].imp === 3 ? 'body' : 'ref' }));
}
function applyGaps() {
  const add = S.gaps.filter(g => g.mode === 'body').map(g => g.id).sort((a, b) => ord[a] - ord[b]);
  const refs = S.gaps.filter(g => g.mode === 'ref').map(g => g.id);
  add.forEach(id => {
    let at = S.hand.length;
    for (let i = 0; i < S.hand.length; i++) if (closureOf(S.hand[i]).has(id)) { at = i; break; }
    S.hand.splice(at, 0, { id, p: defaultIdx(id) });
  });
  refs.forEach(id => { if (!S.refs.includes(id)) S.refs.push(id); });
  S.refs.sort((a, b) => ord[a] - ord[b]);
  S.gaps = null; save(); soft();
  toast(`已放进正文 ${add.length} 个，附录 ${refs.length} 个`);
}
const segBtn = (v, l) => `<button data-act="tpl" data-v="${v}" aria-pressed="${S.tpl === v}">${l}</button>`;
function hitem(x, i) {
  const id = x.id, n = N[id], ps = pf(id), word = isQ(n) ? '解答' : '证明';
  let h = `<li class="hitem" data-i="${i}"><div class="hitem-top"><button class="hdrag" data-i="${i}" aria-label="拖动调整顺序（也可以用上下方向键）" title="拖动调整顺序">${ICON.grip}</button><span class="hnum">${i + 1}</span><button class="htitle" data-act="node" data-id="${id}">${chip(id)}<span>${esc(n.title)}</span></button>` +
    `<div class="hctl"><button class="ic" data-act="rm" data-i="${i}" aria-label="移出讲义">${ICON.x}</button></div></div>`;
  let sub = '';
  if (ps.length > 1 || (n.type === 'axiom' && ps.length)) sub += `<label for="ps-${i}">${n.type === 'axiom' ? '是否附上等价性证明' : '用哪套' + word}</label><select id="ps-${i}" data-act="psel" data-i="${i}">` + (n.type === 'axiom' ? `<option value="-1" ${x.p === -1 ? 'selected' : ''}>不附证明（作为公理）</option>` : '') + ps.map((p, j) => `<option value="${j}" ${j === x.p ? 'selected' : ''}>${word}${CN[j]}：${esc(p.name)}${isLegal(id, p) ? '' : '（先用后证）'}</option>`).join('') + '</select>';
  const vs = n.variants || [];
  if (vs.length) sub += `<label for="vs-${i}">用哪种说法</label><select id="vs-${i}" data-act="vsel" data-i="${i}">` + [n.type === 'def' ? '原定义' : '原叙述', ...vs.map(v => v.name)].map((nm, j) => `<option value="${j}" ${(x.v || 0) === j ? 'selected' : ''}>${esc(nm)}</option>`).join('') + '</select>';
  sub += `<label for="im-${i}">重要性（只影响你的讲义和路线）</label><select id="im-${i}" data-act="impsel" data-i="${i}" style="width:auto">` +
    `<option value="0" ${[1, 2, 3].includes(x.imp) ? '' : 'selected'}>沿用默认：${'★'.repeat(n.imp)} ${IMP[n.imp]}</option>` + [3, 2, 1].map(k => `<option value="${k}" ${x.imp === k ? 'selected' : ''}>${'★'.repeat(k)} ${IMP[k]}</option>`).join('') + '</select>';
  const pos = {}; S.hand.forEach((y, k) => { pos[y.id] = k; });
  const late = depsOf(id, x.p).filter(d => pos[d] > i);
  if (late.length && !S.noWarn && S.ign[id] !== late.slice().sort().join(','))
    sub += `<div class="hwarn">建议移到前置知识${late.map(d => '「' + esc(titleOf(d)) + '」').join('')}之后 <button class="hlink" data-act="fixorder" data-i="${i}">一键调整</button><button class="hlink mute" data-act="ignwarn" data-i="${i}">忽略</button><button class="hlink mute" data-act="nowarn">不再提示</button></div>`;
  if (S.tpl === 'teacher') sub += (x.noteOpen || x.note)
    ? `<label for="nt-${i}">过渡文字（放在这一节前面，只出现在教师版）</label><textarea id="nt-${i}" data-act="note" data-i="${i}" placeholder="比如：上一节我们把蕴含化成了或，这一节……">${esc(x.note || '')}</textarea>`
    : `<button class="tr-exp" data-act="noteopen" data-i="${i}" style="justify-self:start">＋ 过渡文字</button>`;
  return h + (sub ? `<div class="hsub">${sub}</div>` : '') + '</li>';
}
function gapsPanel() {
  if (!S.gaps.length) return '<div class="gaps" id="gaps"><p style="margin:0">前置已经齐了：正文用到的每个节点，要么在讲义里，要么在附录里。</p><div class="acts"><button class="btn" data-act="closegaps">好</button></div></div>';
  return `<div class="gaps" id="gaps"><p class="h3" style="margin:0">缺 ${S.gaps.length} 个前置</p><p class="note" style="margin:2px 0 0">按你选的证明一路往前追。直接用到的核心节点默认放进正文，其余默认只引用，放进附录。</p>` +
    S.gaps.map((g, i) => (i === 0 || g.direct !== S.gaps[i - 1].direct ? `<p class="gap-h">${g.direct ? '直接用到' : '间接用到（前置的前置）'}</p>` : '') +
      `<div class="gap-row"><div class="gap-t">${chip(g.id)}${refBtn(g.id)}${stars(g.id)}</div><select data-act="gapmode" data-i="${i}" aria-label="怎么处理「${esc(N[g.id].title)}」" style="width:auto">` +
      `<option value="body" ${g.mode === 'body' ? 'selected' : ''}>加入正文</option><option value="ref" ${g.mode === 'ref' ? 'selected' : ''}>只引用</option><option value="skip" ${g.mode === 'skip' ? 'selected' : ''}>忽略</option></select></div>`).join('') +
    '<div class="acts"><button class="btn primary" data-act="applygaps">应用</button><button class="btn" data-act="closegaps">取消</button></div></div>';
}
function viewNotes() {
  let h = `<div class="notes"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-bottom:12px"><h1 class="h1">我的讲义</h1><div class="seg" role="group" aria-label="讲义模板">${segBtn('teacher', '教师版')}${segBtn('student', '学生版')}</div></div>`;
  if (!S.hand.length && !S.refs.length) return h + '<div class="empty-box"><p>还没有节点。在知识库里点节点块上的 ⊕，或者在节点页点「加入讲义」，它就会出现在这里。</p>' + (N.contrapos ? '<button class="btn primary" data-act="sample">载入一份示例讲义</button>' : '') + '</div></div>';
  h += `<p class="note">正文 ${S.hand.length} 个节点${S.refs.length ? `，附录 ${S.refs.length} 个` : ''}。按住左边的把手拖动调整顺序；有多套证明的定理可以选用哪一套。${S.noWarn || Object.keys(S.ign).length ? ' <button class="hlink" data-act="warnon">重新显示顺序提示</button>' : ''}</p><ol class="hlist">${S.hand.map(hitem).join('')}</ol>`;
  if (S.refs.length) h += sec('附录：只引用，不展开', '<div class="refs-only">' + S.refs.map(id => `<div class="rrow"><button class="htitle" data-act="node" data-id="${id}">${chip(id)}<span>${esc(N[id].title)}</span></button><button class="ic" data-act="unref" data-id="${id}" aria-label="移出附录">${ICON.x}</button></div>`).join('') + '</div>');
  h += '<div class="acts" style="margin-top:16px"><button class="btn" data-act="gaps">补齐前置</button><button class="btn primary" data-act="preview">生成讲义预览</button><button class="btn" data-act="clear">清空</button></div>';
  if (S.gaps) h += gapsPanel();
  return h + '</div>';
}
function viewPreview() {
  const T = S.tpl === 'teacher', num = {}, app = {};
  S.hand.forEach((x, i) => { num[x.id] = i + 1; });
  S.refs.forEach((id, i) => { app[id] = i + 1; });
  const label = id => num[id] ? `${TYPE[N[id].type][0]} ${num[id]}` : app[id] ? `附录 A${app[id]}` : null;
  const refFn = id => { if (!N[id]) return extRef(id); const l = label(id); return `<span class="xref">${esc(N[id].title)}${l ? `（${l}）` : '（未收录）'}</span>`; };
  let h = `<div class="crumbs"><span class="arrows"><button data-act="hback" aria-label="返回">${ICON.left}</button></span><span>我的讲义</span><span class="sep">›</span><span class="now">预览</span></div>` + (window.previewBar ? window.previewBar() : '');
  h += `<div class="sheetp"><h2>我的讲义</h2><div class="ph-sub">${esc(B.root.title)}，${T ? '教师版' : '学生版'}</div>`;
  S.hand.forEach(x => {
    const id = x.id, n = N[id], q = isQ(n);
    if (T && x.note) h += `<p class="transition">${esc(x.note)}</p>`;
    const kc = n.type === 'def' ? 'def' : n.type === 'method' ? 'method' : q ? 'ex' : '';
    h += `<div class="blk"><div class="blk-h"><span class="k ${kc}">${TYPE[n.type][0]} ${num[id]}</span><span>${esc(n.title.replace(/^(例|练习)：/, ''))}</span>${T ? `<span class="stars s${impOf(x)}" style="margin-left:6px">${'★'.repeat(impOf(x))}</span>` : ''}</div>${fmt(stmtOf(id, x.v), refFn)}`;
    const ps = pf(id);
    const p = ps[x.p ?? defaultIdx(id)];
    if (p && (T || q)) {
      h += `<div class="pf"><div class="pf-h">${q ? '解' : '证明'}</div>${pbody(id, p, refFn)}` + (T && p.deps.length ? `<div class="basis">依据：${p.deps.map(d => isExt(d) ? (EXTN[d] ? `《${EXTN[d].courseTitle}》${EXTN[d].title}` : d) : label(d) || (N[d].title + '（未收录）')).map(esc).join('，')}</div>` : '') + '</div>';
    }
    h += '</div>';
  });
  if (S.refs.length) h += '<div class="appx"><h3>附录：引用到的结论</h3>' + S.refs.map(id => `<div class="blk"><div class="blk-h"><span class="k">A${app[id]}</span><span>${esc(N[id].title)}</span></div>${fmt(N[id].body, refFn)}</div>`).join('') + '</div>';
  return h + '</div>';
}

/* ================= 侧栏、右栏、小地图 ================= */
function minimapHTML() {
  const lines = CH_EDGES.map(([a, b]) => { const [x1, y1] = CH_POS[a], [x2, y2] = CH_POS[b]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--muted)" stroke-width="1.2"/>`; }).join('');
  const nodes = Object.keys(CH_POS).map(ch => {
    const st = stats(ch), [x, y] = CH_POS[ch];
    const fill = !st.total ? 'var(--well)' : st.green ? 'var(--green)' : st.pct > 0 ? 'var(--blue)' : 'var(--muted)';
    const tf = !st.total ? 'var(--muted)' : 'var(--sheet)';
    return `<g class="mm-node" data-act="mm" data-ch="${ch}" role="button" tabindex="0" aria-label="${esc(chLabel(ch))}">` +
      (ch === S.curCh ? `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="var(--pink)" stroke-width="3" opacity=".75"/>` : '') +
      `<circle cx="${x}" cy="${y}" r="11.5" fill="${fill}" stroke="${!st.total ? 'var(--line)' : 'none'}" stroke-dasharray="${!st.total ? '3 2' : ''}"/>` +
      `<text x="${x}" y="${y}" style="fill:${tf}">${B[ch].tag}</text><title>${esc(chLabel(ch))}${st.total ? `：已掌握 ${Math.round(st.pct * 100)}%` : '（待录入）'}</title></g>`;
  }).join('');
  const z = S.mmZoom;
  return `<div class="minimap" id="mm"><div class="small">学习位置导览</div><div class="mm-frame"><svg width="${200 * z}" height="${232 * z}" viewBox="0 0 200 232" aria-label="章节关系图">${lines}${nodes}</svg></div>` +
    `<div class="mm-zoom"><button data-act="mmz" data-d="-1" aria-label="缩小">−</button><input type="range" id="mmr" min="0.8" max="2" step="0.1" value="${z}" aria-label="缩放"><button data-act="mmz" data-d="1" aria-label="放大">+</button></div>` +
    '<div class="mm-legend"><span><i style="background:var(--green)"></i>已掌握</span><span><i style="background:var(--blue)"></i>学习中</span><span><i style="background:var(--muted)"></i>未开始</span><span><i style="background:var(--well);box-shadow:0 0 0 1px var(--line)"></i>待录入</span><span><i style="background:none;box-shadow:0 0 0 2px var(--pink)"></i>当前位置</span></div></div>';
}
function renderMinimap() { const mm = $('#mm'); if (mm) mm.outerHTML = minimapHTML(); }
function renderSide() {
  const v = cur().v, inKB = v === 'kb' || v === 'node';
  $('#side').innerHTML = `<nav class="side-nav" aria-label="导航"><button class="side-btn" data-act="kbtoggle" aria-expanded="${S.kbOpen}"><span>知识库</span>${ICON.chev}</button>` +
    (S.kbOpen ? '<div class="kb-tree">' + CATS.map(c => `<div class="cat">${c.name}</div>` + (c.courses.length ? c.courses.map(co => co.live
      ? (co.id === CSLUG ? `<button class="course" data-act="go" data-v="kb" ${inKB ? 'aria-current="page"' : ''}>${esc(co.title)}</button>` : `<a class="course" href="${courseURL(co.id)}">${esc(co.title)}</a>`)
      : `<span class="course off">${esc(co.title)}（筹备中）</span>`).join('') : '<span class="course off">暂无课程</span>')).join('') + '</div>' : '') +
    `<button class="side-btn" data-act="go" data-v="routes" ${v === 'routes' ? 'aria-current="page"' : ''}><span>讲义推荐</span></button>` +
    `<button class="side-btn" data-act="go" data-v="notes" ${v === 'notes' || v === 'preview' ? 'aria-current="page"' : ''}><span>我的讲义</span>${S.hand.length ? `<span class="count">${S.hand.length}</span>` : ''}</button></nav>` + minimapHTML();
}
function renderRail() {
  const r = cur(), rail = $('#rail');
  clearMath(rail); setTimeout(() => typeset(rail), 0);
  if (r.v === 'kb') {
    rail.innerHTML = '<div class="toc-h">章节导览</div><nav class="toc">' + CHAPS.map(ch =>
      `<button data-act="kbfocus" data-f="ch-${ch}" class="${ch === S.curCh && cur().b === ch ? 'on' : ''}">${esc(chLabel(ch))}</button>` +
      (ch === S.curCh ? sectionsOf(ch).filter(s => s !== ch).map(s => {
        const inside = bubbleChain(cur().b || 'root').includes(s);
        return `<button class="sub ${cur().b === s ? 'on' : ''}" data-act="kbfocus" data-f="sec-${s}">${esc(B[s].title)}</button>` +
          (inside && hasSub(s) ? sectionsOf(s).filter(x => x !== s).map(x => `<button class="sub2 ${cur().b === x ? 'on' : ''}" data-act="kbfocus" data-f="sec-${x}">${esc(B[x].title)}</button>`).join('') : '');
      }).join('') : '')).join('') + '</nav>';
  } else if (r.v === 'node') {
    const sid = nparent[r.id], b = B[sid], ks = b.kids.filter(k => N[k]);
    rail.innerHTML = `<div class="seqnav"><div class="seqnav-h">${esc(b.title)}</div>${b.ordered ? '' : '<div class="free-h">无序节点，任选顺序</div>'}<ol>` +
      ks.map(k => `<li class="${k === r.id ? 'cur' : ''} ${S.mastered.has(k) ? 'done' : ''}"><button data-act="node" data-id="${k}">${esc(N[k].title)}</button></li>`).join('') + '</ol></div>';
  } else rail.innerHTML = '';
}
function updateNav() {
  const v = cur().v;
  const key = { home: 'home', courses: 'kb', kb: 'kb', node: 'kb', routes: 'routes', notes: 'notes', preview: 'notes', search: 'search' }[v];
  document.querySelectorAll('[data-navkey]').forEach(b => { if (b.dataset.navkey === key) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const c = $('#tabcount'); c.textContent = S.hand.length; c.hidden = !S.hand.length;
}

/* ================= 导航 ================= */
const H = { list: [{ v: 'home' }], i: 0 };
const cur = () => H.list[H.i];
let spy;
function page(r) {
  switch (r.v) {
    case 'home': return viewHome();
    case 'courses': return viewCourses();
    case 'kb': return viewKB(r);
    case 'node': return viewNode(r.id);
    case 'search': return viewSearch(r.q);
    case 'routes': return viewRoutes();
    case 'notes': return viewNotes();
    default: return viewPreview();
  }
}
function show(restore) {
  const r = cur(), view = $('#view');
  if (r.v === 'node') S.curCh = chapterOf(nparent[r.id]);
  clearMath(view);
  view.innerHTML = page(r);
  renderSide(); renderRail(); updateNav(); closeDrawer();
  typeset(view);
  bindPage(r);
  fillLazy();
  if (r.v === 'kb') setupSpy(); else if (spy) { spy.disconnect(); spy = null; }
  if (r.v === 'kb' && r.focus && !restore) { const el = document.getElementById(r.focus); if (el) el.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); }
  else window.scrollTo(0, restore ? (r.y || 0) : 0);
}
function soft() { const y = window.scrollY, r = cur(), view = $('#view'); clearMath(view); view.innerHTML = page(r); renderSide(); renderRail(); updateNav(); typeset(view); bindPage(r); if (r.v === 'kb') setupSpy(); window.scrollTo(0, y); fillLazy(); }
function go(r) { cur().y = window.scrollY; H.list = H.list.slice(0, H.i + 1); H.list.push(r); H.i++; show(false); if (window.onNav) window.onNav(r); }
function hmove(d) { const j = H.i + d; if (j < 0 || j >= H.list.length) return; cur().y = window.scrollY; H.i = j; show(true); }
function kbFocus(f) {
  const bid = f.replace(/^(ch|sec)-/, '');
  closeDrawer();
  if (!B[bid]) return go({ v: 'kb' });
  if (cur().v === 'kb' && cur().b === bid) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  go({ v: 'kb', b: bid });
}
function setupSpy() {
  if (spy) spy.disconnect();
  if (!('IntersectionObserver' in window)) return;
  spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting && S.curCh !== e.target.dataset.ch) { S.curCh = e.target.dataset.ch; renderRail(); renderMinimap(); }
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('.chapter').forEach(c => spy.observe(c));
}
function bindPage(r) {
  if (r.v === 'home') bindSearch($('#hq'));
  if (r.v === 'search') {
    const q = $('#pq');
    q.addEventListener('input', () => { r.q = q.value; const box = $('#pres'); box.innerHTML = resultsHTML(q.value); });
  }
}
function bindSearch(input) {
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('input', () => drawDrop(input));
  input.addEventListener('focus', () => drawDrop(input));
  input.addEventListener('keydown', e => {
    const drop = input.parentElement.querySelector('.sdrop');
    if (e.key === 'Enter') { e.preventDefault(); const q = input.value.trim(); if (q) { drop.hidden = true; input.blur(); go({ v: 'search', q }); } }
    if (e.key === 'Escape') { drop.hidden = true; input.blur(); }
  });
}
function openDrawer() { $('#side').classList.add('open'); $('#scrim').hidden = false; }
function closeDrawer() { const s = $('#side'); if (s) s.classList.remove('open'); const sc = $('#scrim'); if (sc) sc.hidden = true; }

/* ================= 操作 ================= */
function afterChange(id) {
  save();
  const r = cur();
  if (r.v === 'kb') { rerenderCard(nparent[id]); renderSide(); updateNav(); const kp = $('.kb-prog'); if (kp) { const st = stats('root'); kp.className = `prog kb-prog ${st.green ? 'green' : ''}`; kp.innerHTML = `<span>已掌握 ${Math.round(st.pct * 100)}%</span><span class="bar"><i style="width:${(st.pct * 100).toFixed(1)}%"></i></span><span>${st.mastered}/${st.total}</span>`; } }
  else soft();
}
function toggleMaster(id) { if (S.mastered.has(id)) S.mastered.delete(id); else S.mastered.add(id); afterChange(id); }
function toggleHand(id) {
  const i = S.hand.findIndex(x => x.id === id);
  if (i >= 0) { S.hand.splice(i, 1); toast('已移出我的讲义'); }
  else { S.hand.push({ id, p: defaultIdx(id) }); S.refs = S.refs.filter(x => x !== id); toast(`已加入我的讲义（共 ${S.hand.length} 个）`); }
  S.gaps = null; afterChange(id);
}
/* 一键调整：把排在后面的前置（连同它们自己排在后面的前置）按原顺序挪到这一条前面 */
function fixOrder(i) {
  const pos = {}; S.hand.forEach((y, k) => { pos[y.id] = k; });
  const need = new Set(), q = depsOf(S.hand[i].id, S.hand[i].p).filter(d => pos[d] > i);
  while (q.length) {
    const d = q.shift(); if (need.has(d)) continue; need.add(d);
    const y = S.hand[pos[d]]; depsOf(y.id, y.p).forEach(e => { if (pos[e] > i && !need.has(e)) q.push(e); });
  }
  if (!need.size) return;
  const moved = S.hand.filter((y, k) => k > i && need.has(y.id)), rest = S.hand.filter(y => !need.has(y.id) || pos[y.id] < i);
  const at = rest.indexOf(S.hand[i]);
  rest.splice(at, 0, ...moved);
  S.hand = rest; S.gaps = null; save(); soft();
  toast(`已把 ${moved.length} 个前置挪到「${N[S.hand[at + moved.length].id].title}」前面`);
}
function moveTo(from, to) {
  if (from === to || to < 0 || to >= S.hand.length) return;
  const [x] = S.hand.splice(from, 1); S.hand.splice(to, 0, x); S.gaps = null; save(); soft();
}
/* 拖动排序：按住左边的把手上下拖（鼠标、触屏都行） */
let DRAG = null;
document.addEventListener('pointerdown', e => {
  const hd = e.target.closest('.hdrag'); if (!hd || e.button > 0) return;
  const li = hd.closest('.hitem'), list = li.parentElement;
  e.preventDefault();
  DRAG = { li, list, from: +li.dataset.i, id: e.pointerId };
  hd.setPointerCapture(e.pointerId);
  li.classList.add('dragging');
});
document.addEventListener('pointermove', e => {
  if (!DRAG || e.pointerId !== DRAG.id) return;
  const items = [...DRAG.list.children].filter(x => x !== DRAG.li);
  let before = null;
  for (const x of items) { const r = x.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { before = x; break; } }
  if (before !== DRAG.li.nextElementSibling) DRAG.list.insertBefore(DRAG.li, before);
  const r = DRAG.list.getBoundingClientRect();
  if (e.clientY < 70) window.scrollBy(0, -12); else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
});
function endDrag(e) {
  if (!DRAG || e.pointerId !== DRAG.id) return;
  const to = [...DRAG.list.children].indexOf(DRAG.li), from = DRAG.from;
  DRAG.li.classList.remove('dragging'); DRAG = null;
  if (to !== from) moveTo(from, to);
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
document.addEventListener('keydown', e => {
  const hd = e.target.closest && e.target.closest('.hdrag'); if (!hd) return;
  const i = +hd.dataset.i, d = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
  if (!d) return;
  e.preventDefault(); moveTo(i, i + d);
  const nb = document.querySelector(`.hdrag[data-i="${i + d}"]`); if (nb) nb.focus();
});
function move(i, d) { const j = i + d; if (j < 0 || j >= S.hand.length) return; [S.hand[i], S.hand[j]] = [S.hand[j], S.hand[i]]; S.gaps = null; save(); soft(); }
function selectNode(sid, id) {
  S.inline = false;
  S.sel[sid] = S.sel[sid] === id ? null : id;
  rerenderCard(sid);
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search')) document.querySelectorAll('.sdrop').forEach(d => { d.hidden = true; });
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
  const a = t.dataset.act, id = t.dataset.id, i = +t.dataset.i;
  switch (a) {
    case 'go': go({ v: t.dataset.v }); break;
    case 'node': document.querySelectorAll('.sdrop').forEach(d => { d.hidden = true; }); go({ v: 'node', id }); break;
    case 'kbfocus': document.querySelectorAll('.sdrop').forEach(d => { d.hidden = true; }); kbFocus(t.dataset.f); break;
    case 'searchall': document.querySelectorAll('.sdrop').forEach(d => { d.hidden = true; }); go({ v: 'search', q: t.dataset.q }); break;
    case 'hback': hmove(-1); break;
    case 'hfwd': hmove(1); break;
    case 'sel': selectNode(t.dataset.sec, id); break;
    case 'detail':
      if (!isMob()) { go({ v: 'node', id }); break; }
      S.inline = !S.inline; rerenderCard(nparent[id]);
      if (!S.inline) { const c = document.getElementById('sec-' + nparent[id]); const m = c && c.querySelector('.card-m'); if (m) m.scrollIntoView({ block: 'start' }); }
      break;
    case 'jump':
      S.inline = false;
      if (cur().v === 'kb' && !document.getElementById('sec-' + nparent[id])) {
        S.sel[nparent[id]] = id; go({ v: 'kb', b: nparent[id] });
        if (isMob()) setTimeout(() => { const m = document.querySelector('.card.sel .card-m'); if (m) m.scrollIntoView({ block: 'start' }); }, 50);
      }
      else if (cur().v === 'kb') { const s = nparent[id], from = t.closest('.card'); if (from && from.dataset.sec !== s) { S.sel[from.dataset.sec] = null; rerenderCard(from.dataset.sec); } S.sel[s] = id; rerenderCard(s); const card = document.getElementById('sec-' + s); const el = card && (window.innerWidth <= 760 ? card.querySelector('.card-m') : card); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      else go({ v: 'node', id });
      break;
    case 'master': toggleMaster(id); break;
    case 'add': toggleHand(id); break;
    case 'vtab':
      S.vsel[id] = i;
      document.querySelectorAll(`[data-act="vtab"][data-id="${id}"]`).forEach(b => b.setAttribute('aria-selected', String(+b.dataset.i === i)));
      document.querySelectorAll(`[data-vpanel^="${id}-"]`).forEach(p => { p.hidden = p.dataset.vpanel !== `${id}-${i}`; });
      break;
    case 'ext': { const e = EXTN[id]; if (e) location.href = `${courseBase(e.course)}/n/${id.slice(id.indexOf(':') + 1)}`; else toast('找不到这个节点'); break; }
    case 'ptab':
      S.psel[id] = i;
      document.querySelectorAll(`[data-act="ptab"][data-id="${id}"]`).forEach(b => b.setAttribute('aria-selected', String(+b.dataset.i === i)));
      document.querySelectorAll(`[data-panel^="${id}-"]`).forEach(p => { p.hidden = p.dataset.panel !== `${id}-${i}`; });
      break;
    case 'trace': {
      const li = t.closest('li[data-tr]'), ex = li.querySelector(':scope > ul');
      if (ex) { ex.remove(); t.textContent = t.dataset.label; }
      else { t.dataset.label = t.textContent; li.insertAdjacentHTML('beforeend', traceList(id)); t.textContent = '收起'; }
      break;
    }
    case 'kbtoggle': S.kbOpen = !S.kbOpen; renderSide(); break;
    case 'mm': kbFocus('ch-' + t.dataset.ch); break;
    case 'mmz': S.mmZoom = Math.min(2, Math.max(0.8, +(S.mmZoom + 0.2 * +t.dataset.d).toFixed(1))); renderMinimap(); break;
    case 'menu': openDrawer(); break;
    case 'scrim': closeDrawer(); break;
    case 'copyroute_old': {
      let n = 0;
      ROUTES[i].items.forEach(k => { if (!inHand(k)) { S.hand.push({ id: k, p: defaultIdx(k) }); S.refs = S.refs.filter(x => x !== k); n++; } });
      S.gaps = null; save(); soft(); toast(`已复制到我的讲义，新增 ${n} 个节点`);
      break;
    }
    case 'fixorder': fixOrder(i); break;
    case 'ignwarn': { const x = S.hand[i], pos = {}; S.hand.forEach((y, k) => { pos[y.id] = k; }); S.ign[x.id] = depsOf(x.id, x.p).filter(d => pos[d] > i).sort().join(','); save(); soft(); toast('已忽略这条提示'); break; }
    case 'nowarn': S.noWarn = true; save(); soft(); toast('不再提示顺序问题'); break;
    case 'warnon': S.noWarn = false; S.ign = {}; save(); soft(); break;
    case 'up': move(i, -1); break;
    case 'down': move(i, 1); break;
    case 'rm': S.hand.splice(i, 1); S.gaps = null; save(); soft(); break;
    case 'unref': S.refs = S.refs.filter(x => x !== id); S.gaps = null; save(); soft(); break;
    case 'noteopen': S.hand[i].noteOpen = true; soft(); { const el = document.getElementById('nt-' + i); if (el) el.focus(); } break;
    case 'gaps': computeGaps(); soft(); { const g = $('#gaps'); if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' }); } break;
    case 'applygaps': applyGaps(); break;
    case 'closegaps': S.gaps = null; soft(); break;
    case 'preview': go({ v: 'preview' }); break;
    case 'tpl': S.tpl = t.dataset.v; save(); soft(); break;
    case 'sample':
      S.hand = [{ id: 'contrapos', p: 0 }, { id: 'mix4', p: 0 }, { id: 'mix3', p: 1 }]; S.refs = []; S.gaps = null; save(); soft();
      toast('已载入示例。点「补齐前置」看看缺什么');
      break;
    case 'clear':
      if (S.clearArm) { S.hand = []; S.refs = []; S.gaps = null; S.clearArm = false; save(); soft(); toast('已清空'); }
      else { S.clearArm = true; t.textContent = '再点一次确认清空'; setTimeout(() => { S.clearArm = false; if (t.isConnected) t.textContent = '清空'; }, 3000); }
      break;
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('g.mm-node')) { e.preventDefault(); kbFocus('ch-' + e.target.dataset.ch); }
});
document.addEventListener('change', e => {
  const t = e.target, a = t.dataset && t.dataset.act, i = +t.dataset.i;
  if (a === 'psel') { S.hand[i].p = +t.value; S.gaps = null; save(); soft(); }
  if (a === 'vsel') { const v = +t.value; if (v) S.hand[i].v = v; else delete S.hand[i].v; save(); }
  if (a === 'impsel') { const k = +t.value; if (k) S.hand[i].imp = k; else delete S.hand[i].imp; save(); }
  if (a === 'gapmode') S.gaps[i].mode = t.value;
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'mmr') { S.mmZoom = +t.value; const svg = $('#mm svg'); if (svg) { svg.setAttribute('width', 200 * S.mmZoom); svg.setAttribute('height', 232 * S.mmZoom); } }
  if (t.dataset && t.dataset.act === 'note') { S.hand[+t.dataset.i].note = t.value; save(); }
});
