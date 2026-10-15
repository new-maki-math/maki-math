'use strict';
/* 旧写法（HTML 或「空行分段」+ LaTeX 公式）→ 新写法（Markdown + Typst 公式）。
   用于把现有课程转过来，以及回滚到转换前的旧版本时临时转换。 */
const { parseDocument } = require('htmlparser2');
const { tex2typst } = require('tex2typst');

/* ---------- 公式：LaTeX → Typst ---------- */
const PRE = [
  [/\\(?:displaystyle|textstyle|scriptstyle|limits|nolimits)(?![A-Za-z])\s*/g, ' '],
  [/\\[,;:>]\s*/g, ' '], [/\\!\s*/g, ''],
  [/\\dfrac|\\tfrac/g, '\\frac'],
  [/\\\\\s*\[[^\]]*\]/g, '\\\\ '],
  [/\\dbinom|\\tbinom/g, '\\binom'],
  [/\{(d|r)cases\}/g, '{cases}'], [/\{gathered\}/g, '{aligned}'], [/\{(p|b|v|V|B)?smallmatrix\}/g, (m, x) => `{${x || ''}matrix}`],
  [/\\textbf\{/g, '\\text{'],
  [/\\left\.|\\right\./g, ''],
  [/\\lvert|\\rvert/g, '|'], [/\\lVert|\\rVert/g, '\\|'],
  [/\\(?:big|Big|bigg|Bigg)[lrm]?(?![A-Za-z])/g, ''],
  [/\\varnothing/g, '\\emptyset'],
  [/\\lnot|\\neg/g, '\\neg '],
[/\\colon(?![A-Za-z])/g, ':'],
  [/\\mathrm\{d\}/g, '\\mathrm{d}'],
  [/\\(?:hspace|vspace)\*?\{[^}]*\}/g, ' '],
  [/\\not\s*>/g, '\\ngtr '], [/\\not\s*</g, '\\nless '],
  [/\\underline\{(?:\s|~|\\q?quad|\\ )*\}/g, '\\text{＿＿＿}'],
  [/;/g, '\\text{@SEMI@}'],
  [/\\(?:qquad)/g, '\\qquad '],
];
/* tex2typst 输出后的修正 */
const POST = [
  [/\blnot\b/g, 'not'],
  [/ *"@SEMI@"/g, '\\;'],
  [/\*\//g, '(*)/'], [/\/\*/g, '/(*)'],
  [/\.long\.not\b/g, '.not'],
  [/tilde\.op\.not/g, 'tilde.not'],
  [/\bcircle\.small\b/g, 'compose'],
  [/\bperp\b/g, 'bot'],
  [/\b(compose|dot\.op|circle|star|dagger|ast|times|tilde\.op)\(/g, '$1 ('],   // 符号紧跟括号会被当成「加重音」
  [/\bmiddle\s*(\|\||\||\/)/g, (m, x) => ` mid(${x}) `],
  [/upright\(((?:[A-Za-z] )+[A-Za-z])\)/g, (m, x) => `upright("${x.replace(/ /g, '')}")`],
];
/* tex2typst 处理 \overset、\underset 时会丢掉参数的括号（\overset{a+b}{=} → limits(=)^a + b），
   \stackrel、\xrightarrow 也不认识：这些先换成占位符，参数单独转换后再拼回去 */
const STACK = /\\(overset|underset|stackrel|xrightarrow|xleftarrow|xlongequal)\s*/;
function grab(str, j, open, close) { let d = 1, k = j; while (k < str.length && d) { if (str[k] === open) d++; else if (str[k] === close) d--; k++; } return [str.slice(j, k - 1), k]; }
function stacks(t, store) {
  let m;
  while ((m = STACK.exec(t))) {
    const i = m.index, cmd = m[1];
    let j = i + m[0].length, opt = null, a = '', b = '';
    if (cmd.startsWith('x')) {
      if (t[j] === '[') { [opt, j] = grab(t, j + 1, '[', ']'); while (t[j] === ' ') j++; }
      if (t[j] === '{') [a, j] = grab(t, j + 1, '{', '}');
    } else {
      if (t[j] !== '{') { t = t.slice(0, i) + t.slice(j); continue; }
      [a, j] = grab(t, j + 1, '{', '}'); while (t[j] === ' ') j++;
      if (t[j] === '{') [b, j] = grab(t, j + 1, '{', '}'); else { b = t[j] || ''; j++; }
    }
    const T = x => x.trim() ? texToTypst(x) : '';
    const sub = x => x ? (/^[\w.]+$/.test(x) ? x : `(${x})`) : '';
    let out;
    if (cmd.startsWith('x')) {
      const up = T(a), dn = T(opt || '');
      out = `limits(${cmd === 'xrightarrow' ? '-->' : cmd === 'xleftarrow' ? '<--' : '='})${up ? '^' + sub(up) : ''}${dn ? '_' + sub(dn) : ''}`;
    } else {
      const base = T(b) || 'zws', lab = T(a);
      out = `limits(${base})${cmd === 'underset' ? '_' : '^'}${sub(lab)}`;
    }
    store.push(out);
    t = t.slice(0, i) + `\\text{@S${store.length - 1}@}` + t.slice(j);
  }
  return t;
}
/* 只有一边的伸缩括号：\left. … \right|（代入上下限）、\left\{ … \right. 等 → lr(…) */
const DELIM = { '|': '|', '\\vert': '|', '\\|': '||', '\\Vert': '||', ')': ')', ']': ']', '\\}': '}', '\\rbrace': '}', '(': '(', '[': '[', '\\{': '{', '\\lbrace': '{', '/': '/' };
const DRE = /^\s*(\\vert|\\Vert|\\\||\\\}|\\\{|\\rbrace|\\lbrace|[|)\]([\/.])/;
function oneSided(t, store) {
  for (let guard = 0; guard < 50; guard++) {
    const re = /\\left\s*(\\vert|\\Vert|\\\||\\\}|\\\{|\\lbrace|\\rbrace|[|)\]([\/.])/g;
    let m, hit = null;
    while ((m = re.exec(t))) {
      /* 找配对的 \right */
      let d = 1, k = re.lastIndex, end = -1, rd = null;
      const tok = /\\(left|right)(?![A-Za-z])/g; tok.lastIndex = k;
      let q;
      while ((q = tok.exec(t))) {
        if (q[1] === 'left') d++; else if (--d === 0) { const dm = DRE.exec(t.slice(tok.lastIndex)); if (dm) { end = tok.lastIndex + dm[0].length; rd = dm[1]; } break; }
      }
      if (end < 0) continue;
      if (m[1] !== '.' && rd !== '.') continue;   // 两边都有括号：交给 tex2typst
      hit = { i: m.index, j: re.lastIndex, k: q.index, end, l: m[1], r: rd };
      break;
    }
    if (!hit) return t;
    const inner = t.slice(hit.j, hit.k);
    if (/&|\\\\/.test(inner)) {
      const env = /^\s*\\begin\{(aligned|array|matrix)\}(\{[^}]*\})?([\s\S]*)\\end\{\1\}\s*$/.exec(inner);
      if (hit.r === '.' && /\{|lbrace/.test(hit.l) && env) { t = t.slice(0, hit.i) + `\\begin{cases}${env[3]}\\end{cases}` + t.slice(hit.end); continue; }
      const lit = d => d === '.' ? '' : (store.push(DELIM[d].length === 1 && '()[]{}'.includes(DELIM[d]) ? '\\' + DELIM[d] : DELIM[d]), `{\\text{@S${store.length - 1}@}}`);
      t = t.slice(0, hit.i) + lit(hit.l) + inner + lit(hit.r) + t.slice(hit.end); continue;
    }
    const L = hit.l === '.' ? '' : DELIM[hit.l], R = hit.r === '.' ? '' : DELIM[hit.r];
    const body = inner.trim() ? texToTypst(inner) : 'zws';
    store.push(L && '([{'.includes(L) ? `lr(\\${L} ${body})` : `lr(${L}${body} ${R && ')]}'.includes(R) ? '\\' + R : R})`);
    t = t.slice(0, hit.i) + `{\\text{@S${store.length - 1}@}}` + t.slice(hit.end);
  }
  return t;
}
/* 去掉一层命令外壳：\boxed{x} → x */
function unwrap(t, cmd) {
  let i;
  while ((i = t.indexOf('\\' + cmd + '{')) >= 0) { const [a, j] = grab(t, i + cmd.length + 2, '{', '}'); t = t.slice(0, i) + '{' + a + '}' + t.slice(j); }
  return t;
}
function texToTypst(tex) {
  const store = [];
  let t = unwrap(String(tex), 'boxed');
  let i;
  t = t.replace(/\\coloneqq(?![A-Za-z])/g, () => (store.push(':='), `{\\text{@S${store.length - 1}@}}`));
  while ((i = t.indexOf('\\phantom{')) >= 0) { const [, j] = grab(t, i + 9, '{', '}'); t = t.slice(0, i) + ' ' + t.slice(j); }
  t = t.replace(/\\tag\*?\{\$?([^{}$]*)\$?\}/g, (m, x) => /^[\w\s.-]+$/.test(x) ? `\\qquad\\text{(${x.trim()})}` : `\\qquad(${x.trim()})`);
  /* tex2typst 不认识（或会丢掉括号）的一元重音 */
  const ACC = { overparen: 'overparen', underparen: 'underparen', mathring: 'circle', check: 'caron', breve: 'breve', acute: 'acute', grave: 'grave', dddot: 'dot.triple', overleftrightarrow: 'arrow.l.r', mathscr: 'scr' };
  t = t.replace(/\\(overparen|underparen|mathring|check|breve|acute|grave|dddot|overleftrightarrow|mathscr)(?![A-Za-z])\s*/g, '\\@$1');
  while ((i = t.indexOf('\\@')) >= 0) {
    const cmd = /^\\@(overparen|underparen|mathring|check|breve|acute|grave|dddot|overleftrightarrow|mathscr)/.exec(t.slice(i))[1]; let j = i + cmd.length + 2, a;
    if (t[j] === '{') [a, j] = grab(t, j + 1, '{', '}'); else { a = t[j] || ''; j++; if (a === '\\') { const w = /^[A-Za-z]+/.exec(t.slice(j)); if (w) { a += w[0]; j += w[0].length; } } }
    store.push(`${ACC[cmd]}(${a.trim() ? texToTypst(a) : 'zws'})`);
    t = t.slice(0, i) + `{\\text{@S${store.length - 1}@}}` + t.slice(j);
  }
  t = oneSided(stacks(t, store), store).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  for (const [re, to] of PRE) t = t.replace(re, to);
  let y;
  try { y = tex2typst(t, { nonStrict: true, preferShorthands: true, fracToSlash: true, inftyToOo: true }); }
  catch (e) { texToTypst.failed.push([tex, e.message]); return String(tex).replace(/\s+/g, ' ').trim(); }
  for (const [re, to] of POST) y = y.replace(re, to);
  y = y.replace(/"@S(\d+)@"( *)(?=([_^])?)/g, (m, k, sp, att) => ' ' + store[+k] + (att ? '' : ' '));
  y = y.replace(/"(?:[^"\\]|\\.)*"|\b([A-Za-z][A-Za-z]+(?:\.[a-z]+)*)\(/g, (m, id) => id && !FUNCS.has(id.split('.')[0]) ? id + ' (' : m);
  return hlines(y).replace(/\s+/g, ' ').trim();
}
texToTypst.failed = [];
/* Typst 数学里可以「调用」的函数名；其余名字后面紧跟括号要加空格，否则会被当成函数调用 */
const FUNCS = new Set(('sqrt root frac binom abs norm floor ceil round lr mid mat vec cases upright italic bold sans mono serif cal frak bb op limits scripts display inline script sscript attach stretch accent hat tilde overline underline overbrace underbrace overbracket underbracket overparen underparen overshell undershell arrow dot ddot dddot ddddot macron breve acute grave circle caron cancel class primes text h box scr').split(' '));
/* array 里的 \hline：tex2typst 会留下行首的 hline，改成 mat 的 augment */
function hlines(y) {
  let from = 0, i;
  while ((i = y.indexOf('mat(', from)) >= 0) {
    const [inner, end] = grab(y, i + 4, '(', ')');
    from = end;
    if (!/(^|; *)hline\b/.test(inner)) continue;
    const parts = []; let d = 0, s = 0;
    for (let k = 0; k < inner.length; k++) { const c = inner[k]; if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === ';' && !d) { parts.push(inner.slice(s, k)); s = k + 1; } }
    parts.push(inner.slice(s));
    const hs = []; let rows = 0;
    const out = parts.map((p, k) => { let q = p.trim(); while (/^hline\b/.test(q)) { q = q.replace(/^hline\b,? */, ''); if (rows || k) hs.push(rows); } if (q) rows++; return q; }).filter(Boolean);
    let body = out.join('; ');
    const hl = [...new Set(hs.filter(r => r > 0 && r < rows))];
    if (hl.length) {
      const h = hl.length === 1 ? hl[0] : `(${hl.join(', ')})`;
      if (/augment: #\d+/.test(body)) body = body.replace(/augment: #(\d+)/, (m, v) => `augment: #(hline: ${h}, vline: ${v})`);
      else if (/augment: #\(vline: /.test(body)) body = body.replace(/augment: #\(vline: /, `augment: #(hline: ${h}, vline: `);
      else body = `augment: #(hline: ${h}), ` + body;
    }
    y = y.slice(0, i + 4) + body + y.slice(end - 1);
    from = i + 4 + body.length;
  }
  return y;
}

/* ---------- 文字：转义 Markdown 特殊字符 ---------- */
function escText(s, inTable) {
  s = s.replace(/\\/g, '\\\\').replace(/([*_`])/g, '\\$1').replace(/\$/g, '\\$');
  if (inTable) s = s.replace(/\|/g, '\\|');
  return s;
}
const escLineStart = s => s.replace(/^(\s*)([-+>#]|\d+[.)])(?=\s)/gm, '$1\\$2');

/* 公式先抽出来，换成占位符，最后再放回去 */
function protectMath(s, store) {
  /* \text{… $x$ …} 里套公式：拆成 \text{…} x \text{…} */
  s = s.replace(/\\(text|mbox|textrm)\{((?:[^{}$]|\$[^$]*\$)*)\}/g, (m, c, x) => x.includes('$') ? ('\\text{' + x.replace(/\$([^$]*)\$/g, '}$1\\text{') + '}').replace(/\\text\{\}/g, '') : m);
  return s.replace(/\$\$([\s\S]+?)\$\$/g, (m, x) => { store.push(`$$ ${texToTypst(x)} $$`); return `\u0002${store.length - 1}\u0003`; })
    .replace(/\$([^$]+?)\$/g, (m, x) => { store.push(`$${texToTypst(x)}$`); return `\u0002${store.length - 1}\u0003`; });
}
const restore = (s, store) => s.replace(/\u0002(\d+)\u0003/g, (m, i) => store[+i]);

/* ---------- HTML → Markdown ---------- */
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
function inline(node, ctx) {
  let out = '';
  for (const c of node.children || []) {
    if (c.type === 'text') { out += escText(decode(c.data), ctx.table); continue; }
    if (c.type !== 'tag') continue;
    const t = c.name, inner = () => inline(c, ctx);
    if (t === 'strong' || t === 'b' || t === 'em' || t === 'i') {
      const x = inner(), mk = t === 'strong' || t === 'b' ? '**' : '*', m = /^(\s*)([\s\S]*?)(\s*)$/.exec(x);
      out += m[2] ? m[1] + mk + m[2] + mk + m[3] : x;
      if (mk === '**') out = out.replace(/\*\*\*\*(?=[^*]*\*\*$)/, '');   // 相邻两段加粗合并
    }
    else if (t === 'br') out += ctx.table ? ' ' : '\\\n';
    else if (t === 'img') { const src = /^\/fig\/[\w\/.-]+$/.test((c.attribs || {}).src || '') ? c.attribs.src : null; if (src) out += `![](${src})`; }
    else if (t === 'sub') out += `$_(${inner()})$`;
    else if (t === 'sup') out += `$^(${inner()})$`;
    else out += inner();
  }
  return out;
}
function blocks(node, ctx, depth = 0) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf.trim()) out.push(escLineStart(buf.trim())); buf = ''; };
  for (const c of node.children || []) {
    if (c.type === 'text') { buf += escText(decode(c.data)); continue; }
    if (c.type !== 'tag') continue;
    const cls = String((c.attribs || {}).class || '');
    switch (c.name) {
      case 'p': flush(); { const x = inline(c, ctx).trim(); if (x) out.push((/\bsmall\b/.test(cls) ? '-# ' : '') + (/\bsmall\b/.test(cls) ? x : escLineStart(x))); } break;
      case 'ul': case 'ol': {
        flush();
        const items = (c.children || []).filter(x => x.type === 'tag' && x.name === 'li');
        const plain = /\bplain\b/.test(cls);
        const lines = items.map((li, i) => {
          const sub = blocks(li, ctx, depth + 1);
          const mark = plain ? '+ ' : c.name === 'ol' ? `${i + 1}. ` : '- ';
          return mark + sub.join('\n\n').replace(/\n/g, '\n' + ' '.repeat(mark.length));
        });
        out.push(lines.join('\n'));
        break;
      }
      case 'div':
        flush();
        if (/\btip\b/.test(cls)) out.push(blocks(c, ctx, depth).join('\n\n').split('\n').map(l => l ? '> ' + l : '>').join('\n'));
        else out.push(...blocks(c, ctx, depth));
        break;
      case 'table': {
        flush();
        const rows = [];
        const walk = n => { for (const k of n.children || []) { if (k.type !== 'tag') continue; if (k.name === 'tr') rows.push(k); else walk(k); } };
        walk(c);
        const cells = rows.map(r => (r.children || []).filter(x => x.type === 'tag' && (x.name === 'td' || x.name === 'th')).map(x => inline(x, { ...ctx, table: true }).trim().replace(/\n+/g, ' ')));
        if (!cells.length) break;
        const w = Math.max(...cells.map(r => r.length));
        const line = r => '| ' + Array.from({ length: w }, (_, i) => r[i] || ' ').join(' | ') + ' |';
        const hasHead = rows[0] && (rows[0].children || []).some(x => x.type === 'tag' && x.name === 'th');
        const head = hasHead ? cells[0] : Array(w).fill(' ');
        out.push([line(head), '|' + ' --- |'.repeat(w), ...(hasHead ? cells.slice(1) : cells).map(line)].join('\n'));
        break;
      }
      case 'li': out.push(...blocks(c, ctx, depth)); break;
      default: buf += inline({ children: [c] }, ctx);
    }
  }
  flush();
  return out;
}
function htmlToMd(html) {
  const store = [];
  const doc = parseDocument(protectMath(String(html || ''), store), { decodeEntities: false });
  const md = blocks(doc, {}).join('\n\n');
  return restore(md, store).replace(/\n{3,}/g, '\n\n').trim();
}
/* 「空行分段」的简化写法 */
function liteToMd(src) {
  const store = [];
  return String(src || '').split(/\n\s*\n/).map(p => {
    const s = protectMath(p.trim(), store);
    return restore(escLineStart(escText(decode(s)).replace(/\\\u0002/g, '\u0002')), store);
  }).filter(Boolean).join('\n\n');
}
/* 入口：自动判断旧内容是 HTML 还是简化写法 */
const toNew = old => (/^\s*<|<(p|div|ul|ol|table)[\s>]/.test(String(old || '')) ? htmlToMd(old) : liteToMd(old)).replace(/\$\$\$\$/g, () => '$$\n$$');

/* ---------- 标题：网页上标题是纯文字，公式换成 Unicode ---------- */
const SYM = { varepsilon: 'ε', epsilon: 'ε', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', lambda: 'λ', mu: 'μ', xi: 'ξ', pi: 'π', sigma: 'σ', tau: 'τ', varphi: 'φ', phi: 'φ', psi: 'ψ', omega: 'ω', eta: 'η', rho: 'ρ', chi: 'χ', zeta: 'ζ',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', infty: '∞', to: '→', rightarrow: '→', Rightarrow: ' ⇒ ', Leftrightarrow: ' ⇔ ', iff: ' ⇔ ', ne: '≠', neq: '≠', le: '≤', leq: '≤', ge: '≥', geq: '≥', sim: '~', approx: '≈', mid: '|', nabla: '∇', square: '□',
  int: '∫', iint: '∬', oint: '∮', sum: '∑', prod: '∏', partial: '∂', in: '∈', pm: '±', dots: '…', cdots: '⋯', ldots: '…', quad: ' ', qquad: '  ', perp: '⊥', subset: '⊂', cup: '∪', cap: '∩', forall: '∀', exists: '∃', emptyset: '∅' };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', n: 'ⁿ', '(': '⁽', ')': '⁾', T: 'ᵀ', i: 'ⁱ', k: 'ᵏ', x: 'ˣ', t: 'ᵗ', m: 'ᵐ', '*': '*' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', n: 'ₙ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', x: 'ₓ', '(': '₍', ')': '₎' };
function texToText(t) {
  const ARG = String.raw`(\{[^{}]*\}|\\[A-Za-z]+|[^\s{}\\])`;
  const un = a => a[0] === '{' ? a.slice(1, -1) : a;
  const wrap = a => /^([\w.′'\u00B2\u00B3\u00B9\u2070-\u209F√]+|\|[^|]*\||\\[A-Za-z]+)$/.test(a) ? a : `(${a})`;
  const wrapD = a => /^(\d+|\p{L}[\u00B2\u00B3\u00B9\u2070-\u209F]*|\|[^|]*\||\\[A-Za-z]+)$/u.test(a) ? a : `(${a})`;
  let s = String(t).replace(/\\\{|\\lbrace/g, '\u0005').replace(/\\\}|\\rbrace/g, '\u0006').replace(/\\[,;:]|~/g, ' ').replace(/\\!/g, '');
  for (let k = 0; k < 8; k++) {
    s = s.replace(/\\(?:mathrm|text|operatorname|boldsymbol|mathbf|mathit|displaystyle)\s*\{([^{}]*)\}/g, '$1')
      .replace(/\\(?:bar|overline)\s*(\{[^{}]*\}|\w)/g, (m, a) => un(a) + '̄')
      .replace(new RegExp(String.raw`\\[dt]?frac\s*${ARG}\s*${ARG}`, 'g'), (m, a, b) => `${wrap(un(a).trim())}/${wrapD(un(b).trim())}`)
      .replace(new RegExp(String.raw`\\sqrt\s*(?:\[([^\]]*)\])?\s*${ARG}`, 'g'), (m, n, a) => (n ? (conv(n, SUP) || `(${n})`) : '') + '√' + wrap(un(a).trim()))
      .replace(/(^|[^\\A-Za-z}^_])\{([^{}]*)\}/g, '$1$2')
      .replace(/\^\{([^{}\\]*)\}/g, (m, x) => conv(x.trim(), SUP) ?? ([...x.trim()].length === 1 ? '^' + x.trim() : m))
      .replace(/_\{([^{}\\]*)\}/g, (m, x) => conv(x.trim(), SUB) ?? ([...x.trim()].length === 1 ? '_' + x.trim() : m));
  }
  const FN = /^(sin|cos|tan|cot|sec|csc|ln|log|lim|max|min|exp|arcsin|arccos|arctan|sup|inf)$/;
  s = s.replace(/\\(?:bigl|bigr|bigg|big|Bigl|Bigr|Big|left|right|displaystyle|limits)(?![A-Za-z])/g, '')
    .replace(/\\([A-Za-z]+)\s*/g, (m, c) => SYM[c] != null ? (c === 'mid' ? ' | ' : SYM[c]) : FN.test(c) ? ` ${c} ` : c);
  s = s.replace(/\^\{([^{}]*)\}|\^(\S)/g, (m, a, b) => { const x = (a ?? b).trim(); return conv(x, SUP) ?? ([...x].length === 1 ? '^' + x : `^(${x})`); })
    .replace(/_\{([^{}]*)\}|_(\S)/g, (m, a, b) => { const x = (a ?? b).trim(); return conv(x, SUB) ?? ([...x].length === 1 ? '_' + x : `_(${x})`); });
  s = s.replace(/ ([_^])/g, '$1').replace(/\b(sin|cos|tan|cot|sec|csc|ln|log|exp|arcsin|arccos|arctan) \(/g, '$1(');
  return s.replace(/[{}\\]/g, '').replace(/\u0005/g, '{').replace(/\u0006/g, '}').replace(/\s+/g, ' ').replace(/([(\[{|]) | ([)\]}])/g, '$1$2').trim();
}
const conv = (x, map) => x && [...x].every(c => map[c]) ? [...x].map(c => map[c]).join('') : null;
const titleText = t => String(t).replace(/\$([^$]+)\$/g, (m, x) => texToText(x));

module.exports = { toNew, texToTypst, htmlToMd, liteToMd, titleText };
