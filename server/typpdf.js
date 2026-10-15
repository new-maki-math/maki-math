'use strict';
/* 新写法课程的「我的讲义」：Markdown + Typst 源文 → 一份 Typst 文档 → PDF（用 Typst 编译，不再用 xelatex） */
const MarkdownIt = require('markdown-it');
const course = require('./course');
const { httpError } = require('./auth');
const { latexProblem } = require('./render');

const cjk = require('markdown-it-cjk-friendly');   // 中文标点紧挨 ** 时也能加粗
const md = new MarkdownIt('default', { html: false, linkify: false, typographer: false })
  .disable(['link', 'autolink', 'heading', 'lheading', 'code', 'fence', 'reference', 'html_block', 'html_inline', 'hr'])
  .use(cjk.default || cjk);
const CJK = (process.env.TYPST_CJK_FONT || 'Noto Serif CJK SC, Source Han Serif SC, FandolSong').split(',').map(s => s.trim());
const CJK_SANS = (process.env.TYPST_CJK_SANS || 'Noto Sans CJK SC, Source Han Sans SC, FandolHei').split(',').map(s => s.trim());

/* Typst 正文里的特殊字符 */
const escT = s => String(s).replace(/[\\#$*_`@<>~\[\]=+\-\/"']/g, c => '\\' + c);
const str = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

/* 一段源文 → Typst 内容。refFn(id) 返回引用的 Typst 片段 */
function srcToTyp(src, refFn) {
  const math = [];
  let s = String(src || '').replace(/\r\n?/g, '\n').replace(/\\\$/g, '\u0001');
  const put = (f, display) => {
    f = f.replace(/\u0001/g, '\\$').trim();
    if (latexProblem(f)) throw httpError(400, `有公式还没改成 Typst 写法：${f.slice(0, 40)}`);
    math.push(display ? `$ ${f} $` : `$${f}$`);
    return `\u0002${math.length - 1}\u0003`;
  };
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, f) => put(f, true)).replace(/\$([^$\n]+?)\$/g, (m, f) => put(f, false)).replace(/\u0001/g, '\\$');
  s = s.replace(/^-# (.*)$/gm, '\u0004$1');
  const toks = md.parse(s, {});
  const text = t => String(t).split(/(\[\[(?:[a-z0-9-]+:)?\w+\]\])/).map((part, k) => k % 2 ? refFn(part.slice(2, -2))
    : escT(part).replace(/\u0002(\d+)\u0003/g, (m, i) => math[+i]).replace(/\u0001/g, '\\$')).join('');
  /* 块级：递归下降 */
  let i = 0;
  const inline = tok => {
    let out = '';
    for (const c of tok.children || []) {
      if (c.type === 'text') out += text(c.content);
      else if (c.type === 'strong_open') out += '#strong[';
      else if (c.type === 'em_open') out += '#emph[';
      else if (c.type === 'strong_close' || c.type === 's_close' || c.type === 'em_close') out += ']';
      else if (c.type === 's_open') out += '#strike[';
      else if (c.type === 'softbreak') out += ' ';
      else if (c.type === 'hardbreak') out += ' \\\n';
      else if (c.type === 'code_inline') out += '#raw(' + str(c.content) + ')';
      else if (c.type === 'image') { const m = /^\/(fig\/[\w\/-]+\.(?:svg|png|jpg))$/.exec(c.attrGet('src') || ''); if (m) out += `#align(center, image(${str(m[1])}, width: 50%))`; }
    }
    return out;
  };
  const blocks = end => {
    const out = [];
    while (i < toks.length && toks[i].type !== end) {
      const t = toks[i];
      if (t.type === 'paragraph_open') {
        const c = inline(toks[i + 1]); i += 3;
        const small = c.startsWith('\u0004');
        out.push(small ? `#text(size: 0.85em, fill: luma(110))[${c.slice(1)}]` : c);
      } else if (t.type === 'bullet_list_open' || t.type === 'ordered_list_open') {
        const fn = t.type === 'bullet_list_open' ? 'list' : 'enum', close = t.type.replace('open', 'close'); i++;
        const items = [];
        while (toks[i].type !== close) { if (toks[i].type === 'list_item_open') { i++; items.push(`[${blocks('list_item_close').join('\n\n')}]`); } i++; }
        i++;
        out.push(`#${fn}(${t.markup === '+' ? 'marker: [], ' : ''}${items.join(', ')})`);
      } else if (t.type === 'blockquote_open') {
        i++; const inner = blocks('blockquote_close'); i++;
        out.push(`#block(fill: luma(244), inset: (x: 10pt, y: 7pt), radius: 4pt, width: 100%, stroke: (left: 2pt + rgb("#2350C6")))[${inner.join('\n\n')}]`);
      } else if (t.type === 'table_open') {
        i++; const rows = [];
        while (toks[i].type !== 'table_close') {
          if (toks[i].type === 'tr_open') {
            const row = []; i++;
            while (toks[i].type !== 'tr_close') {
              if (toks[i].type === 'th_open' || toks[i].type === 'td_open') {
                const head = toks[i].type === 'th_open', c = inline(toks[i + 1]).trim();
                row.push(head ? `[*${c}*]` : c === 'T' ? '[#text(fill: rgb("#2350C6"))[T]]' : c === 'F' ? '[#text(fill: rgb("#C22D25"))[F]]' : `[${c}]`);
                i += 3;
              } else i++;
            }
            rows.push(row); i++;
          } else i++;
        }
        i++;
        const w = Math.max(...rows.map(r => r.length));
        out.push(`#align(center, table(columns: ${w}, align: center + horizon, inset: (x: 8pt, y: 4pt), stroke: 0.5pt + luma(170), ${rows.map(r => r.concat(Array(w - r.length).fill('[]')).join(', ')).join(',\n  ')}))`);
      } else i++;
    }
    return out;
  };
  return blocks(null).join('\n\n');
}

const KIND = { axiom: '公理', def: '定义', thm: '定理', prop: '性质', method: '方法', note: '注记', example: '例题', exercise: '练习' };
const COLOR = t => ({ def: '#2350C6', axiom: '#2350C6', method: '#7340BF', example: '#222222', exercise: '#222222', note: '#777777' }[t] || '#C22D25');
async function buildTyp(slug, { hand, refs, tpl, title }) {
  const st = await course.load(slug);
  if (!st) throw httpError(404, '课程不存在');
  if (!Array.isArray(hand) || !hand.length) throw httpError(400, '讲义是空的');
  if (hand.length > 400) throw httpError(400, '讲义太长了，请分成几份');
  const T = tpl !== 'student';
  const num = {}, app = {};
  hand.forEach((x, i) => { if (!st.N[x.id]) throw httpError(400, `节点「${x.id}」不存在`); num[x.id] = i + 1; });
  (refs || []).forEach((id, i) => { if (st.N[id]) app[id] = i + 1; });
  const lab = id => `<n-${id.replace(/[^A-Za-z0-9_-]/g, '-')}>`;
  const label = id => num[id] ? `${KIND[st.N[id].type]} ${num[id]}` : app[id] ? `附录 A${app[id]}` : null;
  const refFn = id => {
    if (course.isExt(id)) { const e = st.ext && st.ext[id]; return e ? `《${escT(e.courseTitle)}》${escT(e.title)}` : escT(id); }
    if (!st.N[id]) return escT(id);
    const l = label(id), name = escT(st.N[id].title);
    return l ? `#link(${lab(id)})[${name}（${l}）]` : `${name}（未收录）`;
  };
  const head = (kind, n, ttl, id, color, imp) => `#v(0.9em)\n#metadata(none) ${lab(id)}\n#text(font: (${CJK_SANS.map(str).join(', ')}), weight: "bold", fill: rgb("${color}"))[${kind} ${n}]#h(1em)#strong[${escT(ttl)}]${imp ? `#h(0.8em)#text(size: 0.8em, fill: luma(140))[${'★'.repeat(imp)}]` : ''}\n\n`;
  let body = '';
  const field = x => srcToTyp(x.src != null ? x.src : '', refFn);
  for (const x of hand) {
    const n = st.N[x.id], q = course.isQ(n.type);
    if (T && x.note) body += `#block(inset: (left: 12pt), text(size: 0.9em, fill: luma(110))[${escT(String(x.note).replace(/\n/g, ' '))}])\n`;
    const imp = [1, 2, 3].includes(x.imp) ? x.imp : n.imp;
    body += head(KIND[n.type], num[x.id], n.title.replace(/^(例|练习)：/, ''), x.id, COLOR(n.type), T ? imp : 0);
    const vs = n.variants || [], vi = Number.isInteger(x.v) && x.v > 0 && vs[x.v - 1] ? x.v : 0;
    body += field(vi ? vs[vi - 1] : n) + '\n\n';
    if (T && vs.length) body += `#text(size: 0.8em, fill: luma(120))[这里用的是「${escT(vi ? vs[vi - 1].name : '原定义')}」；另有 ${vs.length} 种等价说法，见网站。]\n\n`;
    const ps = course.proofsOf(n);
    const p = x.p === -1 ? null : ps[Number.isInteger(x.p) ? x.p : 0];
    if (p && (T || q)) {
      body += `#block(width: 100%)[#emph[${q ? '解' : '证明'}．] ${field(p)}`;
      if (T && p.deps.length) body += `\n\n#text(size: 0.8em, fill: luma(120))[依据：${p.deps.map(d => course.isExt(d) ? refFn(d) : label(d) ? escT(label(d)) : st.N[d] ? escT(st.N[d].title) + '（未收录）' : escT(d)).join('，')}]`;
      body += ' #h(1fr) $square$]\n\n';
    }
  }
  if (refs && refs.length) {
    body += `#v(1.5em)\n#text(size: 1.2em, weight: "bold")[附录：引用到的结论]\n\n`;
    for (const id of refs) if (st.N[id]) body += head('A', app[id], st.N[id].title, id, COLOR(st.N[id].type)) + field(st.N[id]) + '\n\n';
  }
  const docTitle = escT(String(title || '我的讲义').slice(0, 40));
  return `// 由 maki-math 生成：${st.meta.title}，${T ? '教师版' : '学生版'}。用 Typst 编译：typst compile 本文件.typ
#set document(title: ${str(String(title || '我的讲义').slice(0, 40))})
#set page(paper: "a4", margin: 2.4cm, numbering: "1")
#set text(font: ("New Computer Modern", ${CJK.map(str).join(', ')}), size: 11pt, lang: "zh", region: "cn")
#set par(leading: 0.95em, spacing: 1.2em, justify: true)
#show math.equation: set text(font: "New Computer Modern Math")
#show link: set text(fill: rgb("#2350C6"))
#align(center)[#text(size: 20pt, weight: "bold")[${docTitle}] \\ #v(0.4em) #text(fill: luma(100))[${escT(st.meta.title)} · ${T ? '教师版' : '学生版'} · maki-math.com]]
#v(1.2em)

${body}`;
}

module.exports = { buildTyp, srcToTyp };
