'use strict';
/* 把「我的讲义」转成 LaTeX，并在服务器上用 xelatex 编译成 PDF。
   内存控制：同一时间只编译一份（xelatex 约占 200MB），相同内容只编译一次，结果缓存在 data/pdf。 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFile } = require('node:child_process');
const { one, run, now } = require('./db');
const course = require('./course');
const { httpError } = require('./auth');

const OUT = path.join(__dirname, '..', 'data', 'pdf');
fs.mkdirSync(OUT, { recursive: true });
const FIGDIR = path.join(__dirname, '..', 'public', 'fig');
const CJK_FONT = process.env.TEX_CJK_FONT || 'Noto Serif CJK SC';
const CJK_SANS = process.env.TEX_CJK_SANS || 'Noto Sans CJK SC';

/* 正文外出现的符号 → LaTeX */
const SYM = {
  '…': '\\ldots{}', '⋯': '$\\cdots$', '⇒': '$\\Rightarrow$', '⇔': '$\\Leftrightarrow$', '→': '$\\to$', '∧': '$\\wedge$', '∨': '$\\vee$',
  '≥': '$\\geq$', '≤': '$\\leq$', '≠': '$\\neq$', '∀': '$\\forall$', '∃': '$\\exists$', '∈': '$\\in$', '∩': '$\\cap$', '∪': '$\\cup$',
  '⊂': '$\\subset$', '⋂': '$\\bigcap$', '⋃': '$\\bigcup$', '×': '$\\times$', '∅': '$\\varnothing$', '∏': '$\\prod$', '∼': '$\\sim$',
  '≁': '$\\not\\sim$', '∘': '$\\circ$', '√': '$\\surd$', '∞': '$\\infty$', '·': '$\\cdot$', '−': '$-$', '–': '--',
  'ℕ': '$\\mathbb{N}$', 'ℤ': '$\\mathbb{Z}$', 'ℚ': '$\\mathbb{Q}$', 'ℝ': '$\\mathbb{R}$', 'ℂ': '$\\mathbb{C}$', '𝒫': '$\\mathcal{P}$',
  'π': '$\\pi$', 'ε': '$\\varepsilon$', 'θ': '$\\theta$', 'ζ': '$\\zeta$', 'φ': '$\\varphi$', '⌈': '$\\lceil$', '⌉': '$\\rceil$',
  '²': '\\textsuperscript{2}', '¹': '\\textsuperscript{1}', 'ⁿ': '\\textsuperscript{$n$}', '⁻': '\\textsuperscript{$-$}', 'ᶜ': '\\textsuperscript{$c$}',
  'ᵢ': '\\textsubscript{$i$}', 'ⱼ': '\\textsubscript{$j$}', 'ₙ': '\\textsubscript{$n$}', '₁': '\\textsubscript{1}', '\u0304': '',
  'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V', 'Ⅵ': 'VI', 'ξ': '$\\xi$', 'λ': '$\\lambda$', 'α': '$\\alpha$', 'β': '$\\beta$', 'ᵀ': '\\textsuperscript{T}', '′': '$\'$', '⁰': '\\textsuperscript{0}', '³': '\\textsuperscript{3}', '⁴': '\\textsuperscript{4}', '✓': '$\\checkmark$', '⟺': '$\\iff$', '⟹': '$\\implies$', '⊥': '$\\perp$', '∥': '$\\parallel$', '⁺': '\\textsuperscript{+}', 'ˣ': '\\textsuperscript{$\\times$}', 'ˡ': '\\textsuperscript{$l$}', 'ᵏ': '\\textsuperscript{$k$}', '≡': '$\\equiv$', '≅': '$\\cong$', 'Σ': '$\\Sigma$', 'ψ': '$\\psi$', '∣': '$\\mid$', '∤': '$\\nmid$', '★': '$\\star$', '☆': '$\\star$', '①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '⑤': '(5)', '⑥': '(6)'
};
const FORBID = /\\(input|include|write|immediate|openin|openout|read|catcode|def|edef|gdef|xdef|let|newcommand|renewcommand|providecommand|usepackage|special|directlua|csname|endcsname|loop|repeat|lowercase|uppercase|scantokens|expandafter|jobname|everyjob|documentclass|begin\s*\{document\}|end\s*\{document\})(?![A-Za-z])/;

