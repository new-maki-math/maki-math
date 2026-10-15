'use strict';
/* 正文写法：Markdown + Typst 公式。
   - 正文是 Markdown：空行分段、**加粗**、*斜体*、- 列表、1. 编号、表格、> 提示框、-# 小字
   - 公式是 Typst：$x^2$ 行内公式，$$ ... $$ 独立公式（可以跨行）
   - [[节点编号]] 引用别的节点
   服务器用 Typst 编译器把公式编译成 MathML，前端再用 MathJax 显示。不接受 LaTeX 命令。 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const MarkdownIt = require('markdown-it');
const { parseDocument } = require('htmlparser2');
const { Element, Text } = require('domhandler');
const render = require('dom-serializer').default;

const TYPST = process.env.TYPST_BIN || (fs.existsSync(path.join(__dirname, '..', 'bin', 'typst')) ? path.join(__dirname, '..', 'bin', 'typst') : 'typst');
const md = new MarkdownIt('default', { html: false, linkify: false, typographer: false, breaks: false })
  .disable(['link', 'image', 'autolink', 'heading', 'lheading', 'code', 'fence', 'reference', 'html_block', 'html_inline', 'hr']);

/* 常见 LaTeX 命令 → Typst 写法，用来给出修改提示 */
const HINT = {
  frac: 'a/b 或 frac(a, b)', dfrac: 'a/b 或 frac(a, b)', tfrac: 'a/b', sqrt: 'sqrt(x)，n 次根 root(n, x)', alpha: 'alpha', beta: 'beta', gamma: 'gamma',
  delta: 'delta', varepsilon: 'epsilon', epsilon: 'epsilon.alt', theta: 'theta', lambda: 'lambda', pi: 'pi', sigma: 'sigma', varphi: 'phi', phi: 'phi.alt', omega: 'omega',
  mathbb: 'RR、ZZ、NN、QQ、CC，或 bb(X)', mathrm: 'upright(x)，或用 "文字"', text: '"文字"（直接加双引号）', mathcal: 'cal(A)', mathbf: 'bold(x)',
  cdot: 'dot', cdots: 'dots.c', ldots: 'dots', dots: 'dots', times: 'times', le: '<=', leq: '<=', ge: '>=', geq: '>=', ne: '!=', neq: '!=',
  infty: 'oo', to: '->', rightarrow: '->', Rightarrow: '=>', Leftrightarrow: '<=>', iff: '<=>', implies: '=>', mapsto: '|->', in: 'in', notin: 'in.not',
  subset: 'subset', subseteq: 'subset.eq', cup: 'union', cap: 'sect', emptyset: 'emptyset', varnothing: 'emptyset', forall: 'forall', exists: 'exists',
  neg: 'not', lnot: 'not', wedge: 'and', land: 'and', vee: 'or', lor: 'or', sum: 'sum_(k=1)^n', prod: 'product', int: 'integral', lim: 'lim_(x -> 0)',
  left: '直接写括号（会自动伸缩），或 lr(( ... ))', right: '直接写括号', mid: '| 或 divides', pm: 'plus.minus', equiv: 'equiv', pmod: '(mod n)', bmod: 'mod',
  overline: 'overline(x)', bar: 'macron(x) 或 overline(x)', hat: 'hat(x)', vec: 'arrow(x)', binom: 'binom(n, k)', quad: 'quad', qquad: 'wide',
  operatorname: 'op("名字")', begin: 'cases(...)、mat(...)，多行对齐用 & 和 \\ 换行', end: '（不需要 end）', gcd: 'gcd', lcm: 'lcm',
};
function latexProblem(f) {
  const m = /\\([A-Za-z]+)/.exec(f);
  if (m) return `用了 LaTeX 命令 \\${m[1]}，请改成 Typst 写法${HINT[m[1]] ? `：${HINT[m[1]]}` : ''}`;
  if (f.includes('#')) return '公式里不能用 #（不能调用 Typst 代码）';
  return null;
}

/* 把源文里的公式拿出来，换成占位符 */
function extract(src) {
  const math = [];
  let s = String(src || '').replace(/\r\n?/g, '\n').replace(/\\\$/g, '\u0001');
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, f) => { math.push({ f: f.replace(/\u0001/g, '\\$').trim(), display: true }); return `@@m${math.length - 1}@@`; });
  s = s.replace(/\$([^$\n]+?)\$/g, (m, f) => { math.push({ f: f.replace(/\u0001/g, '\\$').trim(), display: false }); return `@@m${math.length - 1}@@`; });
  s = s.replace(/\u0001/g, '\\$');
  return { s, math };
}

