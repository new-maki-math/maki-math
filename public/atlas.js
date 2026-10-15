/* 学习地图：把整门课画成一张可以拖动、缩放的地图。
   每章是一处地标，章与章之间有路；学过的地方迷雾散开；「你在这里」跟着当前浏览的位置走。
   设计参考了朋友做的预览版（maki-learning-atlas），代码为本站重写。 */
(function () {
  'use strict';
  const MW = 1100, MH = 820;                 // 地图世界坐标
  const KEY = CK('mm_atlas');
  const ST = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.ch) && Array.isArray(s.sec)) return s; } catch (e) { } return { ch: [], sec: [], fog: true }; })();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } };

  /* ---------- 数据：章、节、坐标 ---------- */
  const xs = Object.values(CH_POS).map(p => p[0]), ys = Object.values(CH_POS).map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const CHS = CHAPS.map(id => {
    const p = CH_POS[id] || [x0, y0];
    return { id, tag: B[id].tag, title: B[id].title, desc: B[id].desc || '', secs: sectionsOf(id),
      x: Math.round(150 + (p[0] - x0) / Math.max(1, x1 - x0) * 780), y: Math.round(95 + (p[1] - y0) / Math.max(1, y1 - y0) * 620) };
  });
  const chById = id => CHS.find(c => c.id === id);
  const prog = id => { const s = stats(id); return { n: s.mastered, total: s.total, pct: s.pct, green: s.green }; };
  const known = id => ST.ch.includes(id) || prog(id).n > 0;
  /* 节在章地标周围排成一圈 */
  const secPoint = (c, sid) => { const i = Math.max(0, c.secs.indexOf(sid)), k = Math.max(1, c.secs.length), a = -Math.PI / 2 + i * 2 * Math.PI / k, rr = 40 + Math.max(0, k - 8) * 2.5; return [c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr]; };

  /* ---------- 当前位置 ---------- */
  let here = { ch: CHS[0] && CHS[0].id, sec: null, label: '' };
  function locate() {
    const r = typeof H !== 'undefined' && H.list.length ? cur() : null;
    if (!r) return false;
    let ch = null, sec = null, label = '';
    if (r.v === 'node' && N[r.id]) { sec = nparent[r.id]; ch = chapterOf(sec); label = N[r.id].title; }
    else if (r.v === 'kb' && r.b && B[r.b] && r.b !== 'root') { ch = chapterOf(r.b) || r.b; sec = B[r.b].tag ? null : r.b; label = B[r.b].title; }
    if (!ch || !chById(ch)) return false;
    const secs = chById(ch).secs;
    while (sec && !secs.includes(sec)) sec = bparent[sec];   // 更深的层级：归到所在的那一讲
    here = { ch, sec: sec && secs.includes(sec) ? sec : null, label };
    if (!ST.ch.includes(ch)) ST.ch.push(ch);
    if (here.sec && !ST.sec.includes(here.sec)) ST.sec.push(here.sec);
    persist();
    return true;
  }

  /* ---------- 画图 ---------- */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function terrain() {
    seed = 7;
    let h = '<path class="at-river-bank" d="M-30 450 C160 360 270 430 420 480 S640 590 780 525 S1010 565 1150 700"/><path class="at-river" d="M-30 450 C160 360 270 430 420 480 S640 590 780 525 S1010 565 1150 700"/>' +
      '<text class="at-river-name" x="610" y="598" transform="rotate(7 610 598)">知识之河</text>';
    for (const c of CHS) {
      let g = '';
      for (let i = -4; i <= 4; i++) { const a = i * 18; g += `<path d="M${a} -80 L${(a + (rnd() - .5) * 20).toFixed(1)} 82 M-82 ${a} L82 ${(a + (rnd() - .5) * 14).toFixed(1)}"/>`; }
      for (let i = 0; i < 16; i++) g += `<rect x="${((rnd() - .5) * 150).toFixed(1)}" y="${((rnd() - .5) * 140).toFixed(1)}" width="${(4 + rnd() * 7).toFixed(1)}" height="${(4 + rnd() * 8).toFixed(1)}" rx="1"/>`;
      h += `<g class="at-block" transform="translate(${c.x} ${c.y}) rotate(${Math.round(rnd() * 50 - 25)})">${g}<circle r="92" class="at-ring"/></g>`;
    }
    return h;
  }
  const TERRAIN = terrain();
  function roads() {
    return CH_EDGES.map(([a, b]) => {
      const f = chById(a), t = chById(b); if (!f || !t) return '';
      const d = `M${f.x} ${f.y} Q${(f.x + t.x) / 2 + 26} ${(f.y + t.y) / 2 - 18} ${t.x} ${t.y}`;
      return `<path class="at-road-bg" d="${d}"/><path class="at-road ${known(a) && known(b) ? 'walked' : ''}" d="${d}"/>`;
    }).join('');
  }
  function svg(mini, uid, view) {
    const fog = ST.fog && !mini ? true : ST.fog;
    const holes = CHS.filter(c => known(c.id)).map(c => `<ellipse cx="${c.x}" cy="${c.y}" rx="155" ry="140" fill="url(#${uid}-hole)"/>`).join('');
    const near = new Set(CH_EDGES.filter(([a]) => known(a)).map(e => e[1]));
    const edge = CHS.filter(c => near.has(c.id) && !known(c.id)).map(c => `<circle cx="${c.x}" cy="${c.y}" r="95" fill="url(#${uid}-edge)"/>`).join('');
    const zoom = view.zoom || 1;
    const marks = CHS.map(c => {
      const p = prog(c.id), k = known(c.id), sel = !mini && c.id === Atlas.sel;
      const col = p.green ? 'var(--at-green)' : k ? 'var(--at-ink)' : 'var(--at-muted)';
      const dots = k ? c.secs.map(sid => {
        const [x, y] = secPoint(c, sid), s = stats(sid);
        const fill = s.green ? 'var(--at-green)' : s.mastered ? 'var(--at-blue)' : ST.sec.includes(sid) ? 'var(--at-trail)' : 'var(--at-road)';
        const lab = !mini && (view.ppu || zoom) >= 1.5 ? `<text class="at-sec-label" x="${x + 6}" y="${y + 3}">${esc(B[sid].title)}</text>` : '';
        return `<g class="at-sec" ${mini ? '' : `data-at-sec="${sid}"`}><circle cx="${x}" cy="${y}" r="${mini ? 4 : 3.4}" fill="${fill}"/>${lab}</g>`;
      }).join('') : '';
      const ring = p.total ? `<circle cx="${c.x}" cy="${c.y}" r="13" fill="none" stroke="var(--at-green)" stroke-width="2.5" stroke-dasharray="${(p.pct * 81.7).toFixed(1)} 82" transform="rotate(-90 ${c.x} ${c.y})" opacity="${p.pct ? .9 : 0}"/>` : '';
      return `<g class="at-mark" ${mini ? '' : `data-at-ch="${c.id}" role="button" tabindex="0" aria-label="${esc(c.tag + ' ' + c.title)}"`} opacity="${k ? 1 : .62}">` +
        (mini ? '' : `<rect x="${c.x - 30}" y="${c.y - 34}" width="190" height="72" fill="transparent"/>`) +
        (sel ? `<circle cx="${c.x}" cy="${c.y}" r="26" fill="none" stroke="var(--at-trail)" stroke-width="1.5"/>` : '') +
        dots + ring + `<circle cx="${c.x}" cy="${c.y}" r="${mini ? 10 : 8}" fill="${k ? col : 'var(--at-paper)'}" stroke="${col}" stroke-width="2"/>` +
        `<text class="at-tag" x="${c.x + 18}" y="${c.y - 4}">${esc(c.tag)}</text><text class="at-label" x="${c.x + 18}" y="${c.y + 15}">${esc(c.title)}</text>` +
        (!k && !mini ? `<text class="at-unk" x="${c.x + 18}" y="${c.y + 32}">未探索</text>` : '') + '</g>';
    }).join('');
    const hc = chById(here.ch);
    const [px, py] = here.sec ? secPoint(hc, here.sec) : [hc.x, hc.y];
    const you = `<g class="at-you" transform="translate(${px} ${py})"><circle class="at-pulse" r="17"/><circle r="${mini ? 8 : 5.5}" class="at-dot"/><text x="-10" y="-12" text-anchor="end">你在这里</text></g>`;
    const box = mini ? `${hc.x - 180} ${hc.y - 125} 380 270` : `${view.x - MW / 2 / zoom} ${view.y - MH / 2 / zoom} ${MW / zoom} ${MH / zoom}`;
    return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" ${mini ? 'aria-hidden="true"' : 'role="group" aria-label="课程地图"'}>` +
      `<defs><radialGradient id="${uid}-hole"><stop offset="60%" stop-color="black"/><stop offset="100%" stop-color="white"/></radialGradient>` +
      `<radialGradient id="${uid}-edge"><stop offset="0%" stop-color="#999"/><stop offset="100%" stop-color="white"/></radialGradient>` +
      `<radialGradient id="${uid}-cloud"><stop stop-color="var(--at-cloud)" stop-opacity=".8"/><stop offset="100%" stop-color="var(--at-paper)" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${uid}-vig"><stop offset="40%" stop-color="white"/><stop offset="98%" stop-color="black"/></radialGradient>` +
      `<mask id="${uid}-fog"><rect x="-1200" y="-1200" width="3500" height="3200" fill="white"/>${edge}${holes}</mask>` +
      (mini ? `<mask id="${uid}-v"><rect x="${hc.x - 180}" y="${hc.y - 125}" width="380" height="270" fill="url(#${uid}-vig)"/></mask>` : '') + '</defs>' +
      `<g ${mini ? `mask="url(#${uid}-v)"` : ''}><g class="at-terrain">${TERRAIN}${roads()}</g>` +
      (fog ? `<g mask="url(#${uid}-fog)" class="at-fog"><rect x="-1200" y="-1200" width="3500" height="3200" class="at-fog-fill"/>` +
        `<g class="at-clouds"><ellipse cx="560" cy="260" rx="290" ry="140" fill="url(#${uid}-cloud)"/><ellipse cx="800" cy="560" rx="330" ry="160" fill="url(#${uid}-cloud)"/><ellipse cx="220" cy="660" rx="280" ry="150" fill="url(#${uid}-cloud)"/></g></g>` : '') +
      marks + you + '</g></svg>';
  }

  /* ---------- 小地图（电脑右栏）和地图按钮（窄屏） ---------- */
  const Atlas = window.Atlas = { sel: null, view: { x: MW / 2, y: MH / 2, zoom: 1 } };
  const ambient = document.createElement('button');
  ambient.className = 'at-ambient'; ambient.type = 'button'; ambient.setAttribute('aria-label', '展开学习地图');
  ambient.innerHTML = '<div class="at-mini"></div><span class="at-cap"><span class="at-cap-t"></span><span aria-hidden="true">↗</span></span>';
  const fab = document.createElement('button');
  fab.className = 'at-fab'; fab.type = 'button'; fab.setAttribute('aria-label', '打开学习地图');
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg><span>地图</span>';
  document.body.appendChild(fab);
  const slot = document.getElementById('atlas-slot');
  if (slot) slot.appendChild(ambient);

  /* ---------- 全屏地图 ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'at-dialog';
  dlg.innerHTML = `<div class="at-top"><div><span class="at-eyebrow">学习地图</span><h2>${esc(B.root.title)}</h2></div><div class="at-actions"><button type="button" data-at="fog" aria-pressed="true">迷雾开启</button><button type="button" data-at="close" class="at-x" aria-label="关闭">×</button></div></div>` +
    '<div class="at-body"><div class="at-panel"><div class="at-note"><span class="at-explored"></span></div><div class="at-stage" tabindex="0" aria-label="地图：拖动平移，滚轮或加减号缩放"></div>' +
    '<div class="at-tools"><div class="at-legend"><span><i class="l-you"></i>你在这里</span><span><i class="l-green"></i>已掌握</span><span><i class="l-blue"></i>学习中</span><span><i class="l-gray"></i>未探索</span></div>' +
    '<div class="at-zoombar"><button type="button" data-at="center" title="回到当前位置" aria-label="回到当前位置">◎</button><button type="button" data-at="out" aria-label="缩小">−</button><span class="at-zv">100%</span><button type="button" data-at="in" aria-label="放大">＋</button></div></div></div>' +
    '<aside class="at-detail"></aside></div><div class="at-foot"><span class="at-live"></span><span class="at-hint">拖动探索 · 滚轮缩放 · 双指缩放</span></div>';
  document.body.appendChild(dlg);
  const stage = dlg.querySelector('.at-stage');

  function drawStage() { const r = stage.getBoundingClientRect(); Atlas.view.ppu = r.width ? Math.min(r.width / MW, r.height / MH) * Atlas.view.zoom : Atlas.view.zoom; stage.innerHTML = svg(false, 'atf', Atlas.view); dlg.querySelector('.at-zv').textContent = Math.round(Atlas.view.zoom * 100) + '%'; }
  function drawDetail() {
    const c = chById(Atlas.sel) || chById(here.ch), p = prog(c.id), k = known(c.id);
    const pre = CH_EDGES.filter(e => e[1] === c.id).map(e => chById(e[0])).filter(Boolean), nxt = CH_EDGES.filter(e => e[0] === c.id).map(e => chById(e[1])).filter(Boolean);
    const chip = x => `<button type="button" data-at="pick" data-ch="${x.id}">${esc(x.tag + ' ' + x.title)}</button>`;
    dlg.querySelector('.at-detail').innerHTML = `<label class="at-find">查找章节<select>${CHS.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.tag + ' ' + x.title)}</option>`).join('')}</select></label>` +
      `<div class="at-idx">${esc(c.tag)}</div><h3>${esc(c.title)}</h3><span class="at-status">${!p.total ? '待录入' : p.green ? '已掌握' : k ? '已探索 · 学习中' : '迷雾中的新领域'}</span>` +
      (c.desc ? `<p class="at-desc">${esc(c.desc)}</p>` : '') +
      (p.total ? `<div class="at-pl"><span>掌握进度</span><strong>${Math.round(p.pct * 100)}%</strong></div><div class="at-track"><i style="width:${(p.pct * 100).toFixed(1)}%"></i></div><p class="at-cnt">${p.n} / ${p.total} 个知识点</p>` : '') +
      `<div class="at-dep"><span>前置章节</span>${pre.length ? pre.map(chip).join('') : '<em>学习的起点</em>'}</div>` +
      (nxt.length ? `<div class="at-dep"><span>通往</span>${nxt.map(chip).join('')}</div>` : '') +
      `<div class="at-secs-h">这一章的小节 <span>${c.secs.length}</span></div><div class="at-secs">${c.secs.map((s, i) => { const st = stats(s); return `<button type="button" data-at="sec" data-sec="${s}" class="${s === here.sec ? 'here' : ''}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(B[s].title)}</span><span class="p ${st.green ? 'g' : ''}">${st.mastered}/${st.total}</span></button>`; }).join('')}</div>` +
      `<button type="button" class="at-go" data-at="go" data-ch="${c.id}">${k ? '前往这一章' : '探索这一章'} →</button>`;
  }
  function drawAll() {
    const c = chById(here.ch);
    const mini = ambient.querySelector('.at-mini'); if (mini) mini.innerHTML = svg(true, 'atm', Atlas.view);
    ambient.querySelector('.at-cap-t').textContent = c ? `${c.tag} · ${here.label || c.title}` : '';
    dlg.querySelector('.at-live').textContent = c ? `当前位置：${c.tag} / ${here.label || c.title}` : '';
    dlg.querySelector('.at-explored').textContent = `已探索 ${CHS.filter(x => known(x.id)).length} / ${CHS.length} 章`;
    if (dlg.open) { drawStage(); drawDetail(); }
  }
  Atlas.refresh = () => { locate(); drawAll(); };
  function open() {
    locate();
    Atlas.sel = here.ch;
    const c = chById(here.ch);
    Atlas.view = isMob() ? { x: c.x + 40, y: c.y + 40, zoom: 2.2 } : { x: c.x + 60, y: c.y + 120, zoom: 1 };
    drawAll(); dlg.showModal(); drawStage(); drawDetail(); stage.focus({ preventScroll: true });
  }
  const goTo = b => { dlg.close(); go({ v: 'kb', b }); };
  ambient.addEventListener('click', open);
  fab.addEventListener('click', open);

  /* ---------- 交互：点选、拖动、缩放 ---------- */
  let moved = false;
  dlg.addEventListener('click', e => {
    if (e.target === dlg) { dlg.close(); return; }
    const t = e.target.closest('[data-at],[data-at-ch],[data-at-sec]'); if (!t) return;
    if ((t.dataset.atCh || t.dataset.atSec) && moved) { moved = false; return; }
    if (t.dataset.atSec) { goTo(t.dataset.atSec); return; }
    if (t.dataset.atCh) { Atlas.sel = t.dataset.atCh; if (!ST.ch.includes(Atlas.sel)) { ST.ch.push(Atlas.sel); persist(); } drawStage(); drawDetail(); return; }
    switch (t.dataset.at) {
      case 'close': dlg.close(); break;
      case 'fog': ST.fog = !ST.fog; persist(); t.setAttribute('aria-pressed', String(ST.fog)); t.textContent = ST.fog ? '迷雾开启' : '全图预览'; drawAll(); break;
      case 'center': { const c = chById(here.ch); Atlas.sel = c.id; Atlas.view = { x: c.x, y: c.y, zoom: 1.7 }; drawStage(); drawDetail(); break; }
      case 'in': zoomAt(1.25); break;
      case 'out': zoomAt(1 / 1.25); break;
      case 'pick': { const c = chById(t.dataset.ch); Atlas.sel = c.id; Atlas.view = { x: c.x, y: c.y, zoom: Math.max(Atlas.view.zoom, 1.4) }; drawStage(); drawDetail(); break; }
      case 'sec': goTo(t.dataset.sec); break;
      case 'go': goTo(t.dataset.ch); break;
    }
  });
  dlg.addEventListener('change', e => { if (e.target.tagName === 'SELECT') { const c = chById(e.target.value); Atlas.sel = c.id; Atlas.view = { x: c.x, y: c.y, zoom: 1.6 }; drawStage(); drawDetail(); } });
  dlg.querySelector('[data-at="fog"]').setAttribute('aria-pressed', String(ST.fog));
  dlg.querySelector('[data-at="fog"]').textContent = ST.fog ? '迷雾开启' : '全图预览';

  const unit = () => { const r = stage.getBoundingClientRect(); return { r, k: Math.max(MW / r.width, MH / r.height) / Atlas.view.zoom }; };
  /* 以某个屏幕点为中心缩放 */
  function zoomAt(f, cx, cy) {
    const v = Atlas.view, nz = Math.max(.6, Math.min(4, v.zoom * f));
    if (cx != null) {
      const { r, k } = unit();
      const wx = v.x + (cx - r.left - r.width / 2) * k, wy = v.y + (cy - r.top - r.height / 2) * k;
      const k2 = k * v.zoom / nz;
      v.x = wx - (cx - r.left - r.width / 2) * k2; v.y = wy - (cy - r.top - r.height / 2) * k2;
    }
    v.zoom = nz; drawStage();
  }
  stage.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  const ptrs = new Map(); let drag = null, pinch = null;
  stage.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { drag = { x: e.clientX, y: e.clientY, vx: Atlas.view.x, vy: Atlas.view.y }; moved = false; }
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: Atlas.view.zoom }; drag = null; moved = true; }
  });
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(pinch.z * d / pinch.d / Atlas.view.zoom, (a.x + b.x) / 2, (a.y + b.y) / 2); return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) { moved = true; try { stage.setPointerCapture(e.pointerId); } catch (er) { } }
    const { k } = unit();
    Atlas.view.x = drag.vx - dx * k; Atlas.view.y = drag.vy - dy * k; drawStage();
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) drag = null; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, -60], ArrowDown: [0, 60] }[e.key];
    if (d) { Atlas.view.x += d[0] / Atlas.view.zoom; Atlas.view.y += d[1] / Atlas.view.zoom; drawStage(); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') { zoomAt(1.25); e.preventDefault(); }
    if (e.key === '-') { zoomAt(1 / 1.25); e.preventDefault(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-at-ch]')) { e.target.closest('[data-at-ch]').click(); e.preventDefault(); }
  });

  /* ---------- 跟着页面走 ---------- */
  const _show = show;
  show = function () { const r = _show.apply(this, arguments); Atlas.refresh(); return r; };
  const _save = save;
  save = function () { const r = _save.apply(this, arguments); drawAll(); return r; };
  Atlas.refresh();
})();
