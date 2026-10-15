/* 联网功能：账号、同步、审核台、编辑器、路线、PDF、地址栏路由。依赖 core.js 里的全局函数 */
'use strict';
const SLUG = window.COURSE.slug;
const ME = { user: null, pending: {}, ready: false };

/* ================= 接口 ================= */
async function api(method, url, body) {
  const headers = { 'x-mm': '1' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(url, { method, credentials: 'same-origin', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let j = {};
  try { j = await r.json(); } catch (e) { }
  if (!r.ok) { const e = new Error(j.error || `请求失败（${r.status}）`); e.problems = j.problems; e.status = r.status; e.code = j.code; throw e; }
  return j;
}
const fail = e => {
  toast(e.message);
  if (e.status === 401) go({ v: 'login' });
};

/* ================= 计算验证（发验证码前） =================
   在 Web Worker 里找 nonce，使 sha256(题目:nonce) 前 bits 位为 0；不卡页面。 */
const POW_WORKER = `
const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
const W=new Uint32Array(64);
let M=new Uint8Array(256);
function first(m,l){
  const n=((l+9+63)>>6)<<6;m.fill(0,l,n);m[l]=0x80;
  const bl=l*8;m[n-4]=bl>>>24;m[n-3]=bl>>>16;m[n-2]=bl>>>8;m[n-1]=bl;
  let a0=0x6a09e667,b0=0xbb67ae85,c0=0x3c6ef372,d0=0xa54ff53a,e0=0x510e527f,f0=0x9b05688c,g0=0x1f83d9ab,h0=0x5be0cd19;
  for(let o=0;o<n;o+=64){
    for(let i=0;i<16;i++)W[i]=(m[o+4*i]<<24)|(m[o+4*i+1]<<16)|(m[o+4*i+2]<<8)|m[o+4*i+3];
    for(let i=16;i<64;i++){const x=W[i-15],y=W[i-2];W[i]=(((x>>>7)|(x<<25))^((x>>>18)|(x<<14))^(x>>>3))+W[i-16]+(((y>>>17)|(y<<15))^((y>>>19)|(y<<13))^(y>>>10))+W[i-7];}
    let a=a0,b=b0,c=c0,d=d0,e=e0,f=f0,g=g0,h=h0;
    for(let i=0;i<64;i++){const t1=h+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&f)^(~e&g))+K[i]+W[i]|0;const t2=(((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&b)^(a&c)^(b&c))|0;h=g;g=f;f=e;e=d+t1|0;d=c;c=b;b=a;a=t1+t2|0;}
    a0=a0+a|0;b0=b0+b|0;c0=c0+c|0;d0=d0+d|0;e0=e0+e|0;f0=f0+f|0;g0=g0+g|0;h0=h0+h|0;
  }
  return [a0>>>0,b0>>>0];
}
onmessage=ev=>{
  const {challenge,bits}=ev.data,pre=new TextEncoder().encode(challenge+':');
  M=new Uint8Array(pre.length+96);M.set(pre);
  for(let i=0;;i++){
    let s=String(i),l=pre.length;for(let j=0;j<s.length;j++)M[l++]=s.charCodeAt(j);
    const [w0,w1]=first(M,l);
    let z=Math.clz32(w0); if(z===32) z+=Math.clz32(w1);
    if(z>=bits){postMessage(String(i));return;}
  }
};`;
async function solvePow() {
  const { challenge, bits } = await api('GET', '/api/pow');
  const url = URL.createObjectURL(new Blob([POW_WORKER], { type: 'text/javascript' }));
  try {
    const w = new Worker(url);
    const nonce = await new Promise((ok, no) => { w.onmessage = e => ok(e.data); w.onerror = no; w.postMessage({ challenge, bits }); });
    w.terminate();
    return { challenge, nonce };
  } finally { URL.revokeObjectURL(url); }
}
const isEditor = () => !!ME.user && (ME.user.isAdmin || ME.user.roles.some(r => r.course === SLUG));
const isReviewer = () => !!ME.user && (ME.user.isAdmin || ME.user.roles.some(r => r.course === SLUG && r.role === 'reviewer'));
const isReviewerAny = () => !!ME.user && (ME.user.isAdmin || ME.user.roles.some(r => r.role === 'reviewer'));
const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const problemsHTML = ps => ps && ps.length ? `<div class="flag"><strong>没有通过检查：</strong><ul class="plain">${ps.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : '';

/* ================= 学习状态同步 ================= */
let syncT;
window.syncState = () => {
  if (!ME.user) return;
  clearTimeout(syncT);
  syncT = setTimeout(() => api('PUT', `/api/state/${SLUG}`, { mastered: [...S.mastered], hand: S.hand.map(handItem), refs: S.refs, tpl: S.tpl }).catch(() => toast('同步失败，学习记录暂时只保存在这台设备上')), 800);
};
async function loadMe() {
  try {
    const r = await api('GET', `/api/me?course=${SLUG}`);
    ME.user = r.user; ME.pending = r.pending || {};
    if (r.user) {
      const local = S.hand.length || S.mastered.size;
      if (r.state && (r.state.hand.length || r.state.mastered.length)) {
        S.mastered = new Set(r.state.mastered.filter(id => N[id])); S.hand = r.state.hand.filter(x => N[x.id]); S.refs = r.state.refs.filter(id => N[id]); S.tpl = r.state.tpl;
        try { localStorage.setItem(CK('mm_m'), JSON.stringify([...S.mastered])); localStorage.setItem(CK('mm_h'), JSON.stringify(S.hand)); localStorage.setItem(CK('mm_r'), JSON.stringify(S.refs)); } catch (e) { }
      } else if (local) window.syncState();
    }
  } catch (e) { ME.user = null; }
  ME.ready = true;
}

/* ================= 地址栏 ================= */
/* 数学基础的地址不带前缀；其他课程是 /c/<课程>/... */
const BASE = CBASE;
function pathOfRoute(r) {
  const u = pathOfRoute0(r);
  return r.v === 'invite' || !BASE ? u : u === '/' ? BASE : BASE + u;
}
function pathOfRoute0(r) {
  switch (r.v) {
    case 'home': return '/';
    case 'kb': return r.b && r.b !== 'root' ? `/kb/${r.b}` : '/kb';
    case 'node': return `/n/${r.id}`;
    case 'notes': return '/notes';
    case 'preview': return '/notes';
    case 'routes': return '/routes';
    case 'courses': return '/courses';
    case 'search': return `/search?q=${encodeURIComponent(r.q || '')}`;
    case 'me': return '/me';
    case 'login': return '/login';
    case 'invite': return `/invite/${r.token}`;
    case 'review': return '/review';
    case 'sub': return `/review`;
    case 'edit': return `/edit/${r.id || 'new'}`;
    case 'tree': return '/edit/tree';
    case 'shared': return `/r/${r.token}`;
    default: return '/';
  }
}
function routeOfPath() {
  let p = location.pathname; const q = new URLSearchParams(location.search);
  if (BASE && (p === BASE || p.startsWith(BASE + '/'))) p = p.slice(BASE.length) || '/';
  let m;
  if (p === '/kb') return { v: 'kb' };
  if ((m = /^\/kb\/(\w+)$/.exec(p)) && B[m[1]]) return { v: 'kb', b: m[1] };
  if ((m = /^\/n\/(\w+)$/.exec(p)) && N[m[1]]) return { v: 'node', id: m[1] };
  if (p === '/notes') return { v: 'notes' };
  if (p === '/routes') return { v: 'routes' };
  if (p === '/courses') return { v: 'courses' };
  if (p === '/search') return { v: 'search', q: q.get('q') || '' };
  if (p === '/me') return { v: 'me' };
  if (p === '/login') return { v: 'login' };
  if ((m = /^\/invite\/([\w-]+)$/.exec(p))) return { v: 'invite', token: m[1] };
  if (p === '/review') return { v: 'review', tab: ['fb', 'routes', 'apps', 'users'].includes(q.get('tab')) ? q.get('tab') : undefined };
  if (p === '/edit/tree') return { v: 'tree' };
  if ((m = /^\/edit\/(\w+)$/.exec(p))) return m[1] === 'new' ? { v: 'edit', bubble: q.get('b') } : { v: 'edit', id: m[1] };
  if ((m = /^\/r\/([\w-]+)$/.exec(p))) return { v: 'shared', token: m[1] };
  return { v: 'home' };
}
window.onNav = r => { const u = pathOfRoute(r); if (location.pathname + location.search !== u) history.pushState({ i: H.i }, '', u); };
window.addEventListener('popstate', e => {
  const i = e.state && Number.isInteger(e.state.i) ? e.state.i : null;
  if (i !== null && H.list[i] && pathOfRoute(H.list[i]) === location.pathname + location.search) { cur().y = window.scrollY; H.i = i; show(true); }
  else { H.list = H.list.slice(0, H.i + 1); H.list.push(routeOfPath()); H.i++; show(false); }
});

/* ================= 页面分发（覆盖 core.js 的 page） ================= */
const corePage = page;
page = function (r) {
  switch (r.v) {
    case 'login': return viewLogin(r);
    case 'invite': return '<p class="none">正在检查邀请链接……</p>';
    case 'notes': return corePage(r) + backupHTML();
    case 'me': return viewMe();
    case 'review': return viewReview(r);
    case 'sub': return '<p class="none">正在载入提交……</p>';
    case 'edit': return viewEdit(r);
    case 'tree': return viewTree(r);
    case 'shared': return '<p class="none">正在载入路线……</p>';
    case 'routes': return viewRoutesOnline();
    default: return corePage(r);
  }
};
const coreBind = bindPage;
bindPage = function (r) {
  coreBind(r);
  if (r.v === 'node') loadHistory(r.id);
  if (r.v === 'routes') loadRoutes();
  if (r.v === 'me') loadMine();
  if (r.v === 'invite') loadInvite(r);
  if (r.v === 'review') loadReview(r);
  if (r.v === 'sub') loadSub(r.id);
  if (r.v === 'shared') loadShared(r.token);
  if (r.v === 'edit') initEdit(r);
};
const coreUpdateNav = updateNav;
updateNav = function () {
  coreUpdateNav();
  const a = $('#avatar');
  if (a) { a.hidden = !ME.user; a.textContent = ME.user ? ME.user.nickname.slice(0, 1) : ''; a.title = ME.user ? ME.user.nickname : ''; }
  const rv = $('#navreview');
  if (rv) { rv.hidden = !isReviewerAny(); const n = ME.pending.review || 0; rv.innerHTML = `审核台${n ? `<span class="count" style="margin-left:6px">${n}</span>` : ''}`; if (cur().v === 'review' || cur().v === 'sub') rv.setAttribute('aria-current', 'page'); else rv.removeAttribute('aria-current'); }
};
const coreRenderSide = renderSide;
renderSide = function () {
  coreRenderSide();
  const nav = document.querySelector('#side .side-nav');
  if (!nav) return;
  const v = cur().v;
  let extra = '';
  if (isReviewerAny()) extra += `<button class="side-btn" data-act="go" data-v="review" ${v === 'review' || v === 'sub' ? 'aria-current="page"' : ''}><span>审核台</span>${ME.pending.review ? `<span class="count">${ME.pending.review}</span>` : ''}</button>`;
  if (ME.user) extra += `<button class="side-btn" data-act="go" data-v="me" ${v === 'me' ? 'aria-current="page"' : ''}><span>${esc(ME.user.nickname)}</span></button>`;
  else extra += `<button class="side-btn" data-act="go" data-v="login" ${v === 'login' ? 'aria-current="page"' : ''} style="font-size:12px;color:var(--muted)"><span>编辑登录</span></button>`;
  nav.insertAdjacentHTML('beforeend', extra);
};
window.nodeFoot = id => {
  const by = (window.COURSE.reviewers || {})[id];
  const v = (window.COURSE.ver || {})[id] || 1;
  let h = `<div class="foot"><span>放行：${by ? esc(by) + '（审核者）' : 'Maki（首次录入）'}</span><span>第 ${v} 版，撰写者不公开</span></div>`;
  if (isEditor()) h += `<div class="acts"><button class="btn" data-act="editnode" data-id="${id}">修改这个节点</button><button class="btn" data-act="newnode" data-b="${nparent[id]}">在这一节新增节点</button></div>`;
  return h;
};
const coreMidIdle = midIdle;
midIdle = function (sid) {
  return coreMidIdle(sid) + (isEditor() ? `<div class="acts"><button class="btn" data-act="newnode" data-b="${sid}">在这一节新增节点</button><button class="btn ghost" data-act="go" data-v="tree">调整结构</button></div>` : '');
};

/* ================= 登录 / 注册 ================= */
function viewLogin() {
  return `<div style="max-width:420px"><h1 class="h1">登录</h1><p class="muted" style="margin:6px 0 16px">账号只对受邀的编辑、审核者和老师开放。普通学习不需要账号：进度和讲义会存在你的浏览器里。</p>
  <form class="fb-form" id="lg-form"><label class="small" for="lg-acc">昵称、邮箱或手机号</label><input class="field" id="lg-acc" autocomplete="username">
  <label class="small" for="lg-pw">密码</label><input class="field" id="lg-pw" type="password" autocomplete="current-password">
  <button class="btn primary" type="submit">登录</button></form><p class="small" id="lg-msg" style="margin-top:10px"></p>
  <p class="small">忘记密码：请联系管理员，给你发一个重设密码的链接。</p></div>`;
}
async function submitLogin() {
  try {
    await api('POST', '/api/auth/login', { account: $('#lg-acc').value.trim(), password: $('#lg-pw').value });
    await loadMe();
    if (!ME.user) { $('#lg-msg').textContent = '登录成功，但读取账号信息失败，请刷新页面。'; return; }
    toast(`欢迎，${ME.user.nickname}`); go({ v: 'kb' });
  } catch (e) { $('#lg-msg').textContent = e.message; }
}
/* 邀请链接：开通账号，或重设密码 */
async function loadInvite(r) {
  const v = $('#view');
  try {
    const i = await api('GET', `/api/invite/${r.token}`);
    const pw = '<label class="small" for="iv-pw">密码（至少 8 位）</label><input class="field" id="iv-pw" type="password" autocomplete="new-password"><label class="small" for="iv-pw2">再输一次</label><input class="field" id="iv-pw2" type="password" autocomplete="new-password">';
    v.innerHTML = i.kind === 'reset'
      ? `<div style="max-width:420px"><h1 class="h1">重设密码</h1><p class="muted" style="margin:6px 0 16px">账号：${esc(i.nickname)}。设好新密码后会自动登录，其他设备上的登录会失效。</p><form class="fb-form" id="iv-form" data-token="${esc(r.token)}" data-kind="reset">${pw}<button class="btn primary" type="submit">设置新密码</button></form><p class="small" id="iv-msg"></p></div>`
      : `<div style="max-width:420px"><h1 class="h1">${i.admin ? '设置超级管理员' : '开通账号'}</h1><p class="muted" style="margin:6px 0 16px">${i.admin ? '这是网站的第一个账号，拥有全部权限。这个链接只能用一次。' : '你收到了 Maki 开源数学平台的邀请。这个链接只能用一次。'}</p>
        <form class="fb-form" id="iv-form" data-token="${esc(r.token)}"><label class="small" for="iv-nick">昵称（会显示在你放行的内容旁边）</label><input class="field" id="iv-nick" autocomplete="nickname" placeholder="2–16 个字">
        <label class="small" for="iv-email">邮箱（选填，可以用来登录）</label><input class="field" id="iv-email" type="email" autocomplete="email">${pw}<button class="btn primary" type="submit">开通并登录</button></form><p class="small" id="iv-msg"></p></div>`;
  } catch (e) { v.innerHTML = `<div class="empty-box"><p>${esc(e.message)}</p></div>`; }
}
async function submitInvite(f) {
  const msg = $('#iv-msg'), pw = $('#iv-pw').value;
  if (pw !== $('#iv-pw2').value) { msg.textContent = '两次输入的密码不一样'; return; }
  try {
    await api('POST', `/api/invite/${f.dataset.token}`, f.dataset.kind === 'reset' ? { password: pw } : { nickname: $('#iv-nick').value.trim(), email: $('#iv-email').value.trim(), password: pw });
    await loadMe();
    if (!ME.user) { msg.textContent = '账号已经开通，但没能自动登录。请到登录页用昵称和密码登录。'; return; }
    toast(`欢迎，${ME.user.nickname}`); history.replaceState(null, '', '/'); go({ v: 'me' });
  } catch (e) { msg.textContent = e.message; }
}

/* ================= 本地进度：导出 / 导入 ================= */
function backupHTML() {
  return `<section class="sec" style="margin-top:28px"><h2 class="h3">备份进度</h2><p class="small" style="margin:4px 0 10px">你的「已掌握」标记和这份讲义存在这个浏览器里。清理浏览器数据、换手机或换浏览器之前，先导出一个备份文件；到新的地方再导入。</p>
  <div class="acts" style="margin:0"><button class="btn" data-act="exportstate">导出进度</button><button class="btn" data-act="importstate">导入进度</button><input type="file" id="imp-file" accept=".json,application/json" hidden></div></section>`;
}
function exportState() {
  const data = { app: 'maki-math', course: SLUG, at: new Date().toISOString(), mastered: [...S.mastered], hand: S.hand.map(handItem), refs: S.refs, tpl: S.tpl };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  a.download = `maki-math-progress-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('已导出');
}
async function importState(file) {
  try {
    const d = JSON.parse(await file.text());
    if (!d || d.app !== 'maki-math' || !Array.isArray(d.mastered) || !Array.isArray(d.hand)) throw new Error('不是本网站导出的进度文件');
    if (d.course && d.course !== SLUG) throw new Error('这个文件是另一门课的进度');
    const m = d.mastered.filter(id => N[id]);
    m.forEach(id => S.mastered.add(id));
    const hand = d.hand.filter(x => x && N[x.id]).map(x => handItem({ ...x, id: String(x.id), p: Number.isInteger(x.p) ? x.p : 0, note: x.note ? String(x.note).slice(0, 2000) : '' }));
    if (hand.length) { S.hand = hand; S.refs = (d.refs || []).filter(id => N[id]); if (d.tpl === 'student' || d.tpl === 'teacher') S.tpl = d.tpl; }
    save(); soft();
    toast(`已导入：${m.length} 个已掌握${hand.length ? `，讲义 ${hand.length} 个节点` : ''}`);
  } catch (e) { toast(e.message || '文件读不出来'); }
}

/* ================= 我的 ================= */
const ROLE = { editor: '编辑', reviewer: '审核' };
const STATUS = { pending: '审核中', approved: '已通过', rejected: '未通过' };
function viewMe() {
  if (!ME.user) return '<div class="empty-box"><p>请先登录。</p><button class="btn primary" data-act="go" data-v="login">登录 / 注册</button></div>';
  const u = ME.user;
  const roles = [u.isAdmin ? '超级管理员' : '', u.isTeacher ? '认证老师' : '', ...u.roles.map(r => `${courseTitle(r.course)} ${ROLE[r.role]}`)].filter(Boolean);
  const opts = CATS.flatMap(c => c.courses).filter(c => c.id && c.live).map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('');
  return `<div class="notes"><h1 class="h1">${esc(u.nickname)}</h1><p class="muted" style="margin:6px 0 0">${esc([u.email, u.phone].filter(Boolean).join(' · '))}${roles.length ? ' · ' + roles.map(esc).join('、') : ' · 普通用户'}</p>` +
    '<div class="acts"><button class="btn" data-act="logout">退出登录</button></div>' +
    sec('修改密码', '<form class="fb-form" id="pw-form" style="max-width:420px"><input class="field" id="pw-old" type="password" autocomplete="current-password" placeholder="原密码"><input class="field" id="pw-new" type="password" autocomplete="new-password" placeholder="新密码，至少 8 位"><button class="btn" type="submit" style="justify-self:start">修改</button><p class="small" id="pw-msg" style="margin:0"></p></form>') +
    sec('我的提交', '<div id="my-subs"><p class="none">载入中……</p></div>') +
    sec('申请', `<div id="my-apps"></div>
      <details class="fb"><summary>申请认证老师</summary><form class="fb-form" data-form="app" data-kind="teacher"><p class="small" style="margin:0">认证后，你建的路线会带「老师」标识。请写明学校或机构、任教科目，可以附上教学作品链接。</p><textarea name="material" placeholder="例如：某某中学数学老师，教高一、高二……"></textarea><button class="btn primary" type="submit" style="justify-self:start">提交申请</button></form></details>
      <details class="fb"><summary>申请成为编辑</summary><form class="fb-form" data-form="app" data-kind="editor"><label class="small">课程</label><select name="course">${opts}</select><p class="small" style="margin:0">请附上一份样稿：挑一个定理，写出陈述和完整证明（可以用 $公式$）。由这门课的审核者评估。</p><textarea name="material" style="min-height:140px"></textarea><button class="btn primary" type="submit" style="justify-self:start">提交申请</button></form></details>
      <details class="fb"><summary>申请成为审核者</summary><form class="fb-form" data-form="app" data-kind="reviewer"><label class="small">课程</label><select name="course">${opts}</select><p class="small" style="margin:0">需要在这门课里有足够多的提交被采纳，由超级管理员批准。</p><textarea name="material" placeholder="想审核这门课的理由"></textarea><button class="btn primary" type="submit" style="justify-self:start">提交申请</button></form></details>`) + '</div>';
}
const courseTitle = slug => { const c = CATS.flatMap(x => x.courses).find(c => c.id === slug); return c ? c.title : slug; };
async function loadMine() {
  if (!ME.user) return;
  try {
    const [s, a] = await Promise.all([api('GET', '/api/me/submissions'), api('GET', '/api/me/applications')]);
    const box = $('#my-subs');
    if (box) box.innerHTML = s.items.length ? '<div class="refs-only">' + s.items.map(x => `<div class="rrow" style="padding:8px 12px;display:block"><div><strong>${esc(x.summary)}</strong> <span class="small">${x.kind === 'tree' ? '结构' : esc((N[x.target] || {}).title || x.target)} · ${fmtDate(x.created_at)} · ${STATUS[x.status]}${x.reviewer ? ' · 审核：' + esc(x.reviewer) : ''}</span></div>${x.review_note ? `<div class="small">审核意见：${esc(x.review_note)}</div>` : ''}</div>`).join('') + '</div>'
      : `<p class="none">${isEditor() ? '还没有提交。在节点页点「修改这个节点」开始。' : '成为编辑后，你的修改会出现在这里。'}</p>`;
    const ab = $('#my-apps');
    if (ab) ab.innerHTML = a.items.length ? '<ul class="plain" style="margin-bottom:8px">' + a.items.map(x => `<li>${{ teacher: '认证老师', editor: '编辑', reviewer: '审核者' }[x.kind]}${x.course ? `（${esc(courseTitle(x.course))}）` : ''}：${STATUS[x.status]}${x.note ? `，${esc(x.note)}` : ''}</li>`).join('') + '</ul>' : '';
  } catch (e) { fail(e); }
}

/* ================= 审核台 ================= */
function viewReview(r) {
  if (!isReviewerAny()) return '<div class="empty-box"><p>只有审核者能打开审核台。</p></div>';
  const tab = r.tab || 'subs';
  const t = (k, l) => `<button data-act="revtab" data-t="${k}" aria-pressed="${tab === k}">${l}<span data-cnt="${k}"></span></button>`;
  return `<h1 class="h1">审核台</h1><p class="muted" style="margin:6px 0 14px">你放行的内容会显示你的昵称。</p><div class="seg" role="group" aria-label="审核分类" style="margin-bottom:16px;flex-wrap:wrap">${t('subs', '提交')}${t('fb', '反馈')}${t('routes', '路线')}${t('apps', '申请')}${ME.user.isAdmin ? t('users', '成员') : ''}</div><div id="rev-alert"></div><div id="rev"><p class="none">载入中……</p></div>`;
}
let REV = null;
async function loadReview(r) {
  const tab = r.tab || 'subs', box = () => $('#rev');
  try {
    if (tab === 'users') return renderUsers('');
    REV = await api('GET', '/api/review');
    for (const [k, n] of Object.entries({ subs: REV.counts.subs, fb: REV.counts.fb, routes: REV.counts.routes, apps: REV.counts.apps })) { const el = document.querySelector(`[data-cnt="${k}"]`); if (el) el.textContent = n ? ` ${n}` : ''; }
    ME.pending.review = REV.counts.total; updateNav();
    const al = $('#rev-alert');
    if (al && REV.sends) al.innerHTML = `<p class="small" style="margin:-6px 0 14px">过去 24 小时发出验证码：短信 ${REV.sends.sms} 条，邮件 ${REV.sends.email} 封。</p>` +
      (REV.sends.capHits.length ? `<div class="stmt" style="border-color:var(--red,#c0392b);margin-bottom:14px"><strong>注意：</strong>过去 24 小时有 ${REV.sends.capHits.length} 次触发了发送上限，可能有人在刷验证码。上限会自动挡住，不会多花钱；如果持续出现，可以在配置里调低上限。</div>` : '');
    let h = '';
    if (tab === 'subs') h = REV.submissions.length ? '<div class="results">' + REV.submissions.map(s => s.course !== SLUG ? `<a class="res" href="${courseBase(s.course)}/review"><span class="res-t"><span>${esc(s.summary)}</span><span class="small">《${esc(courseTitle(s.course))}》的提交 · ${esc(s.author)} · 到那门课里审核 ›</span></span></a>` : `<button class="res" data-act="opensub" data-id="${s.id}"><span class="res-t"><span>${esc(s.summary)}</span><span class="small">${s.kind === 'tree' ? '调整结构' : (N[s.target] ? '修改：' + esc(N[s.target].title) : '新增：' + esc(s.target))} · ${esc(s.author)} · ${fmtDate(s.created_at)}</span></span></button>`).join('') + '</div>' : '<p class="none">没有待审的提交。</p>';
    if (tab === 'fb') h = REV.feedback.length ? '<div class="routes">' + REV.feedback.map(f => f.course !== SLUG ? `<article class="route"><div class="route-h"><span class="chip t-ex">${esc(f.kind)}</span><a class="ref" href="${courseBase(f.course)}/review?tab=fb">《${esc(courseTitle(f.course))}》的反馈，到那门课里处理 ›</a></div><p>${esc(f.text)}</p></article>` : `<article class="route"><div class="route-h"><span class="chip t-ex">${esc(f.kind)}</span><button class="ref" data-act="node" data-id="${f.node_id}">${esc((N[f.node_id] || {}).title || f.node_id)}</button><span class="small">${esc(f.author || '')} · ${fmtDate(f.created_at)}</span></div><p>${esc(f.text)}</p><form class="fb-form" data-form="resolve" data-id="${f.id}"><textarea name="resolution" placeholder="处理结果（会公开显示在节点页）"></textarea><button class="btn primary" type="submit" style="justify-self:start">标记为已处理</button></form></article>`).join('') + '</div>' : '<p class="none">没有待处理的反馈。</p>';
    if (tab === 'routes') h = REV.routes.length ? '<div class="routes">' + REV.routes.map(r => r.course !== SLUG ? `<article class="route"><div class="route-h"><h2 class="h3">${esc(r.title)}</h2><a class="ref" href="${courseBase(r.course)}/review?tab=routes">《${esc(courseTitle(r.course))}》的路线，到那门课里审核 ›</a></div></article>` : `<article class="route"><div class="route-h"><h2 class="h3">${esc(r.title)}</h2><span class="small">${esc(r.owner)}</span>${r.teacher ? '<span class="teacher">老师</span>' : ''}${r.reshare ? '<span class="chip t-ex">修改后重新提交</span>' : ''}</div><p>${esc(r.descr)}</p><ol class="plain" style="margin:0 0 10px">${r.items.map(x => `<li>${N[x.id] ? refBtn(x.id) : esc(x.id)}${x.ref ? '（附录）' : ''}${x.note ? `<div class="small">过渡：${esc(x.note)}</div>` : ''}</li>`).join('')}</ol>` +
      `<form class="fb-form" data-form="route" data-id="${r.id}">${r.want_featured ? '<label class="small"><input type="checkbox" name="featured" checked> 作者希望进推荐列表；勾选即放进「讲义推荐」</label>' : ''}<textarea name="note" placeholder="审核意见（拒绝时必填）"></textarea><div class="acts" style="margin:0"><button class="btn primary" type="submit" data-approve="1">通过</button><button class="btn" type="submit" data-approve="0">不通过</button></div></form></article>`).join('') + '</div>' : '<p class="none">没有待审的路线。</p>';
    if (tab === 'apps') h = REV.applications.length ? '<div class="routes">' + REV.applications.map(a => `<article class="route"><div class="route-h"><h2 class="h3">${esc(a.nickname)} 申请${{ teacher: '认证老师', editor: '成为编辑', reviewer: '成为审核者' }[a.kind]}</h2>${a.course ? `<span class="small">${esc(courseTitle(a.course))}</span>` : ''}</div><div class="stmt" style="margin:8px 0">${a.kind === 'editor' ? toHtmlLite(a.material) : `<p>${esc(a.material)}</p>`}</div>` +
      (a.score ? `<p class="small">被采纳 ${a.score.accepted} 次，平均 ${a.score.avg.toFixed(2)} 分，隐藏分 ${a.score.hidden}${a.score.eligible ? '，已达到门槛' : '，未达到门槛'}</p>` : '') +
      `<form class="fb-form" data-form="app-decide" data-id="${a.id}"><textarea name="note" placeholder="备注（申请人能看到）"></textarea><div class="acts" style="margin:0"><button class="btn primary" type="submit" data-approve="1">批准</button><button class="btn" type="submit" data-approve="0">不批准</button></div></form></article>`).join('') + '</div>' : '<p class="none">没有待处理的申请。</p>';
    box().innerHTML = h; typeset(box());
  } catch (e) { fail(e); if (box()) box().innerHTML = `<p class="none">${esc(e.message)}</p>`; }
}
const toHtmlLite = src => /^\s*</.test(src) ? src : String(src).split(/\n\s*\n/).map(p => /^\$\$[\s\S]*\$\$$/.test(p.trim()) ? p : `<p>${esc(p)}</p>`).join('');
function showLink(url, label) {
  const box = $('#inv-out');
  if (box) box.innerHTML = `<div class="stmt" style="margin:10px 0"><p class="small" style="margin:0 0 6px">${esc(label)}。复制后发给对方：</p><p style="margin:0 0 8px;word-break:break-all"><code>${esc(url)}</code></p><button class="btn" data-act="copylink" data-u="${esc(url)}">复制链接</button></div>`;
  else toast(url);
}
/* 成员页：每个成员可以选任意一门课，再设为/撤销那门课的编辑、审核 */
const ADMU = {}, ADMSEL = {};
const admCourse = id => ADMSEL[id] || SLUG;
const admRoleBtns = (u, course) => ['editor', 'reviewer'].map(role => { const has = u.roles.some(x => x.course === course && x.role === role); return `<button class="btn ${has ? 'on' : ''}" data-act="admrole" data-id="${u.id}" data-course="${esc(course)}" data-role="${role}" data-grant="${has ? 0 : 1}">${has ? '撤销' : '设为'}${ROLE[role]}</button>`; }).join('');
async function renderUsers(q) {
  try {
    const [r, iv] = await Promise.all([api('GET', `/api/admin/users?q=${encodeURIComponent(q)}`), api('GET', '/api/admin/invites')]);
    r.items.forEach(u => { ADMU[u.id] = u; });
    const t = Date.now();
    const invRows = iv.items.slice(0, 10).map(i => `<li>${i.kind === 'reset' ? `重设密码：${esc(i.target || '')}` : `邀请${i.note ? `「${esc(i.note)}」` : ''}`} · ${fmtDate(i.created_at)} · ${i.used_at ? `已使用${i.used_nickname ? `（${esc(i.used_nickname)}）` : ''}` : i.expires_at < t ? '已失效' : `<span>未使用</span> <button class="ref" data-act="rminvite" data-id="${i.id}">作废</button>`}</li>`).join('');
    $('#rev').innerHTML = `<section style="margin-bottom:22px"><h2 class="h3">邀请新成员</h2><p class="small" style="margin:4px 0 8px">生成一个只能用一次的链接发给对方，对方打开后设置昵称和密码就开通了账号。开通后在下面给他设权限。</p>
      <div style="display:flex;gap:8px;max-width:520px"><input class="field" id="inv-note" placeholder="备注，例如：张老师（只有你看得到）"><button class="btn primary" data-act="mkinvite" style="flex:none">生成邀请链接</button></div><div id="inv-out"></div>
      ${invRows ? `<details class="fb"><summary>最近的链接</summary><ul class="plain small">${invRows}</ul></details>` : ''}</section>` +
      `<form class="fb-form" data-form="usersearch" style="max-width:420px"><input class="field" name="q" value="${esc(q)}" placeholder="按昵称、邮箱或手机号搜索"></form><div class="routes" style="margin-top:12px">` +
      r.items.map(u => `<article class="route"><div class="route-h"><h2 class="h3">${esc(u.nickname)}</h2><span class="small">${esc([u.email, u.phone || '未登记手机号'].filter(Boolean).join(' · '))} · ${fmtDate(u.created_at)}</span>${u.is_admin ? '<span class="chip t-thm">超管</span>' : ''}${u.is_teacher ? '<span class="teacher">老师</span>' : ''}${u.banned ? '<span class="chip t-ex">已停用</span>' : ''}</div>` +
        `<p class="small">${u.roles.map(x => `${esc(courseTitle(x.course))} ${ROLE[x.role]}`).join('、') || '没有课程权限'}</p><div class="acts">` +
        `<select class="field" data-admc="${u.id}" aria-label="选择课程" style="width:auto;flex:none">${CATS.flatMap(c => c.courses).map(c => `<option value="${esc(c.id)}"${c.id === admCourse(u.id) ? ' selected' : ''}>${esc(c.title)}${c.live ? '' : '（筹备中）'}</option>`).join('')}</select><span id="admr-${u.id}" style="display:contents">${admRoleBtns(u, admCourse(u.id))}</span>` +
        `<button class="btn" data-act="admflag" data-id="${u.id}" data-k="teacher" data-val="${u.is_teacher ? 0 : 1}">${u.is_teacher ? '取消老师认证' : '认证为老师'}</button>` +
        `<button class="btn" data-act="admphone" data-id="${u.id}">${u.phone ? '修改手机号' : '登记手机号'}</button><button class="btn" data-act="mkreset" data-id="${u.id}">重设密码链接</button>` +
        (u.is_admin ? '' : `<button class="btn" data-act="admflag" data-id="${u.id}" data-k="banned" data-val="${u.banned ? 0 : 1}">${u.banned ? '恢复账号' : '停用账号'}</button>`) + '</div></article>').join('') + '</div>';
  } catch (e) { fail(e); }
}

/* 提交详情：左边是现在的内容，右边是提交后的内容 */
function nodePreviewHTML(n) {
  if (!n) return '<p class="none">（删除这个节点）</p>';
  const q = n.type === 'example' || n.type === 'exercise', ps = n.proofs || n.sols || [];
  const nm = id => N[id] ? N[id].title : titleOf(id);
  return `<div class="mini-meta"><span class="chip ${TYPE[n.type][1]}">${TYPE[n.type][0]}</span><span class="stars s${n.imp}">${'★'.repeat(n.imp)}</span></div><div class="mini-title">${esc(n.title)}</div>` +
    `${(n.alias || []).length ? `<p class="small">别名：${n.alias.map(esc).join('、')}</p>` : ''}${(n.deps || []).length ? `<p class="small">前置：${n.deps.map(d => esc(nm(d))).join('、')}</p>` : ''}${(n.attach || []).length ? `<p class="small">挂靠：${n.attach.map(d => esc(nm(d))).join('、')}</p>` : ''}` +
    `<div class="stmt">${fmt(n.body, id => `<span class="xref">${esc(nm(id))}</span>`)}</div>` +
    (n.variants || []).map((v, i) => `<div class="stmt" style="margin-top:6px"><p class="small" style="margin:0 0 4px">等价说法${CN[i]}：${esc(v.name)}</p>${fmt(v.body, id => `<span class="xref">${esc(nm(id))}</span>`)}</div>`).join('') +
    ps.map((p, i) => `<div class="pbox" style="margin-top:8px"><div class="uses">${q ? '解答' : '证明'}${CN[i]}：${esc(p.name)}；用到：${p.deps.map(d => esc(nm(d))).join('、') || '无'}</div><div class="pbody">${fmt(p.body, id => `<span class="xref">${esc(nm(id))}</span>`)}</div></div>`).join('');
}
async function loadSub(id) {
  const v = $('#view');
  try {
    const r = await api('GET', `/api/submissions/${id}`), s = r.submission;
    const nodeNew = s.kind === 'node' && !r.current;
    let h = `<div class="crumbs"><span class="arrows"><button data-act="hback" aria-label="返回">${ICON.left}</button></span><span>审核台</span><span class="sep">›</span><span class="now">提交 #${s.id}</span></div>` +
      `<h1 class="h2">${esc(s.summary)}</h1><p class="muted" style="margin:6px 0 14px">${esc(s.author)} · ${fmtDate(s.created_at)} · ${s.kind === 'tree' ? '调整结构' : nodeNew ? `新增节点「${esc(s.target)}」，放在「${esc((B[s.payload.bubble] || {}).title || s.payload.bubble)}」` : '修改节点'} · 作者被采纳 ${r.authorScore.accepted} 次</p>`;
    if (s.kind === 'node') {
      h += `<div class="cmp"><div><p class="sec-label">现在</p>${r.current ? nodePreviewHTML(r.current) : '<p class="none">（新节点）</p>'}</div><div><p class="sec-label">提交后</p>${nodePreviewHTML(s.payload.data)}</div></div>`;
    } else {
      const diff = treeDiff(r.current.B, s.payload.B);
      h += `<div class="stmt"><ul class="plain">${diff.map(d => `<li>${esc(d)}</li>`).join('') || '<li>结构没有变化</li>'}</ul></div>`;
    }
    if (s.status === 'pending' && isReviewer() && (s.author_id !== ME.user.id || ME.user.isAdmin)) {
      h += `<form class="fb-form" data-form="decide" data-id="${s.id}" style="margin-top:18px;max-width:560px"><label class="small" for="sc">质量评分（计入作者隐藏分，作者看不到）</label><select id="sc" name="score"><option value="3">3 分：很好</option><option value="2" selected>2 分：合格</option><option value="1">1 分：勉强</option></select><textarea name="note" placeholder="审核意见（不通过时必填）"></textarea><div id="dec-msg"></div><div class="acts" style="margin:0"><button class="btn primary" type="submit" data-approve="1">通过并发布</button><button class="btn" type="submit" data-approve="0">不通过</button></div></form>`;
    } else h += `<p class="small" style="margin-top:14px">状态：${STATUS[s.status]}${s.review_note ? `，${esc(s.review_note)}` : ''}</p>`;
    v.innerHTML = h; typeset(v);
  } catch (e) { fail(e); v.innerHTML = `<p class="none">${esc(e.message)}</p>`; }
}
function treeDiff(a, b) {
  const out = [], label = (T, x) => T[x] ? (T[x].title || '（分组）') : N[x] ? N[x].title : x;
  for (const id of Object.keys(b)) {
    if (!a[id]) { out.push(`新增泡泡「${b[id].title || id}」：${b[id].kids.map(k => label(b, k)).join('、')}`); continue; }
    if ((a[id].title || '') !== (b[id].title || '')) out.push(`泡泡「${a[id].title}」改名为「${b[id].title}」`);
    if (!!a[id].ordered !== !!b[id].ordered) out.push(`「${label(b, id)}」改为${b[id].ordered ? '有序' : '任选顺序'}`);
    if (JSON.stringify(a[id].kids) !== JSON.stringify(b[id].kids)) out.push(`「${label(b, id)}」的内容变为：${b[id].kids.map(k => label(b, k)).join(' → ')}`);
    if ((a[id].green || 0) !== (b[id].green || 0)) out.push(`「${label(b, id)}」的变绿阈值改为：${b[id].green ? Math.round(b[id].green * 100) + '%' : '沿用上一级'}`);
    if ((a[id].desc || '') !== (b[id].desc || '')) out.push(`「${label(b, id)}」的简介改为：${b[id].desc || '（空）'}`);
  }
  for (const id of Object.keys(a)) if (!b[id]) out.push(`删除泡泡「${a[id].title || id}」`);
  return out;
}

/* ================= 节点历史与反馈 ================= */
async function loadHistory(id) {
  try {
    const r = await api('GET', `/api/node/${SLUG}/${id}/history`), box = document.getElementById('history');
    if (!box || box.dataset.id !== id) return;
    let h = '';
    if (r.feedback.length) h += sec('反馈处理记录', '<div class="refs-only">' + r.feedback.map(f => `<div class="rrow" style="display:block;padding:8px 12px"><div class="small">${esc(f.kind)} · ${fmtDate(f.decided_at)} · 处理：${esc(f.handler || '')}</div><div>${esc(f.text)}</div><div class="small">处理结果：${esc(f.resolution)}</div></div>`).join('') + '</div>');
    h += sec(`版本历史（${r.versions.length}）`, '<div class="refs-only">' + r.versions.map((v, i) => `<div class="rrow" style="display:block;padding:8px 12px"><div><strong>第 ${v.version} 版</strong> <span class="small">${fmtDate(v.created_at)} · ${v.reviewer ? '放行：' + esc(v.reviewer) : '首次录入'}</span></div><div class="small">${esc(v.summary)}</div>` +
      (isReviewer() && i > 0 && !v.deleted ? `<details class="fb" style="margin-top:4px"><summary>回滚到这个版本</summary><form class="fb-form" data-form="rollback" data-id="${id}" data-v="${v.version}"><input class="field" name="reason" placeholder="回滚原因（会记入历史）"><button class="btn" type="submit" style="justify-self:start">回滚</button></form></details>` : '') + '</div>').join('') + '</div>');
    box.innerHTML = h;
  } catch (e) { }
}

/* ================= 编辑器 ================= */
const TYPE_OPTS = [['def', '定义'], ['thm', '定理'], ['prop', '性质'], ['method', '方法'], ['axiom', '公理'], ['note', '注记'], ['example', '例题'], ['exercise', '练习']];
let ED = null;
function bubbleOptions(sel) {
  const out = [];
  (function w(b, depth) { for (const k of B[b].kids) if (B[k]) { if (B[k].title) out.push(`<option value="${k}" ${k === sel ? 'selected' : ''}>${'　'.repeat(depth)}${esc(B[k].tag ? chLabel(k) : B[k].title)}</option>`); w(k, B[k].title ? depth + 1 : depth); } })('root', 0);
  return out.join('');
}
/* 前置课程的节点目录：编辑器里可以引用「课程:节点」 */
const EXTCAT = {};
let extLoaded = false;
async function loadExtCatalog() {
  if (extLoaded || !(window.COURSE.prereqs || []).length) return;
  extLoaded = true;
  try {
    for (const cs of window.COURSE.prereqs) {
      const r = await api('GET', `/api/catalog/${cs}`);
      for (const [id, [title, type]] of Object.entries(r.nodes)) EXTCAT[`${cs}:${id}`] = [title, type, r.title];
    }
    const dl = document.getElementById('node-list');
    if (dl) dl.insertAdjacentHTML('beforeend', Object.entries(EXTCAT).map(([k, v]) => `<option value="${esc(v[0])}（${esc(v[2])}） · ${k}"></option>`).join(''));
  } catch (e) { extLoaded = false; }
}
/* ---------- 新写法：Markdown + Typst 公式 ---------- */
const TYP = !!(window.COURSE && window.COURSE.settings && window.COURSE.settings.format === 'typst');
const SRC = {};
const TYP_HELP = `<div class="muted" style="margin:6px 0 14px">正文用 <strong>Markdown</strong>，公式用 <strong>Typst</strong>（不能用 LaTeX）。边写边在下面显示效果，提交后由审核者放行。
<details class="fb" style="margin-top:6px"><summary>写法速查</summary><div class="tt-wrap"><table class="tt cheat"><thead><tr><th>想要</th><th>这样写</th></tr></thead><tbody>
<tr><td>分段</td><td><code>空一行</code></td></tr><tr><td>加粗、斜体</td><td><code>**重点**</code>　<code>*强调*</code></td></tr>
<tr><td>列表、编号</td><td><code>- 第一条</code>　<code>1. 第一步</code></td></tr><tr><td>不带圆点的列表（选择题选项）</td><td><code>+ (A) ……</code></td></tr><tr><td>提示框</td><td><code>&gt; **思路** ……</code></td></tr>
<tr><td>表格（真值表的 T/F 会自动上色）</td><td><code>| $p$ | $q$ |</code> 换行 <code>| --- | --- |</code> 换行 <code>| T | F |</code></td></tr>
<tr><td>小字注释</td><td><code>-# 这一条留作练习</code></td></tr><tr><td>引用别的节点</td><td><code>[[节点编号]]</code></td></tr>
<tr><td>行内公式 / 独立公式</td><td><code>$x^2 + 1$</code>　<code>$$ sum_(k=1)^n k = (n(n+1))/2 $$</code></td></tr>
<tr><td>分式、根号</td><td><code>(a+b)/c</code>　<code>frac(a, b)</code>　<code>sqrt(x)</code>　<code>root(3, x)</code></td></tr>
<tr><td>上下标（多个字符用圆括号）</td><td><code>x_(n+1)^2</code>　<code>e^(i pi)</code></td></tr>
<tr><td>希腊字母、数集</td><td><code>alpha epsilon pi phi</code>　<code>NN ZZ QQ RR CC</code></td></tr>
<tr><td>逻辑、集合</td><td><code>and or not => &lt;=&gt; forall exists</code>　<code>in in.not subset subset.eq union inter emptyset</code></td></tr>
<tr><td>关系、箭头</td><td><code>&lt;= &gt;= != approx equiv</code>　<code>-&gt; |-&gt; =&gt;</code></td></tr>
<tr><td>求和、极限、积分</td><td><code>sum_(i=1)^n</code>　<code>lim_(x -&gt; 0)</code>　<code>integral_0^1 f(x) dif x</code></td></tr>
<tr><td>绝对值、取整、组合数</td><td><code>abs(x)</code>　<code>floor(x)</code>　<code>binom(n, k)</code></td></tr>
<tr><td>分段函数、矩阵</td><td><code>cases(1 &amp; x &gt; 0, 0 &amp; "其他")</code>　<code>mat(1, 2; 3, 4)</code>　增广矩阵 <code>mat(augment: #2, 1, 2, 3; 4, 5, 6)</code></td></tr>
<tr><td>多行对齐</td><td><code>$$ a &amp;= b \\ &amp;= c $$</code>（<code>\\</code> 换行，<code>&amp;</code> 对齐）</td></tr>
<tr><td>公式里的文字</td><td><code>"当且仅当"</code>（加双引号）</td></tr>
</tbody></table></div><p class="small" style="margin:6px 0 0">注意：几个字母连写会被当成一个名字，变量之间要加空格，比如 <code>a b</code>、<code>2 x y</code>。标题里不能写公式，直接用 ε、≤、→、x² 这类符号。</p></details></div>`;
const srcErrorsHTML = errs => `<div class="flag"><strong>有 ${errs.length} 个公式没有通过编译：</strong><ul>${errs.map(e => `<li><code>${esc(e.formula)}</code>：${esc(e.msg)}</li>`).join('')}</ul></div>`;
const LIVE_T = {};
function livePreview(ta) {
  const box = document.querySelector(`[data-live-for="${ta.id}"]`);
  if (!box) return;
  const run = async () => {
    const src = ta.value;
    if (!src.trim()) { box.innerHTML = ''; return; }
    try {
      const r = await api('POST', '/api/render', { src });
      if (ta.value !== src) return;
      const html = (r.errors.length ? srcErrorsHTML(r.errors) : '') + `<div class="pbody">${fmt(r.html)}</div>`;
      MJQ = MJQ.then(() => { clearMath(box); box.innerHTML = html; }); typeset(box);
    } catch (e) { box.innerHTML = problemsHTML([e.message]); }
  };
  ta.oninput = () => { clearTimeout(LIVE_T[ta.id]); LIVE_T[ta.id] = setTimeout(run, 500); };
  run();
}

/* 只有段落的 HTML 转回简化写法，方便编辑；含表格、列表的保持 HTML */
function toSimple(h) {
  if (!/^\s*</.test(h || '')) return h || '';
  const t = h.replace(/<p>([\s\S]*?)<\/p>\s*/g, '$1\n\n').trim();
  return /<[a-z\/!]/i.test(t) ? h : t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function viewEdit(r) {
  if (!isEditor()) return '<div class="empty-box"><p>只有这门课的编辑可以修改内容。</p><button class="btn" data-act="go" data-v="me">去申请成为编辑</button></div>';
  const n = r.id ? N[r.id] : null;
  if (r.id && !n) return '<p class="none">节点不存在。</p>';
  if (n && pf(r.id).some(p => p.body == null)) { window.ensureBodies([r.id]).then(() => { if (cur() === r) soft(); }, () => toast('载入失败')); return '<p class="none">载入中……</p>'; }
  if (n && TYP && !SRC[r.id]) { api('GET', `/api/src/${SLUG}/${r.id}`).then(x => { SRC[r.id] = x; if (cur() === r) soft(); }, () => toast('载入源文失败')); return '<p class="none">载入中……</p>'; }
  ED = n ? JSON.parse(JSON.stringify(n)) : { type: 'thm', imp: 2, title: '', alias: [], deps: [], body: '', proofs: [{ name: '证明', deps: [], body: '' }] };
  if (!ED.proofs && !ED.sols && !['def', 'note'].includes(ED.type)) ED.proofs = [];
  ED.deps = ED.deps || []; ED.alias = ED.alias || []; (ED.proofs || ED.sols || []).forEach(p => { p.deps = p.deps || []; });
  if (TYP) {
    const S = n ? SRC[r.id] : { src: '', proofs: [], variants: [] };
    ED.body = S.src || ''; (ED.proofs || ED.sols || []).forEach((p, i) => { p.body = S.proofs[i] || ''; });
    ED.variants = (ED.variants || []).map((v, i) => ({ name: v.name, body: S.variants[i] || '' }));
  } else {
    ED.body = toSimple(ED.body); (ED.proofs || ED.sols || []).forEach(p => { p.body = toSimple(p.body); });
    ED.variants = (ED.variants || []).map(v => ({ name: v.name, body: toSimple(v.body) }));
  }
  loadExtCatalog();
  const opts = Object.keys(N).map(id => `<option value="${esc(N[id].title)} · ${id}"></option>`).join('') + Object.entries(EXTCAT).map(([k, v]) => `<option value="${esc(v[0])}（${esc(v[2])}） · ${k}"></option>`).join('');
  return `<div class="notes"><div class="crumbs"><span class="arrows"><button data-act="hback" aria-label="返回">${ICON.left}</button></span><span>${n ? '修改节点' : '新增节点'}</span></div>
  <h1 class="h1">${n ? esc(n.title) : '新增节点'}</h1>
  ${TYP ? TYP_HELP : '<p class="muted" style="margin:6px 0 14px">写法：空一行分段；<code>$公式$</code> 是行内公式，<code>$$公式$$</code> 是独立公式；<code>[[节点编号]]</code> 引用别的节点。含表格、列表的内容直接写 HTML。提交后由审核者放行，系统会先检查顺序。</p>'}
  <datalist id="node-list">${opts}</datalist>
  <form class="fb-form" id="ed-form" style="max-width:none">
    ${n ? '' : `<label class="small" for="ed-id">节点编号（字母、数字、下划线，提交后不能改）</label><input class="field" id="ed-id" placeholder="例如 thm_cantor"><label class="small" for="ed-bub">放在哪一节</label><select id="ed-bub">${bubbleOptions(r.bubble)}</select>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="small" for="ed-type">类型</label><select id="ed-type">${TYPE_OPTS.map(([k, l]) => `<option value="${k}" ${ED.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div><label class="small" for="ed-imp">重要性</label><select id="ed-imp">${[3, 2, 1].map(i => `<option value="${i}" ${ED.imp === i ? 'selected' : ''}>${'★'.repeat(i)} ${IMP[i]}</option>`).join('')}</select></div></div>
    <label class="small" for="ed-title">标题</label><input class="field" id="ed-title" value="${esc(ED.title)}">
    <label class="small" for="ed-alias">别名（用逗号分开，方便搜索）</label><input class="field" id="ed-alias" value="${esc((ED.alias || []).join('，'))}">
    <label class="small">节点本身的前置（定义、注记用；定理的前置写在每套证明里）</label><div class="deps" data-k="deps"></div>
    <div id="ed-attach-wrap"><label class="small">挂靠的知识点（例题、练习必填）</label><div class="deps" data-k="attach"></div></div>
    <label class="small" for="ed-body">正文</label><textarea id="ed-body" class="srcbox" style="min-height:140px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px">${esc(ED.body)}</textarea>${TYP ? '<div class="live" data-live-for="ed-body"></div>' : ''}
    <div id="ed-variants"></div>
    <button type="button" class="btn" data-act="addvariant" style="justify-self:start">＋ 加一种等价说法</button>
    <div id="ed-proofs"></div>
    <button type="button" class="btn" data-act="addproof" style="justify-self:start">＋ 再加一套证明</button>
    <div class="acts"><button type="button" class="btn" data-act="edpreview">预览</button><button type="button" class="btn" data-act="edcheck">检查顺序</button></div>
    <div id="ed-out"></div>
    <label class="small" for="ed-sum">变更摘要（必填，会记入版本历史）</label><input class="field" id="ed-sum" placeholder="例如：补全了第二种情形的证明">
    <div class="acts"><button type="submit" class="btn primary">提交审核</button>${n ? '<button type="button" class="btn" data-act="eddelete">删除这个节点</button>' : ''}</div>
  </form></div>`;
}
function depsUI(key, list) {
  return `<div class="links" style="margin-bottom:6px">${list.map((d, i) => `<span class="link">${esc(N[d] ? N[d].title : EXTCAT[d] ? `《${EXTCAT[d][2]}》${EXTCAT[d][0]}` : titleOf(d))}<button type="button" class="ic" style="width:20px;height:20px" data-act="deprm" data-k="${key}" data-i="${i}" aria-label="移除">${ICON.x}</button></span>`).join('') || '<span class="none">无</span>'}</div><input class="field" list="node-list" data-depadd="${key}" placeholder="输入标题搜索，选中后回车添加">`;
}
function getList(key) { if (key === 'deps') return ED.deps; if (key === 'attach') return ED.attach || (ED.attach = []); const i = +key.split(':')[1]; return proofsArr()[i].deps; }
const proofsArr = () => ED.sols || ED.proofs || (ED.proofs = []);
function readForm() {
  const v = id => { const el = $(id); return el ? el.value : ''; };
  ED.type = v('#ed-type'); ED.imp = +v('#ed-imp'); ED.title = v('#ed-title').trim();
  ED.alias = v('#ed-alias').split(/[,，、]/).map(s => s.trim()).filter(Boolean); ED.body = v('#ed-body');
  document.querySelectorAll('[data-variant]').forEach(el => { const v = ED.variants[+el.dataset.variant]; v.name = el.querySelector('[name=vname]').value; v.body = el.querySelector('[name=vbody]').value; });
  document.querySelectorAll('[data-proof]').forEach(el => { const i = +el.dataset.proof, p = proofsArr()[i]; p.name = el.querySelector('[name=pname]').value; p.body = el.querySelector('[name=pbody]').value; });
  const q = ED.type === 'example' || ED.type === 'exercise';
  if (q && ED.proofs) { ED.sols = ED.proofs; delete ED.proofs; }
  if (!q && ED.sols) { ED.proofs = ED.sols; delete ED.sols; }
}
function drawEditorParts() {
  if (!ED || !$('#ed-form')) return;
  document.querySelectorAll('#ed-form .deps').forEach(el => { el.innerHTML = depsUI(el.dataset.k, getList(el.dataset.k)); });
  const q = ED.type === 'example' || ED.type === 'exercise';
  $('#ed-attach-wrap').hidden = !q;
  const word = q ? '解答' : '证明';
  $('#ed-variants').innerHTML = (ED.variants || []).map((v, i) => `<div class="pbox" data-variant="${i}" style="margin-top:10px;display:grid;gap:6px"><div style="display:flex;gap:8px;align-items:center"><strong>等价说法${CN[i] || i + 1}</strong><input class="field" name="vname" value="${esc(v.name)}" placeholder="名称，如：用确界刻画" style="flex:1"><button type="button" class="ic" data-act="rmvariant" data-i="${i}" aria-label="删除这种说法">${ICON.x}</button></div><textarea name="vbody" class="srcbox" id="ed-v${i}" style="min-height:90px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px" placeholder="与上面的正文等价的另一种叙述。两者等价的证明请写成一套「证明」。">${esc(v.body)}</textarea>${TYP ? `<div class="live" data-live-for="ed-v${i}"></div>` : ''}</div>`).join('');
  setTimeout(() => { if (TYP) document.querySelectorAll('#ed-variants .srcbox, #ed-proofs .srcbox').forEach(livePreview); }, 0);
  $('#ed-proofs').innerHTML = proofsArr().map((p, i) => `<div class="pbox" data-proof="${i}" style="margin-top:10px;display:grid;gap:6px"><div style="display:flex;gap:8px;align-items:center"><strong>${word}${CN[i] || i + 1}</strong><input class="field" name="pname" value="${esc(p.name)}" placeholder="名称，如：反证法" style="flex:1"><button type="button" class="ic" data-act="rmproof" data-i="${i}" aria-label="删除这套${word}">${ICON.x}</button></div><label class="small">这套${word}用到的节点</label><div class="deps" data-k="p:${i}">${depsUI(`p:${i}`, p.deps)}</div><textarea name="pbody" class="srcbox" id="ed-p${i}" style="min-height:120px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px">${esc(p.body)}</textarea>${TYP ? `<div class="live" data-live-for="ed-p${i}"></div>` : ''}</div>`).join('');
}
function initEdit() { drawEditorParts(); if (TYP) document.querySelectorAll('#ed-form .srcbox').forEach(livePreview); }
function edPayload() {
  readForm();
  const r = cur(), id = r.id || ($('#ed-id') ? $('#ed-id').value.trim() : '');
  return { target: id, payload: r.id ? { data: ED } : { data: ED, bubble: $('#ed-bub').value } };
}
async function edCheck() {
  const p = edPayload();
  try { const r = await api('POST', `/api/check/${SLUG}`, { kind: 'node', target: p.target, payload: p.payload }); $('#ed-out').innerHTML = r.ok ? '<div class="legal">通过顺序检查，可以提交。</div>' : problemsHTML(r.problems); }
  catch (e) { $('#ed-out').innerHTML = problemsHTML(e.problems || [e.message]); }
}
async function edPreview() {
  readForm();
  if (TYP) {
    const out = $('#ed-out'); out.innerHTML = '<p class="none">正在编译……</p>';
    const fields = [ED, ...(ED.variants || []), ...proofsArr()];
    try {
      const rs = await Promise.all(fields.map(f => api('POST', '/api/render', { src: f.body || '' })));
      const n = JSON.parse(JSON.stringify(ED)), nf = [n, ...(n.variants || []), ...(n.sols || n.proofs || [])];
      nf.forEach((f, i) => { f.body = rs[i].html; });
      const errs = rs.flatMap(r => r.errors);
      clearMath(out); out.innerHTML = (errs.length ? srcErrorsHTML(errs) : '') + `<div class="sec-label">预览</div>${nodePreviewHTML(n)}`; typeset(out);
    } catch (e) { out.innerHTML = problemsHTML(e.problems || [e.message]); }
    return;
  }
  const lite = s => toHtmlLite(s);
  const n = { ...ED, body: lite(ED.body) };
  if (n.proofs) n.proofs = n.proofs.map(p => ({ ...p, body: lite(p.body) }));
  if (n.sols) n.sols = n.sols.map(p => ({ ...p, body: lite(p.body) }));
  if (n.variants) n.variants = n.variants.map(v => ({ ...v, body: lite(v.body) }));
  const out = $('#ed-out'); clearMath(out); out.innerHTML = `<div class="sec-label">预览</div>${nodePreviewHTML(n)}`; typeset(out);
}
async function edSubmit(del) {
  const p = edPayload(), summary = $('#ed-sum').value.trim();
  if (!summary) { toast('请写变更摘要'); $('#ed-sum').focus(); return; }
  if (del) p.payload = { data: null };
  try {
    await api('POST', '/api/submissions', { course: SLUG, kind: 'node', target: p.target, payload: p.payload, summary });
    toast('已提交，等审核者放行'); go({ v: 'me' });
  } catch (e) { $('#ed-out').innerHTML = problemsHTML(e.problems || [e.message]); $('#ed-out').scrollIntoView({ block: 'center' }); }
}

/* 结构编辑：调整泡泡里的顺序、移动节点、改名、有序与无序 */
let TB = null, TSEL = null;
function viewTree() {
  if (!isEditor()) return '<div class="empty-box"><p>只有这门课的编辑可以调整结构。</p></div>';
  TB = TB || JSON.parse(JSON.stringify(B)); TSEL = TSEL || 'b1';
  return `<div class="notes"><div class="crumbs"><span class="arrows"><button data-act="hback" aria-label="返回">${ICON.left}</button></span><span>调整结构</span></div><h1 class="h1">调整结构</h1>
  <p class="muted" style="margin:6px 0 14px">先选一个泡泡，再调整它里面的顺序，或把节点移到别的泡泡。改完检查顺序，再提交审核。</p>
  <label class="small" for="tb-sel">泡泡</label><select id="tb-sel">${treeOptions(TSEL)}</select><div id="tb-box" style="margin-top:12px">${treeBox()}</div>
  <div id="tb-out"></div><label class="small" for="tb-sum">变更摘要（必填）</label><input class="field" id="tb-sum">
  <div class="acts"><button class="btn" data-act="tbcheck">检查顺序</button><button class="btn primary" data-act="tbsubmit">提交审核</button><button class="btn ghost" data-act="tbreset">放弃改动</button></div></div>`;
}
function treeOptions(sel) {
  const out = [];
  (function w(b, d) { for (const k of TB[b].kids) if (TB[k]) { out.push(`<option value="${k}" ${k === sel ? 'selected' : ''}>${'　'.repeat(d)}${esc(TB[k].title ? (TB[k].tag ? TB[k].tag + ' ' : '') + TB[k].title : '（分组）')}</option>`); w(k, d + 1); } })('root', 0);
  return out.join('');
}
function treeBox() {
  const b = TB[TSEL];
  const name = k => TB[k] ? `泡泡：${esc(TB[k].title || '（分组）')}` : N[k] ? esc(N[k].title) : esc(k);
  return `<div class="stmt" style="display:grid;gap:8px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="field" id="tb-title" value="${esc(b.title || '')}" placeholder="泡泡名称" style="flex:1;min-width:160px"><label class="small"><input type="checkbox" id="tb-ord" ${b.ordered ? 'checked' : ''}> 有序</label></div>
  <input class="field" id="tb-desc" value="${esc(b.desc || '')}" placeholder="简介">
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="small" for="tb-green" style="margin:0">掌握多少算「变绿」</label><input class="field" id="tb-green" type="number" min="50" max="100" step="5" value="${b.green ? Math.round(b.green * 100) : ''}" placeholder="${Math.round(tbGreenInherited(TSEL) * 100)}" style="width:90px"><span class="small">%（按重要性加权；留空表示沿用上一级，现在是 ${Math.round(tbGreenInherited(TSEL) * 100)}%）</span></div>
  <ol class="hlist">${b.kids.map((k, i) => `<li class="hitem"><div class="hitem-top"><span class="hnum">${i + 1}</span><span class="htitle">${name(k)}</span><div class="hctl"><button class="ic" data-act="tbmove" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'} aria-label="上移">${ICON.up}</button><button class="ic" data-act="tbmove" data-i="${i}" data-d="1" ${i < b.kids.length - 1 ? '' : 'disabled'} aria-label="下移">${ICON.down}</button></div></div>${N[k] ? `<div class="hsub"><select data-tbto="${i}" aria-label="移到别的泡泡"><option value="">移到别的泡泡……</option>${treeOptions(null)}</select></div>` : ''}</li>`).join('')}</ol>
  <div class="acts" style="margin:0"><input class="field" id="tb-new" placeholder="新泡泡的名称" style="flex:1;min-width:160px"><button class="btn" data-act="tbadd">在这里新建子泡泡</button></div></div>`;
}
function tbGreenInherited(bid) { let p = null; for (const [k, v] of Object.entries(TB)) if (v.kids.includes(bid)) p = k; while (p) { if (TB[p].green) return TB[p].green; let q = null; for (const [k, v] of Object.entries(TB)) if (v.kids.includes(p)) q = k; p = q; } return 0.8; }
function tbRead() { const b = TB[TSEL]; const t = $('#tb-title'); if (!t) return; if (b.title !== null) b.title = t.value.trim() || b.title; b.ordered = $('#tb-ord').checked; const d = $('#tb-desc').value.trim(); if (d) b.desc = d; else delete b.desc;
  const g = $('#tb-green').value.trim(); if (g) b.green = Math.max(50, Math.min(100, +g)) / 100; else delete b.green; }
function tbRedraw() { $('#tb-box').innerHTML = treeBox(); $('#tb-sel').innerHTML = treeOptions(TSEL); }
async function tbSend(submit) {
  tbRead();
  const summary = $('#tb-sum').value.trim();
  try {
    if (submit) {
      if (!summary) { toast('请写变更摘要'); return; }
      await api('POST', '/api/submissions', { course: SLUG, kind: 'tree', payload: { B: TB }, summary });
      TB = null; toast('已提交，等审核者放行'); go({ v: 'me' });
    } else {
      const r = await api('POST', `/api/check/${SLUG}`, { kind: 'tree', payload: { B: TB } });
      $('#tb-out').innerHTML = r.ok ? '<div class="legal">通过顺序检查，可以提交。</div>' : problemsHTML(r.problems);
    }
  } catch (e) { $('#tb-out').innerHTML = problemsHTML(e.problems || [e.message]); }
}

/* ================= 路线 ================= */
function viewRoutesOnline() {
  return '<h1 class="h1">讲义推荐</h1><p class="muted" style="margin:6px 0 18px">别人整理好的学习路线，可以一键复制到「我的讲义」再改。公开路线都经过审核；认证老师的路线带「老师」标识。</p><div id="rt-feat" class="routes"><p class="none">载入中……</p></div>' +
    (ME.user ? sec('我的路线', '<div id="rt-mine" class="routes"></div><details class="fb"><summary>把当前的「我的讲义」保存为新路线</summary><form class="fb-form" data-form="saveroute"><input class="field" name="title" placeholder="路线名称"><textarea name="descr" placeholder="简介：适合谁、讲多久"></textarea><label class="small"><input type="checkbox" name="feat"> 希望进入推荐列表（审核者决定）</label><button class="btn primary" type="submit" style="justify-self:start">保存（只有自己可见）</button></form></details>')
      : '<p class="small" style="margin-top:18px">保存和分享路线需要账号，目前只对受邀用户开放。你可以在「我的讲义」页导出进度文件做备份。</p>');
}
let FEAT = [], MINE = [];
const RSTAT = { private: '只有自己可见', pending: '审核中', shared: '已分享', rejected: '未通过' };
async function loadRoutes() {
  try {
    FEAT = (await api('GET', `/api/routes/featured?course=${SLUG}`)).items;
    const f = $('#rt-feat');
    if (f) f.innerHTML = FEAT.length ? FEAT.map((r, i) => routeCard(r, i, 'feat')).join('') : '<p class="none">还没有推荐路线。</p>';
    if (ME.user) {
      MINE = (await api('GET', '/api/routes/mine')).items.filter(r => r.course === SLUG);
      const m = $('#rt-mine');
      if (m) m.innerHTML = MINE.length ? MINE.map((r, i) => routeCard(r, i, 'mine')).join('') : '<p class="none">还没有保存过路线。</p>';
    }
  } catch (e) { fail(e); }
}
function routeCard(r, i, kind) {
  const items = r.items.filter(x => N[x.id]);
  let h = `<article class="route"><div class="route-h"><h2 class="h3">${esc(r.title)}</h2>`;
  if (kind === 'feat') h += `<span class="small">${esc(r.author)}</span>${r.teacher ? '<span class="teacher">老师</span>' : ''}`;
  else h += `<span class="chip t-ex">${RSTAT[r.status]}</span>`;
  h += `</div>${r.descr ? `<p>${esc(r.descr)}</p>` : ''}<div class="links">${items.filter(x => !x.ref).slice(0, 12).map(x => linkBtn(x.id)).join('')}${items.length > 12 ? `<span class="small">等 ${items.length} 个</span>` : ''}</div>`;
  if (kind === 'mine' && r.reviewNote && r.status !== 'shared') h += `<p class="small">审核意见：${esc(r.reviewNote)}</p>`;
  h += `<div class="acts"><button class="btn primary" data-act="rtcopy" data-k="${kind}" data-i="${i}">复制到我的讲义</button>`;
  if (kind === 'mine') {
    if (r.share) h += `<button class="btn" data-act="rtlink" data-u="${esc(location.origin + r.share)}">复制分享链接</button>`;
    if (r.status === 'private' || r.status === 'rejected') h += `<button class="btn" data-act="rtshare" data-id="${r.id}">申请分享</button>`;
    h += `<button class="btn" data-act="rtupdate" data-id="${r.id}">用当前讲义覆盖</button><button class="btn ghost" data-act="rtdel" data-id="${r.id}">删除</button>`;
  }
  return h + '</div></article>';
}
function routeItemsFromHand() { return [...S.hand.map(x => ({ ...handItem(x), note: x.note || undefined })), ...S.refs.map(id => ({ id, p: 0, ref: true }))]; }
function copyRoute(r) {
  const items = r.items.filter(x => N[x.id]);
  let n = 0;
  for (const x of items) {
    if (x.ref) { if (!inHand(x.id) && !S.refs.includes(x.id)) { S.refs.push(x.id); n++; } continue; }
    if (!inHand(x.id)) { S.hand.push(handItem({ ...x, p: Number.isInteger(x.p) ? x.p : defaultIdx(x.id) })); S.refs = S.refs.filter(y => y !== x.id); n++; }
  }
  S.gaps = null; save(); soft(); toast(`已复制到我的讲义，新增 ${n} 个节点`);
}
async function loadShared(token) {
  const v = $('#view');
  try {
    const r = await api('GET', `/api/r/${token}`);
    if (r.course && r.course !== SLUG) { location.replace(`${courseBase(r.course)}/r/${token}`); return; }
    window._shared = r;
    v.innerHTML = `<div class="notes"><p class="small" style="margin:0">分享的路线 · ${esc(courseTitle(r.course))}</p><h1 class="h1">${esc(r.title)}</h1><p class="muted" style="margin:6px 0 14px">${esc(r.author)}${r.teacher ? ' <span class="teacher">老师</span>' : ''}${r.descr ? ' · ' + esc(r.descr) : ''}</p>` +
      `<ol class="hlist">${r.items.filter(x => N[x.id] && !x.ref).map((x, i) => `<li class="hitem">${x.note ? `<p class="transition" style="margin:0 0 8px">${esc(x.note)}</p>` : ''}<div class="hitem-top"><span class="hnum">${i + 1}</span><button class="htitle" data-act="node" data-id="${x.id}">${chip(x.id)}<span>${esc(N[x.id].title)}</span></button></div></li>`).join('')}</ol>` +
      '<div class="acts"><button class="btn primary" data-act="rtcopy" data-k="shared" data-i="0">复制到我的讲义</button></div></div>';
  } catch (e) { v.innerHTML = `<div class="empty-box"><p>${esc(e.message)}</p></div>`; }
}

/* ================= 讲义预览：下载 ================= */
window.previewBar = () => `<p class="note">下面是网页预览。下载的 PDF 由服务器用 ${TYP ? 'Typst' : 'LaTeX'} 排版，编号和交叉引用与这里一致。</p><div class="acts" style="margin:0 0 14px"><button class="btn primary" data-act="dlpdf">下载 PDF</button><button class="btn" data-act="dltex">下载 ${TYP ? '.typ' : '.tex'} 源文件</button>` + (ME.user ? '<button class="btn" data-act="go" data-v="routes">保存为路线</button>' : '') + '<span class="small" id="pdf-msg" style="align-self:center"></span></div>';
const notesBody = () => ({ hand: S.hand.map(x => ({ ...handItem(x), note: S.tpl === 'teacher' ? x.note || '' : '' })), refs: S.refs, tpl: S.tpl, title: '我的讲义' });
async function downloadPdf(btn) {
  const msg = $('#pdf-msg');
  btn.disabled = true;
  try {
    const j = await api('POST', `/api/pdf/${SLUG}`, notesBody());
    for (let i = 0; i < 180; i++) {
      const s = await api('GET', `/api/pdf/job/${j.id}`);
      if (s.status === 'done') { msg.textContent = '已生成'; location.href = `/api/pdf/file/${j.id}`; break; }
      if (s.status === 'error') { msg.textContent = `生成失败：${s.error}`; break; }
      msg.textContent = s.position > 1 ? `排队中，前面还有 ${s.position - 1} 份` : '正在排版……';
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (e) { msg.textContent = e.message; }
  btn.disabled = false;
}
async function downloadTex() {
  try {
    const r = await fetch(`/api/tex/${SLUG}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-mm': '1' }, body: JSON.stringify(notesBody()) });
    if (!r.ok) throw new Error((await r.json()).error);
    const url = URL.createObjectURL(await r.blob()), a = document.createElement('a');
    a.href = url; a.download = TYP ? '我的讲义.typ' : '我的讲义.tex'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) { toast(e.message); }
}

/* ================= 事件 ================= */
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  switch (a) {
    case 'avatar': go({ v: ME.user ? 'me' : 'login' }); break;
    case 'logintab': cur().tab = t.dataset.t; soft(); break;
    case 'exportstate': exportState(); break;
    case 'importstate': $('#imp-file').click(); break;
    case 'mkinvite': try { const r = await api('POST', '/api/admin/invites', { note: ($('#inv-note') || {}).value || '' }); showLink(`${location.origin}/invite/${r.token}`, '邀请链接（7 天内有效，只能用一次）'); } catch (er) { fail(er); } break;
    case 'mkreset': try { const r = await api('POST', '/api/admin/invites', { resetFor: +t.dataset.id }); showLink(`${location.origin}/invite/${r.token}`, `重设密码链接（2 天内有效）`); } catch (er) { fail(er); } break;
    case 'rminvite': try { await api('DELETE', `/api/admin/invites/${t.dataset.id}`); renderUsers(''); } catch (er) { fail(er); } break;
    case 'admphone': { const ph = prompt('手机号（留空表示清除）', ''); if (ph === null) break; try { await api('POST', `/api/admin/users/${t.dataset.id}`, { phone: ph.trim() }); renderUsers(''); } catch (er) { fail(er); } break; }
    case 'copylink': try { await navigator.clipboard.writeText(t.dataset.u); toast('已复制'); } catch (er) { toast('复制失败，请手动选中复制'); } break;
    case 'logout': await api('POST', '/api/auth/logout').catch(() => { }); ME.user = null; toast('已退出登录'); go({ v: 'home' }); break;
    case 'revtab': cur().tab = t.dataset.t; soft(); break;
    case 'opensub': go({ v: 'sub', id: +t.dataset.id }); break;
    case 'editnode': go({ v: 'edit', id: t.dataset.id }); break;
    case 'newnode': go({ v: 'edit', bubble: t.dataset.b }); break;
    case 'deprm': { readForm(); getList(t.dataset.k).splice(+t.dataset.i, 1); drawEditorParts(); break; }
    case 'addvariant': readForm(); (ED.variants || (ED.variants = [])).push({ name: '', body: '' }); drawEditorParts(); break;
    case 'rmvariant': readForm(); ED.variants.splice(+t.dataset.i, 1); drawEditorParts(); break;
    case 'addproof': readForm(); proofsArr().push({ name: '', deps: [], body: '' }); drawEditorParts(); break;
    case 'rmproof': readForm(); proofsArr().splice(+t.dataset.i, 1); drawEditorParts(); break;
    case 'edpreview': edPreview(); break;
    case 'edcheck': edCheck(); break;
    case 'eddelete': edSubmit(true); break;
    case 'tbmove': { tbRead(); const k = TB[TSEL].kids, i = +t.dataset.i, j = i + +t.dataset.d; [k[i], k[j]] = [k[j], k[i]]; tbRedraw(); break; }
    case 'tbadd': { tbRead(); const name = $('#tb-new').value.trim(); if (!name) { toast('请填新泡泡的名称'); break; } let id; do { id = 'bb' + Math.random().toString(36).slice(2, 7); } while (TB[id]); TB[id] = { title: name, ordered: true, kids: [] }; TB[TSEL].kids.push(id); tbRedraw(); break; }
    case 'tbcheck': tbSend(false); break;
    case 'tbsubmit': tbSend(true); break;
    case 'tbreset': TB = null; soft(); break;
    case 'rtcopy': { const k = t.dataset.k, i = +t.dataset.i; copyRoute(k === 'feat' ? FEAT[i] : k === 'mine' ? MINE[i] : window._shared); break; }
    case 'rtshare': try { await api('POST', `/api/routes/${t.dataset.id}/share`); toast('已申请分享，审核通过后会生成链接'); loadRoutes(); } catch (er) { fail(er); } break;
    case 'rtdel': if (t.dataset.arm) { try { await api('DELETE', `/api/routes/${t.dataset.id}`); loadRoutes(); } catch (er) { fail(er); } } else { t.dataset.arm = 1; t.textContent = '再点一次确认删除'; } break;
    case 'rtupdate': { const r = MINE.find(x => x.id === +t.dataset.id); if (!S.hand.length) { toast('「我的讲义」是空的'); break; } try { await api('POST', '/api/routes', { id: r.id, course: SLUG, title: r.title, descr: r.descr, items: routeItemsFromHand(), wantFeatured: r.wantFeatured }); toast(r.status === 'private' ? '已更新' : '已更新，需要重新审核；通过前分享链接仍显示旧版本'); loadRoutes(); } catch (er) { fail(er); } break; }
    case 'rtlink': { const u = t.dataset.u; try { await navigator.clipboard.writeText(u); toast('分享链接已复制'); } catch (er) { toast(u); } break; }
    case 'dlpdf': downloadPdf(t); break;
    case 'dltex': downloadTex(); break;
    case 'admrole': try { await api('POST', `/api/admin/users/${t.dataset.id}`, { course: t.dataset.course || SLUG, role: t.dataset.role, grant: t.dataset.grant === '1' }); renderUsers(($('[name=q]') || {}).value || ''); } catch (er) { fail(er); } break;
    case 'admflag': try { await api('POST', `/api/admin/users/${t.dataset.id}`, { [t.dataset.k]: t.dataset.val === '1' }); renderUsers(($('[name=q]') || {}).value || ''); } catch (er) { fail(er); } break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'tb-sel') { tbRead(); TSEL = t.value; tbRedraw(); }
  if (t.dataset && t.dataset.tbto !== undefined && t.value) { tbRead(); const i = +t.dataset.tbto, id = TB[TSEL].kids[i]; if (t.value === TSEL) return; TB[TSEL].kids.splice(i, 1); TB[t.value].kids.push(id); toast(`已移到「${TB[t.value].title || '分组'}」末尾`); tbRedraw(); }
  if (t.id === 'ed-type') { readForm(); drawEditorParts(); }
  if (t.dataset && t.dataset.admc) { const id = +t.dataset.admc, box = document.getElementById(`admr-${id}`); ADMSEL[id] = t.value; if (box && ADMU[id]) box.innerHTML = admRoleBtns(ADMU[id], t.value); }
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key === 'Enter' && t.dataset && t.dataset.depadd) {
    e.preventDefault();
    const m = /·\s*((?:[a-z0-9-]+:)?\w+)$/.exec(t.value), id = m ? m[1] : t.value.trim();
    if (!N[id] && !(isExt(id) && EXTCAT[id])) { toast('请从下拉列表里选一个节点'); return; }
    readForm(); const l = getList(t.dataset.depadd); if (!l.includes(id)) l.push(id); drawEditorParts();
    const again = document.querySelector(`[data-depadd="${t.dataset.depadd}"]`); if (again) again.focus();
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 'imp-file' && e.target.files[0]) { importState(e.target.files[0]); e.target.value = ''; }
});
document.addEventListener('submit', async e => {
  const f = e.target, data = Object.fromEntries(new FormData(f).entries()), btn = e.submitter;
  if (f.id === 'lg-form') { e.preventDefault(); return submitLogin(f); }
  if (f.id === 'ed-form') { e.preventDefault(); return edSubmit(false); }
  if (f.id === 'iv-form') { e.preventDefault(); return submitInvite(f); }
  if (f.id === 'pw-form') {
    e.preventDefault();
    try { await api('POST', '/api/me/password', { old: $('#pw-old').value, password: $('#pw-new').value }); f.reset(); $('#pw-msg').textContent = '已修改'; }
    catch (er) { $('#pw-msg').textContent = er.message; }
    return;
  }
  if (f.classList.contains('fb-form') && f.dataset.node) {
    e.preventDefault();
    const sb = f.querySelector('[type=submit]'); if (sb) sb.disabled = true;
    try { await api('POST', `/api/feedback/${SLUG}/${f.dataset.node}`, { kind: $('#fbt').value, text: $('#fbx').value, pow: ME.user ? undefined : await solvePow() }); f.reset(); f.closest('details').open = false; toast('已提交给审核者，处理结果会公开显示在这个节点下面'); } catch (er) { fail(er); }
    if (sb) sb.disabled = false;
    return;
  }
  const kind = f.dataset.form; if (!kind) return;
  e.preventDefault();
  try {
    if (kind === 'app') { await api('POST', '/api/applications', { kind: f.dataset.kind, course: data.course, material: data.material }); toast('已提交申请'); f.reset(); f.closest('details').open = false; loadMine(); }
    if (kind === 'resolve') { await api('POST', `/api/feedback/${f.dataset.id}/resolve`, { resolution: data.resolution }); toast('已处理'); loadReview(cur()); }
    if (kind === 'route') { await api('POST', `/api/routes/${f.dataset.id}/decide`, { approve: btn.dataset.approve === '1', featured: !!data.featured, note: data.note }); toast(btn.dataset.approve === '1' ? '已通过' : '已退回'); loadReview(cur()); }
    if (kind === 'app-decide') { await api('POST', `/api/applications/${f.dataset.id}/decide`, { approve: btn.dataset.approve === '1', note: data.note }); toast('已处理'); loadReview(cur()); }
    if (kind === 'usersearch') renderUsers(data.q || '');
    if (kind === 'decide') {
      const r = await api('POST', `/api/submissions/${f.dataset.id}/decide`, { approve: btn.dataset.approve === '1', score: +data.score, note: data.note });
      toast(r.status === 'approved' ? `已发布为第 ${r.version} 版${r.warning ? '。' + r.warning : ''}` : '已退回');
      setTimeout(() => { location.href = BASE + '/review'; }, r.status === 'approved' ? 1200 : 300);
    }
    if (kind === 'rollback') { const r = await api('POST', '/api/rollback', { course: SLUG, target: f.dataset.id, version: +f.dataset.v, reason: data.reason }); toast(`已回滚，生成第 ${r.version} 版`); setTimeout(() => location.reload(), 1000); }
    if (kind === 'saveroute') {
      if (!S.hand.length) { toast('「我的讲义」是空的，先加几个节点'); return; }
      await api('POST', '/api/routes', { course: SLUG, title: data.title, descr: data.descr, items: routeItemsFromHand(), wantFeatured: !!data.feat });
      toast('已保存。想分享给别人，点「申请分享」'); loadRoutes(); f.reset(); f.closest('details').open = false;
    }
  } catch (er) {
    if (kind === 'decide' && er.problems) { const m = $('#dec-msg'); if (m) m.innerHTML = problemsHTML(er.problems); }
    fail(er);
  }
});

/* ================= 启动 ================= */
(async function boot() {
  /* 两个请求同时发，少等一个来回 */
  await Promise.all([
    api('GET', '/api/courses').then(r => { CATS = r.cats; }, () => { CATS = [{ name: '逻辑与基础', courses: [{ id: SLUG, title: window.COURSE.title, desc: '', live: true }] }]; }),
    loadMe()
  ]);
  bindSearch($('#sq'));
  const r = routeOfPath();
  H.list = [r]; H.i = 0;
  history.replaceState({ i: 0 }, '', pathOfRoute(r));
  show(false);
})();