function escText(s) {
  s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  s = s.replace(/[\\{}#%&_^~$<>]/g, c => ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '#': '\\#', '%': '\\%', '&': '\\&', '_': '\\_', '^': '\\^{}', '~': '\\~{}', '$': '\\$', '<': '\\textless{}', '>': '\\textgreater{}' }[c]));
  return [...s].map(ch => SYM[ch] !== undefined ? SYM[ch] : ch).join('');
}
function mathOk(m) {
  if (FORBID.test(m)) throw httpError(400, '公式里含有不允许的命令');
  return m.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\\\\(\s*)\[(?!\s*-?\d*\.?\d+\s*(?:pt|em|ex|mm|cm)\s*\])/g, '\\\\{}$1[')   // \\[ 会被当成换行带长度（真的写了长度的除外）
    .replace(/\\begin\{(aligned|alignedat|split)\}((?:\[[a-z]\])?(?:\{\d+\})?)(\s*)&/g, '\\begin{$1}$2$3{}&')   // 第一列空着时，部分 TeX Live 版本会报错
    .replace(/[①②③④⑤⑥⑦⑧⑨]/g, c => `\\text{(${'①②③④⑤⑥⑦⑧⑨'.indexOf(c) + 1})}`);
}

/* HTML（白名单标签）+ $公式$ → LaTeX。refFn(id) 给出 [[id]] 引用的文字 */
function htmlToTex(html, refFn) {
  const math = [];
  let s = String(html || '').replace(/\$\$([\s\S]*?)\$\$/g, (m, x) => { math.push(`\\[${mathOk(x)}\\]`); return `\u0000${math.length - 1}\u0000`; })
    .replace(/\$([^$]+?)\$/g, (m, x) => { math.push(`$${mathOk(x)}$`); return `\u0000${math.length - 1}\u0000`; })
    .replace(/\[\[((?:[a-z0-9-]+:)?\w+)\]\]/g, (m, id) => { math.push(refFn(id)); return `\u0000${math.length - 1}\u0000`; });
  const out = [];
  let tableCols = 0, cell = 0;
  const lists = [], divs = [];
  const parts = s.split(/(<\/?[a-zA-Z0-9]+[^>]*>)/);
  for (const part of parts) {
    const t = /^<(\/?)([a-zA-Z0-9]+)([^>]*)>$/.exec(part);
    if (!t) { out.push(escText(part)); continue; }
    const [, close, tagRaw, attrs] = t, tag = tagRaw.toLowerCase(), small = /class="[^"]*small/.test(attrs);
    switch (tag) {
      case 'p': out.push(close ? (out.smallP ? '}\\par\n' : '\\par\n') : (small ? (out.smallP = true, '{\\small\\color{gray} ') : (out.smallP = false, ''))); if (close) out.smallP = false; break;
      case 'ul': out.push(close ? '\\end{itemize}\n' : '\\begin{itemize}\n'); break;
      case 'ol':
        if (close) { const k = lists.pop(); out.push(k === 'plain' ? '\\end{itemize}\n' : '\\end{enumerate}\n'); }
        else { const plainL = /class="[^"]*plain/.test(attrs); lists.push(plainL ? 'plain' : 'ol'); out.push(plainL ? '\\begin{itemize}\n' : '\\begin{enumerate}\n'); }
        break;
      case 'li': if (!close) out.push(lists[lists.length - 1] === 'plain' ? '\\item[] ' : '\\item '); else out.push('\n'); break;
      case 'div':
        if (close) { if (divs.pop()) out.push('\\end{quote}\n'); }
        else { const tip = /class="[^"]*tip/.test(attrs); divs.push(tip); if (tip) out.push('\n\\begin{quote}\\small\n'); }
        break;
      case 'img': {
        const m = /src="\/fig\/([\w\/-]+)\.svg"/.exec(attrs);
        const f = m && path.join(FIGDIR, m[1] + '.pdf');
        if (f && f.startsWith(FIGDIR) && fs.existsSync(f)) out.push(`\n\\begin{center}\\IfFileExists{${f}}{\\includegraphics[width=0.5\\linewidth]{${f}}}{[图]}\\end{center}\n`);
        break;
      }
      case 'table': if (close) out.push('\\hline\\end{tabular}\\end{center}\n'); else { out.push('\u0001TABLE\u0001'); tableCols = 0; } break;
      case 'tr': if (close) { out.push('\\\\\n'); if (!tableCols) tableCols = cell; } else { cell = 0; out.push(tableCols ? '' : ''); } break;
      case 'th': case 'td': if (!close) { if (cell) out.push(' & '); cell++; if (tag === 'th') out.push('\\textbf{'); } else if (tag === 'th') out.push('}'); break;
      case 'thead': if (close) out.push('\\hline\n'); break;
      case 'strong': case 'b': out.push(close ? '}' : '\\textbf{'); break;
      case 'em': case 'i': out.push(close ? '}' : '\\emph{'); break;
      case 'sub': out.push(close ? '}' : '\\textsubscript{'); break;
      case 'sup': out.push(close ? '}' : '\\textsuperscript{'); break;
      case 'br': out.push('\\\\'); break;
      default: break;            // div、span、tbody 只是容器
    }
  }
  let tex = out.join('');
  /* 表格的列数在读完第一行后才知道，这里补上 tabular 开头 */
  tex = tex.replace(/\u0001TABLE\u0001([\s\S]*?)(\\hline\\end\{tabular\})/g, (m, rows, end) => {
    const cols = Math.max(1, ...rows.split('\\\\\n').map(r => (r.match(/ & /g) || []).length + 1));
    return `\\begin{center}\\begin{tabular}{|${'c|'.repeat(cols)}}\\hline\n${rows}${end}`;
  });
  tex = tex.replace(/\u0000(\d+)\u0000/g, (m, i) => math[+i]);
  return tex.replace(/\n{3,}/g, '\n\n');
}