/* ---------- Typst 编译：一次编译很多个公式 ---------- */
function runTypst(doc) {
  return new Promise(resolve => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-typ-'));
    fs.writeFileSync(path.join(dir, 'm.typ'), doc);
    execFile(TYPST, ['compile', '--features', 'html', '--format', 'html', '--diagnostic-format', 'short', '--root', dir, 'm.typ', 'm.html'],
      { cwd: dir, timeout: 30_000, maxBuffer: 64 << 20, env: { PATH: process.env.PATH, HOME: dir } }, (err, stdout, stderr) => {
        let html = null;
        try { html = fs.readFileSync(path.join(dir, 'm.html'), 'utf8'); } catch (e) { }
        fs.rmSync(dir, { recursive: true, force: true });
        resolve({ ok: !err && html != null, html, log: String(stderr || '') + (err && err.killed ? '\n编译超时' : '') });
      });
  });
}
/* 网页导出（MathML）不支持上划线，换成可伸长的重音 */
const PRE = ['#show math.overline: it => math.accent(it.body, "\\u{0305}")'];
const wrap = (x, i) => `#html.elem("${x.display ? 'div' : 'span'}", attrs: (id: "m${i}"))[${x.display ? `$ ${x.f} $` : `$${x.f}$`}]`;
/* 返回每个公式的 MathML 或错误信息 */
async function compileFormulas(list) {
  const out = list.map(x => ({ ...x }));
  for (const x of out) { const p = latexProblem(x.f); if (p) x.err = p; else if (!x.f) x.err = '空公式'; }
  for (let round = 0; round < 40; round++) {
    const todo = out.map((x, i) => [x, i]).filter(([x]) => !x.err && x.mml == null);
    if (!todo.length) break;
    const lines = [...PRE], at = [];
    for (const [x, i] of todo) { at.push([lines.length + 1, i]); lines.push(...wrap(x, i).split('\n')); }
    const r = await runTypst(lines.join('\n') + '\n');
    if (r.ok) {
      for (const m of r.html.matchAll(/<(span|div) id="m(\d+)">([\s\S]*?)<\/\1>/g)) out[+m[2]].mml = fixMathML(m[3]);
      for (const [x] of todo) if (x.mml == null) x.err = '编译结果缺失';
      for (const m of r.log.matchAll(/m\.typ:(\d+):\d+: warning: (.*) (?:was|were) ignored during MathML export/g)) {
        let hit = null;
        for (const [l, i] of at) if (l <= +m[1]) hit = i;
        if (hit != null) out[hit].err = `网页上暂不支持 ${m[2]}，请换一种写法`;
      }
      break;
    }
    /* 有错：按行号找到出错的公式，标记后再编译剩下的 */
    let found = false;
    for (const m of r.log.matchAll(/m\.typ:(\d+):\d+: error: (.*)/g)) {
      const line = +m[1];
      let hit = null;
      for (const [l, i] of at) if (l <= line) hit = i;
      if (hit != null && !out[hit].err) { out[hit].err = typstMsg(m[2]); found = true; }
    }
    if (!found) { for (const [x] of todo) x.err = x.err || ('Typst 编译失败：' + (r.log.split('\n').find(l => l.includes('error')) || r.log).slice(0, 200)); break; }
  }
  for (const x of out) if (!x.err && x.mml == null) x.err = '编译失败';
  return out;
}
const typstMsg = s => s.replace(/^unknown variable: (\S+)/, '不认识的名字「$1」（几个字母连写会被当成一个名字，变量之间请加空格，比如 a b；文字请加双引号）')
  .replace(/^unclosed delimiter/, '括号没有配对').replace(/^expected (.*)/, '这里缺少 $1').trim();

/* Typst 的 MathML 是给浏览器原生显示写的（对齐靠 CSS）。交给 MathJax 前做几处调整，让间距和 TeX 一致：
   - 对齐、分段函数：把 CSS 对齐写成 columnalign 属性；对齐列开头的 = 前补一个空元素，保证两侧间距
   - f(x)：括号整体当普通符号，函数名和括号之间不留空
   - sin、log 这类函数名：写成 <mi> 加「函数作用」符号，和 TeX 的 \\log 一样排 */
/* 组合用重音符 → MathJax 认识的独立重音符；上划线可以伸长 */
const ACC = { '\u0305': ['\u203E', true], '\u0304': ['\u00AF', false], '\u0302': ['\u02C6', false], '\u0303': ['\u02DC', false], '\u0307': ['\u02D9', false],
  '\u0308': ['\u00A8', false], '\u20D7': ['\u2192', false], '\u0301': ['\u00B4', false], '\u0300': ['\u0060', false], '\u030C': ['\u02C7', false],
  '\u0306': ['\u02D8', false], '\u030A': ['\u02DA', false], '\u20D6': ['\u2190', false], '\u20E1': ['\u2194', false] };
