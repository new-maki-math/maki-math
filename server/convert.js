'use strict';
/* 旧写法（HTML 或「空行分段」+ LaTeX 公式）→ 新写法（Markdown + Typst 公式）。
   用于把现有课程转过来，以及回滚到转换前的旧版本时临时转换。 */
const { parseDocument } = require('htmlparser2');
const { tex2typst } = require('tex2typst');

/* ---------- 公式：LaTeX → Typst ---------- */
const PRE = [
  [/\\(?:displaystyle|textstyle|scriptstyle|limits|nolimits|,|;|:|!)\s*(?![A-Za-z])/g, m => /\\[,;:]/.test(m) ? ' ' : (m.startsWith('\\!') ? '' : ' ')],
  [/\\dfrac|\\tfrac/g, '\\frac'],
  [/\\dbinom|\\tbinom/g, '\\binom'],
  [/\\left\.|\\right\./g, ''],
  [/\\lvert|\\rvert/g, '|'], [/\\lVert|\\rVert/g, '\\|'],
  [/\\(?:big|Big|bigg|Bigg)[lrm]?(?![A-Za-z])/g, ''],
  [/\\varnothing/g, '\\emptyset'],
  [/\\lnot|\\neg/g, '\\neg '],
  [/\\colon/g, ':'],
  [/\\mathrm\{d\}/g, '\\mathrm{d}'],
  [/\\(?:hspace|vspace)\*?\{[^}]*\}/g, ' '],
  [/\\phantom\{[^}]*\}/g, ''],
  [/\\(?:qquad)/g, '\\qquad '],
];
/* tex2typst 输出后的修正 */
const POST = [
  [/\blnot\b/g, 'not'],
  [/tilde\.op\.not/g, 'tilde.not'],
  [/\bcircle\.small\b/g, 'compose'],
  [/\bperp\b/g, 'bot'],
  [/\b(compose|dot\.op|circle|star|dagger|ast|times|tilde\.op)\(/g, '$1 ('],   // 符号紧跟括号会被当成「加重音」
  [/upright\(((?:[A-Za-z] )+[A-Za-z])\)/g, (m, x) => `upright("${x.replace(/ /g, '')}")`],
];
/* \xrightarrow{f} → \overset{f}{\longrightarrow}（需要配对花括号） */
function xArrows(t) {
  let i;
  while ((i = t.search(/\\x(right|left)arrow\s*\{/)) >= 0) {
    const m = /\\x(right|left)arrow\s*\{/.exec(t.slice(i));
    let j = i + m[0].length, d = 1;
    while (j < t.length && d) { if (t[j] === '{') d++; else if (t[j] === '}') d--; j++; }
    const arg = t.slice(i + m[0].length, j - 1);
    t = t.slice(0, i) + `\\overset{${arg}}{\\long${m[1]}arrow}` + t.slice(j);
  }
  return t;
}
function texToTypst(tex) {
  let t = xArrows(String(tex)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  for (const [re, to] of PRE) t = t.replace(re, to);
  let y = tex2typst(t, { nonStrict: true, preferShorthands: true, fracToSlash: true, inftyToOo: true });
  for (const [re, to] of POST) y = y.replace(re, to);
  return y.replace(/\s+/g, ' ').trim();
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
    if (t === 'strong' || t === 'b') { const x = inner(); out += x.trim() ? `**${x}**` : x; }
    else if (t === 'em' || t === 'i') { const x = inner(); out += x.trim() ? `*${x}*` : x; }
    else if (t === 'br') out += ctx.table ? ' ' : '\\\n';
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
          const mark = c.name === 'ol' && !plain ? `${i + 1}. ` : '- ';
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

module.exports = { toNew, texToTypst, htmlToMd, liteToMd };