/* 标题里可以有 $公式$ */
const titleTex = t => String(t || '').split(/(\$[^$]+\$)/).map((x, i) => i % 2 ? `$${mathOk(x.slice(1, -1))}$` : escText(x)).join('');
const KIND = { axiom: '公理', def: '定义', thm: '定理', prop: '性质', method: '方法', note: '注记', example: '例题', exercise: '练习' };
async function buildTex(slug, { hand, refs, tpl, title }) {
  const st = await course.load(slug);
  if (!st) throw httpError(404, '课程不存在');
  if (!Array.isArray(hand) || !hand.length) throw httpError(400, '讲义是空的');
  if (hand.length > 400) throw httpError(400, '讲义太长了，请分成几份');
  const T = tpl !== 'student';
  const num = {}, app = {};
  hand.forEach((x, i) => { if (!st.N[x.id]) throw httpError(400, `节点「${x.id}」不存在`); num[x.id] = i + 1; });
  (refs || []).forEach((id, i) => { if (st.N[id]) app[id] = i + 1; });
  const label = id => num[id] ? `${KIND[st.N[id].type]} ${num[id]}` : app[id] ? `附录 A${app[id]}` : null;
  const extName = id => { const e = st.ext && st.ext[id]; return e ? `《${escText(e.courseTitle)}》${titleTex(e.title)}` : escText(id); };
  const refFn = id => {
    if (course.isExt(id)) return extName(id);
    if (!st.N[id]) return escText(id);
    const l = label(id), name = titleTex(st.N[id].title);
    return l ? `\\hyperref[n:${id}]{${name}（${l}）}` : `${name}（未收录）`;
  };
  const starsTex = k => k ? `\\quad{\\color{gray}\\footnotesize${'$\\star$'.repeat(k)}}` : '';
  const head = (kind, n, ttl, id, color, imp) => `\\par\\medskip\\noindent\\phantomsection\\label{n:${id}}{\\sffamily\\bfseries\\color{${color}}${kind} ${n}}\\quad{\\bfseries ${titleTex(ttl)}}${starsTex(imp)}\\par\\nopagebreak\n`;
  const color = t => ({ def: 'ckdef', axiom: 'ckdef', method: 'ckmethod', example: 'black', exercise: 'black', note: 'gray' }[t] || 'ckthm');
  let body = '';
  for (const x of hand) {
    const n = st.N[x.id], q = course.isQ(n.type);
    if (T && x.note) body += `\\begin{quote}\\small\\color{gray}${htmlToTex(String(x.note).replace(/\n/g, ' '), refFn)}\\end{quote}\n`;
    const imp = [1, 2, 3].includes(x.imp) ? x.imp : n.imp;
    body += head(KIND[n.type], num[x.id], n.title.replace(/^(例|练习)：/, ''), x.id, color(n.type), T ? imp : 0);
    const vs = n.variants || [], vi = Number.isInteger(x.v) && x.v > 0 && vs[x.v - 1] ? x.v : 0;
    body += htmlToTex(vi ? vs[vi - 1].body : n.body, refFn) + '\n';
    if (T && vs.length) body += `\\par{\\footnotesize\\color{gray}这里用的是「${escText(vi ? vs[vi - 1].name : '原定义')}」；另有 ${vs.length} 种等价说法，见网站。}\n`;
    const ps = course.proofsOf(n);
    const p = x.p === -1 ? null : ps[Number.isInteger(x.p) ? x.p : 0];
    if (p && (T || q)) {
      body += `\\begin{proof}[${q ? '解' : '证明'}]\n${htmlToTex(p.body, refFn)}\n`;
      if (T && p.deps.length) body += `\\par{\\footnotesize\\color{gray}依据：${p.deps.map(d => course.isExt(d) ? extName(d) : label(d) || (st.N[d] ? titleTex(st.N[d].title) + '（未收录）' : escText(d))).join('，')}}\n`;
      body += '\\end{proof}\n';
    }
  }
  if (refs && refs.length) {
    body += '\\section*{附录：引用到的结论}\n';
    for (const id of refs) if (st.N[id]) body += head('A', app[id], st.N[id].title, id, color(st.N[id].type)) + htmlToTex(st.N[id].body, refFn) + '\n';
  }
  const docTitle = escText(String(title || '我的讲义').slice(0, 40));
  return `% 由 maki-math 生成：${st.meta.title}，${T ? '教师版' : '学生版'}
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.4cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm,mathtools,graphicx}
\\providecommand{\\xlongequal}[1]{\\overset{#1}{=\\!=\\!=}}
\\providecommand{\\overparen}[1]{\\overset{\\frown}{#1}}
\\providecommand{\\oiint}{\\mathop{\\rlap{\\kern.18em$\\displaystyle\\bigcirc$}\\displaystyle\\iint}}
\\usepackage{xeCJK}
\\setCJKmainfont{${CJK_FONT}}
\\setCJKsansfont{${CJK_SANS}}
\\usepackage{xcolor}
\\definecolor{ckdef}{HTML}{2350C6}\\definecolor{ckthm}{HTML}{C22D25}\\definecolor{ckmethod}{HTML}{7340BF}
\\usepackage[hidelinks]{hyperref}
\\renewcommand{\\qedsymbol}{$\\square$}
\\setlength{\\parindent}{0pt}\\setlength{\\parskip}{4pt}
\\linespread{1.25}
\\title{${docTitle}}\\author{${escText(st.meta.title)} · ${T ? '教师版' : '学生版'}}\\date{maki-math.com}
\\begin{document}
\\maketitle
${body}
\\end{document}
`;
}