const OPEN = new Set(['(', '[', '{', '|', '‖', '⌊', '⌈', '⟨', '⟦']);
function fixMathML(s) {
  const doc = parseDocument(s, { xmlMode: true, decodeEntities: true });
  const kids = n => (n.children || []).filter(c => c.type === 'tag');
  const walk = n => {
    for (const c of kids(n)) walk(c);
    if (n.type !== 'tag') return;
    const cls = String(n.attribs.class || '').split(/\s+/);
    if (n.name === 'mtable') {
      if (cls.includes('cases') || cls.includes('left-align')) n.attribs.columnalign = 'left left left left';
      else if (cls.includes('right-align')) n.attribs.columnalign = 'right right right right';
      else if (cls.includes('aligned')) {
        n.attribs.columnalign = 'right left right left right left right left';
        n.attribs.columnspacing = '0em 2em 0em 2em 0em 2em 0em';
        for (const tr of kids(n)) kids(tr).forEach((td, i) => {
          const first = kids(td)[0];
          if (i % 2 === 1 && first && first.name === 'mo') td.children.unshift(new Element('mi', {}, []));
        });
      }
    }
    if ((n.name === 'mover' || n.name === 'munder') && kids(n)[1] && kids(n)[1].name === 'mo') {
      const mo = kids(n)[1], a = ACC[textOf(mo)];
      if (a) { mo.children = [new Text(a[0])]; mo.attribs.stretchy = a[1] || (kids(n)[0].name === 'mrow' && a[0] === '\u2192') ? 'true' : 'false'; }
    }
    if (n.name === 'mo' && textOf(n) === '|') {
      /* 单独的竖线（绝对值、集合的「使得」）：按普通符号排，不伸长；成对出现在 mrow 两端的才当括号 */
      const sib = kids(n.parent || { children: [] });
      const fence = n.parent && n.parent.name === 'mrow' && sib.length > 1 && textOf(sib[0]) === '|' && textOf(sib[sib.length - 1]) === '|' && (sib[0] === n || sib[sib.length - 1] === n);
      if (!fence) {
        n.attribs.stretchy = 'false'; n.attribs['data-mjx-texclass'] = 'ORD'; delete n.attribs.lspace; delete n.attribs.rspace;
        /* Typst 会在 | 两边插入空白：去掉 */
        const all = n.parent.children, i = all.indexOf(n);
        for (const j of [i + 1, i - 1]) { const x = all[j]; if (x && x.type === 'tag' && x.name === 'mspace' && x.attribs.width === '0.2222em') all.splice(j, 1); }
      }
    }
    if (n.name === 'mi' && /^[\u{1D49C}-\u{1D4CF}\u212C\u2130\u2131\u210B\u2110\u2112\u2133\u211B][\uFE00\uFE01]?$/u.test(textOf(n))) {
      /* 花体：MathJax 的 script 字形太花，换成 TeX \mathcal 的样子 */
      const c = [...textOf(n)][0], SP = { '\u212C': 'B', '\u2130': 'E', '\u2131': 'F', '\u210B': 'H', '\u2110': 'I', '\u2112': 'L', '\u2133': 'M', '\u211B': 'R' };
      const cp = c.codePointAt(0), L = SP[c] || String.fromCharCode(cp < 0x1D4B6 ? 65 + cp - 0x1D49C : 97 + cp - 0x1D4B6);
      n.children = [new Text(L)]; n.attribs.mathvariant = '-tex-calligraphic';
    }
    if (n.name === 'mo' && /^[\u2211\u220F\u2210\u22C3\u22C2\u2A01\u2A02\u2A00\u2A06\u222B\u222C\u222D\u222E]$/.test(textOf(n))) {
      /* 大运算符：去掉 Typst 写死的 0 间距，让 MathJax 按 TeX 规则处理（关系符后面要留空） */
      delete n.attribs.lspace; delete n.attribs.form;
    }
    if (n.name === 'mrow') {
      const first = kids(n)[0];
      if (first && first.name === 'mo' && OPEN.has(textOf(first).trim())) n.attribs['data-mjx-texclass'] = 'ORD';
    }
  };
  walk({ type: 'tag', name: '#root', attribs: {}, children: doc.children });
  /* 函数名 */
  const fix = (n, parent, idx) => {
    (n.children || []).forEach((c, i) => fix(c, n, i));
    if (n.type !== 'tag' || n.name !== 'mo') return;
    const t = textOf(n);
    if (!/^[A-Za-z]{2,}$/.test(t) || t === 'mod') return;
    const pn = parent && parent.name;
    if (['munder', 'munderover', 'mover'].includes(pn) && idx === 0) return;          // lim、max 下面带条件：保持算子
    const mi = new Element('mi', { mathvariant: 'normal' }, [new Text(t)]);
    if (['msub', 'msup', 'msubsup'].includes(pn)) { parent.children[idx] = mi; mi.parent = parent; return; }
    const nx = parent.children.slice(idx + 1).find(c => c.type === 'tag');
    if (nx && ((nx.name === 'mrow' && nx.attribs['data-mjx-texclass'] === 'ORD') || (nx.name === 'mo' && OPEN.has(textOf(nx))))) { mi.attribs['data-mjx-texclass'] = 'ORD'; parent.children[idx] = mi; mi.parent = parent; return; }   // gcd(a, b)：函数名紧贴括号
    const af = new Element('mo', {}, [new Text('\u2061')]);
    parent.children.splice(idx, 1, mi, af); mi.parent = af.parent = parent;
  };
  const root = { type: 'root', children: doc.children };
  for (let pass = 0; pass < 1; pass++) {
    /* splice 会改变下标，从后往前处理 */
    const stack = [root];
    const all = [];
    while (stack.length) { const x = stack.pop(); all.push(x); (x.children || []).forEach(c => stack.push(c)); }
    for (const x of all.reverse()) if (x.children) for (let i = x.children.length - 1; i >= 0; i--) {
      const c = x.children[i];
      if (c.type === 'tag' && c.name === 'mo' && /^[A-Za-z]{2,}$/.test(textOf(c))) fix(c, x, i);
    }
  }
  return render(doc.children, { xmlMode: false, selfClosingTags: true, encodeEntities: 'utf8' });
}
const textOf = n => (n.children || []).map(c => c.type === 'text' ? c.data : textOf(c)).join('');