/* ---------- 编译队列 ---------- */
const queue = [];
let busy = false;
function compile(tex, hash, kind) {
  if (kind === 'typ') return compileTyp(tex, hash);
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(OUT, 'job-'));
    fs.writeFileSync(path.join(dir, 'main.tex'), tex);
    const env = { ...process.env, openin_any: 'p', openout_any: 'p', shell_escape: 'f' };
    let runs = 0;
    const once = () => {
      const p = spawn('xelatex', ['-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', 'main.tex'], { cwd: dir, env });
      let log = '';
      p.stdout.on('data', d => { log += d; if (log.length > 200000) log = log.slice(-100000); });
      const timer = setTimeout(() => p.kill('SIGKILL'), 60_000);
      p.on('close', code => {
        clearTimeout(timer);
        if (code !== 0) { cleanup(); return reject(new Error((log.match(/^! .*$/m) || ['编译失败'])[0])); }
        if (++runs < 2) return once();
        fs.renameSync(path.join(dir, 'main.pdf'), path.join(OUT, `${hash}.pdf`));
        cleanup(); resolve();
      });
    };
    const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
    once();
  });
}
/* 新写法的课程：用 Typst 编译（一次就好，通常不到一秒） */
function compileTyp(src, hash) {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(OUT, 'job-'));
    fs.writeFileSync(path.join(dir, 'main.typ'), src);
    /* 讲义里用到的图：从 public/fig 复制进来（Typst 只能读编译目录里的文件） */
    for (const m of src.matchAll(/image\("(fig\/[\w\/-]+\.(?:svg|png|jpg))"/g)) {
      const from = path.join(FIGDIR, m[1].slice(4));
      if (from.startsWith(FIGDIR) && fs.existsSync(from)) { fs.mkdirSync(path.dirname(path.join(dir, m[1])), { recursive: true }); fs.copyFileSync(from, path.join(dir, m[1])); }
    }
    const { TYPST } = require('./render');
    execFile(TYPST, ['compile', '--diagnostic-format', 'short', '--root', dir, 'main.typ', 'main.pdf'], { cwd: dir, timeout: 60_000, env: { PATH: process.env.PATH, HOME: dir } }, (err, stdout, stderr) => {
      try {
        if (err) return reject(new Error((String(stderr).split('\n').find(l => l.includes('error')) || '编译失败').slice(0, 300)));
        fs.renameSync(path.join(dir, 'main.pdf'), path.join(OUT, `${hash}.pdf`));
        resolve();
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    });
  });
}
async function pump() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  await run("UPDATE pdf_jobs SET status = 'running' WHERE id = ?", job.id);
  try { await compile(job.tex, job.hash, job.kind); await run("UPDATE pdf_jobs SET status = 'done' WHERE id = ?", job.id); }
  catch (e) { await run("UPDATE pdf_jobs SET status = 'error', error = ? WHERE id = ?", String(e.message).slice(0, 300), job.id); }
  busy = false;
  prune();
  setImmediate(pump);
}
function prune() {
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.pdf')).map(f => ({ f, t: fs.statSync(path.join(OUT, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  files.slice(500).forEach(x => fs.rmSync(path.join(OUT, x.f), { force: true }));
}
async function enqueue(tex, userId, kind) {
  const hash = crypto.createHash('sha256').update((kind || 'tex') + tex).digest('hex').slice(0, 32);
  const id = crypto.randomBytes(8).toString('hex');
  if (fs.existsSync(path.join(OUT, `${hash}.pdf`))) {
    await run("INSERT INTO pdf_jobs(id,hash,user_id,status,created_at) VALUES (?,?,?,'done',?)", id, hash, userId ?? null, now());
    return { id, position: 0 };
  }
  if (queue.length >= 30) throw httpError(503, '现在生成 PDF 的人太多了，请过几分钟再试');
  await run("INSERT INTO pdf_jobs(id,hash,user_id,status,created_at) VALUES (?,?,?,'queued',?)", id, hash, userId ?? null, now());
  queue.push({ id, hash, tex, kind });
  const position = queue.length + (busy ? 1 : 0);
  setImmediate(pump);
  return { id, position };
}
async function jobStatus(id) {
  const j = await one('SELECT * FROM pdf_jobs WHERE id = ?', id);
  if (!j) return null;
  const pos = queue.findIndex(q => q.id === id);
  return { status: j.status, error: j.error, position: pos < 0 ? 0 : pos + 1, file: j.status === 'done' ? path.join(OUT, `${j.hash}.pdf`) : null };
}

module.exports = { buildTex, htmlToTex, enqueue, jobStatus, escText };