/* ---------- Markdown 部分 ---------- */
function mdToHtml(s) {
  s = s.replace(/^-# (.*)$/gm, '@@small@@$1');
  let h = md.render(s);
  h = h.replace(/<p>@@small@@/g, '<p class="small">').replace(/@@small@@/g, '')
    .replace(/<blockquote>/g, '<div class="tip">').replace(/<\/blockquote>/g, '</div>')
    .replace(/<table>/g, '<div class="tt-wrap"><table class="tt">').replace(/<\/table>/g, '</table></div>')
    .replace(/<td(?: style="[^"]*")?>(T|F)<\/td>/g, (m, v) => `<td class="${v === 'T' ? 'vt' : 'vf'}">${v}</td>`)
    .replace(/ style="text-align:(left|right|center)"/g, '');
  return h;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function assemble(s, math) {
  let h = mdToHtml(s);
  const put = (x) => x.err ? `<code class="mjerr" title="${esc(x.err)}">${esc(x.display ? `$$ ${x.f} $$` : `$${x.f}$`)}</code>`
    : x.display ? x.mml.replace(/^<math/, '<math display="block"').replace('<math display="block" display="block"', '<math display="block"') : x.mml;
  h = h.replace(/<p>@@m(\d+)@@<\/p>/g, (m, i) => math[+i].display && !math[+i].err ? `<div class="dm">${put(math[+i])}</div>` : `<p>${put(math[+i])}</p>`);
  h = h.replace(/@@m(\d+)@@/g, (m, i) => put(math[+i]));
  return h.trim();
}

/* 单篇：返回 { html, errors: [{ formula, msg }] } */
async function renderSrc(src) {
  const { s, math } = extract(src);
  const res = math.length ? await compileFormulas(math) : [];
  return { html: assemble(s, res), errors: res.filter(x => x.err).map(x => ({ formula: x.f, msg: x.err })) };
}
/* 很多篇一起编译（导入整门课时用），返回同样结构的数组 */
async function renderMany(srcs, chunk = 3000) {
  const parts = srcs.map(extract), all = [];
  parts.forEach((p, k) => p.math.forEach((x, j) => all.push({ ...x, k, j })));
  const done = [];
  for (let i = 0; i < all.length; i += chunk) done.push(...await compileFormulas(all.slice(i, i + chunk)));
  const per = parts.map(p => new Array(p.math.length));
  done.forEach(x => { per[x.k][x.j] = x; });
  return parts.map((p, k) => ({ html: assemble(p.s, per[k]), errors: per[k].filter(x => x.err).map(x => ({ formula: x.f, msg: x.err })) }));
}
/* 纯文字（搜索用）：去掉 Markdown 符号，公式保留源码 */
const plainText = src => String(src || '').replace(/\$\$?([^$]*)\$\$?/g, ' $1 ').replace(/[*_>|#`-]+/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = { render: renderSrc, renderMany, latexProblem, plainText, TYPST };
