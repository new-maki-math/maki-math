# -*- coding: utf-8 -*-
"""把考研数学讲义（frag_final/*.tex）和真题分类精解（parts/ + solutions/）转成平台课程数据。

用法：python3 convert.py <讲义 frag_final 目录> <kaoyan-zhenti 目录> <输出 data.js>
输出的 data.js 定义 B（泡泡树）、N（节点）、CH_EDGES、CH_POS，由 server/seed.js 读入。
"""
import os, json, os, re, sys, glob, collections

FRAG, ZT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
UNKNOWN = collections.Counter()

# ───────────────────────── 基础：读花括号、方括号 ─────────────────────────
def read_group(s, i, o='{', c='}'):
    """s[i] 应为 o；返回 (内容, 结束后的下标)。"""
    assert s[i] == o, (s[i:i + 30])
    depth, j = 0, i
    while j < len(s):
        ch = s[j]
        if ch == '\\':
            j += 2; continue
        if ch == o: depth += 1
        elif ch == c:
            depth -= 1
            if depth == 0: return s[i + 1:j], j + 1
        j += 1
    raise ValueError('括号不配对：' + s[i:i + 60])

def skip_ws(s, i):
    while i < len(s) and s[i] in ' \t\n': i += 1
    return i

def read_args(s, i, n, opt_first=False):
    """读 n 个 {…} 参数（之前可有一个可选 […]）。返回 (opt, [args], 结束下标)。"""
    opt = None
    j = skip_ws(s, i) if opt_first else i
    if opt_first and j < len(s) and s[j] == '[':
        opt, j = read_group(s, j, '[', ']')
    else:
        j = i
    args = []
    for _ in range(n):
        j = skip_ws(s, j)
        if j < len(s) and s[j] == '{':
            a, j = read_group(s, j)
        else:  # 单个记号参数
            m = re.match(r'\\[a-zA-Z]+|.', s[j:])
            a, j = m.group(0), j + len(m.group(0))
        args.append(a)
    return opt, args, j

def replace_cmd(s, name, n, fn, opt=False):
    """把 \\name{a1}..{an} 换成 fn(opt, args)。"""
    out, i, pat = [], 0, re.compile(r'\\' + name + r'(?![a-zA-Z])')
    while True:
        m = pat.search(s, i)
        if not m: out.append(s[i:]); break
        out.append(s[i:m.start()])
        try:
            o, args, j = read_args(s, m.end(), n, opt)
        except Exception:
            out.append(m.group(0)); i = m.end(); continue
        out.append(fn(o, args)); i = j
    return ''.join(out)

# ───────────────────────── 数学：宏展开 ─────────────────────────
SIMPLE = {
    'rk': r'\operatorname{r}', 'rank': r'\operatorname{r}', 'tr': r'\operatorname{tr}', 'diag': r'\operatorname{diag}',
    'sgn': r'\operatorname{sgn}', 'Cov': r'\operatorname{Cov}', 'Var': r'\operatorname{D}', 'EE': r'\operatorname{E}',
    'Prob': r'\operatorname{P}', 'E': r'\mathrm{E}', 'D': r'\mathrm{D}', 'P': r'\mathrm{P}', 'aeq': r'\sim',
    'ba': r'\boldsymbol{\alpha}', 'bb': r'\boldsymbol{\beta}', 'bxi': r'\boldsymbol{\xi}',
    'dif': r'\mathrm{d}', 'e': r'\mathrm{e}', 'ii': r'\mathrm{i}',
    'R': r'\mathbb{R}', 'N': r'\mathbb{N}', 'Z': r'\mathbb{Z}', 'Q': r'\mathbb{Q}', 'C': r'\mathbb{C}',
    'tiankong': r'\underline{\qquad\qquad}', 'geqslant': r'\geq', 'leqslant': r'\leq',
}
CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

def expand_macros(s):
    for name in ['vv', 'vt', 'mat', 'matup', 'symbf', 'symbfup', 'bm']:
        s = replace_cmd(s, name, 1, lambda o, a: r'\boldsymbol{' + a[0] + '}')
    s = replace_cmd(s, 'md', 1, lambda o, a: r'\left|' + a[0] + r'\right|')
    s = replace_cmd(s, 'abs', 1, lambda o, a: r'\left|' + a[0] + r'\right|')
    s = replace_cmd(s, 'norm', 1, lambda o, a: r'\left\|' + a[0] + r'\right\|')
    s = replace_cmd(s, 'pdd', 2, lambda o, a: r'\frac{\partial^2 ' + a[0] + r'}{\partial ' + a[1] + '^2}')
    s = replace_cmd(s, 'pd', 2, lambda o, a: r'\frac{\partial ' + a[0] + r'}{\partial ' + a[1] + '}')
    s = replace_cmd(s, 'dd', 2, lambda o, a: r'\frac{\mathrm{d} ' + a[0] + r'}{\mathrm{d} ' + a[1] + '}')
    for name, env in [('bmat', 'bmatrix'), ('pmat', 'pmatrix'), ('vmat', 'vmatrix')]:
        s = replace_cmd(s, name, 1, lambda o, a, env=env: r'\begin{' + env + '}' + a[0] + r'\end{' + env + '}')
    def circ(o, a):
        x = re.sub(r'\\(footnotesize|small|scriptsize|tiny)\s*', '', a[0]).strip()
        return CIRC[int(x) - 1] if x.isdigit() and 0 < int(x) <= 20 else '(' + x + ')'
    s = replace_cmd(s, 'textcircled', 1, circ)
    for k, v in SIMPLE.items():
        # \mathrm{e} 这类加上花括号：\dfrac1\e 展开后仍是一个参数
        vv = '{' + v + '}' if v.startswith(('\\mathrm', '\\mathbb', '\\boldsymbol')) else v
        s = re.sub(r'\\' + k + r'(?![a-zA-Z])', lambda m, v=vv: v, s)
    return s

def clean_math(m):
    m = re.sub(r'\\label\{[^}]*\}', '', m)
    m = m.replace(r'\nonumber', '').replace(r'\notag', '')
    m = re.sub(r'(?<!\\)%.*', '', m)
    m = m.replace('\\joinrel', '\\!\\!').replace('\\xlongrightarrow', '\\xrightarrow').replace('\\xlongleftarrow', '\\xleftarrow')
    m = re.sub(r'\\emph\{([^{}]*)\}', r'\1', m)
    m = re.sub(r'\\renewcommand\{\\arraystretch\}\{[^{}]*\}', '', m)
    return m.strip()

def strip_tags_in_aligned(m):
    return re.sub(r'\\tag\*?\{([^}]*)\}', r'\\qquad(\1)', m)

# ───────────────────────── 文本 → HTML ─────────────────────────
def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ']

class Conv:
    def __init__(self):
        self.ph = []
    def put(self, html):
        self.ph.append(html); return '\u0001%d\u0002' % (len(self.ph) - 1)
    def restore(self, s):
        for _ in range(4):
            s = re.sub('\u0001(\\d+)\u0002', lambda m: self.ph[int(m.group(1))], s)
        return s

    # 1. 抽出数学
    def protect_math(self, s):
        envs = r'equation\*?|align\*?|gather\*?|multline\*?|displaymath|alignat\*?'
        def env_rep(m):
            name, body = m.group(1), m.group(2)
            body = clean_math(body)
            if name.startswith('align') or name.startswith('multline'):
                body = r'\begin{aligned}' + strip_tags_in_aligned(re.sub(r'^\{\d+\}', '', body)) + r'\end{aligned}'
            elif name.startswith('gather'):
                body = r'\begin{gathered}' + strip_tags_in_aligned(body) + r'\end{gathered}'
            return self.put('$$' + body + '$$')
        s = re.sub(r'\\begin\{(' + envs + r')\}(.*?)\\end\{\1\}', env_rep, s, flags=re.S)
        s = re.sub(r'(?<!\\)\\\[(.*?)(?<!\\)\\\]', lambda m: self.put('$$' + clean_math(m.group(1)) + '$$'), s, flags=re.S)
        s = re.sub(r'(?<!\\)\$\$(.*?)(?<!\\)\$\$', lambda m: self.put('$$' + clean_math(m.group(1)) + '$$'), s, flags=re.S)
        s = re.sub(r'\\\((.*?)\\\)', lambda m: self.put('$' + clean_math(m.group(1)) + '$'), s, flags=re.S)
        # 行内 $…$：逐字扫描，避开 \$
        out, i, n = [], 0, len(s)
        while i < n:
            ch = s[i]
            if ch == '\\' and i + 1 < n:
                out.append(s[i:i + 2]); i += 2; continue
            if ch == '$':
                j = i + 1
                dep = 0
                while j < n:
                    if s[j] == '\\': j += 2; continue
                    if s[j] == '{': dep += 1
                    elif s[j] == '}': dep -= 1
                    elif s[j] == '$' and dep <= 0: break
                    j += 1
                out.append(self.put('$' + clean_math(s[i + 1:j]) + '$')); i = j + 1; continue
            out.append(ch); i += 1
        return ''.join(out)

    # 2. 块级环境
    def blocks(self, s):
        # 列表
        def list_rep(m):
            kind, opt, body = m.group(1), m.group(2) or '', m.group(3)
            lab = None
            mm = re.search(r'label=\{?\(?\\(Roman|roman|arabic|alph|Alph)\*\)?', opt)
            if mm: lab = mm.group(1)
            paren = '(' in opt
            items = re.split(r'\\item(?![a-zA-Z])', body)[1:]
            lis = []
            for k, it in enumerate(items):
                it = it.strip()
                io = re.match(r'^\[([^\]]*)\]', it)
                pre = ''
                if io: pre = io.group(1) + ' '; it = it[io.end():]
                elif lab:
                    t = {'Roman': ROMAN[k] if k < 10 else str(k + 1), 'roman': str(k + 1), 'arabic': str(k + 1),
                         'alph': chr(97 + k), 'Alph': chr(65 + k)}[lab]
                    pre = ('(' + t + ')' if paren else t + '.') + ' '
                lis.append('<li>' + esc_text(pre) + self.inline(self.blocks(it)) + '</li>')
            if lab:
                return self.put('<ol class="plain">' + ''.join(lis) + '</ol>')
            return self.put(('<ol>' if kind == 'enumerate' else '<ul>') + ''.join(lis) + ('</ol>' if kind == 'enumerate' else '</ul>'))
        prev = None
        while prev != s:  # 由内而外
            prev = s
            s = re.sub(r'\\begin\{(itemize|enumerate)\}(\[[^\]]*\])?((?:(?!\\begin\{(?:itemize|enumerate)\}).)*?)\\end\{\1\}', list_rep, s, flags=re.S)
        # 表格
        def tab_rep(m):
            body = m.group(2)
            body = re.sub(r'\\endfirsthead.*?\\endhead', '', body, flags=re.S)
            body = re.sub(r'\\(toprule|midrule|bottomrule|hline|endhead|endfirsthead|endfoot|endlastfoot)', '', body)
            body = re.sub(r'\\cline\{[^}]*\}|\\cmidrule(\([^)]*\))?\{[^}]*\}', '', body)
            rows = [r for r in re.split(r'\\\\(?:\[[^\]]*\])?', body) if r.strip()]
            trs = []
            for r in rows:
                cells = re.split(r'(?<!\\)&', r)
                tds = []
                for c in cells:
                    c = replace_cmd(c, 'multicolumn', 3, lambda o, a: a[2])
                    tds.append('<td>' + self.inline(c.strip()) + '</td>')
                trs.append('<tr>' + ''.join(tds) + '</tr>')
            return self.put('<table><tbody>' + ''.join(trs) + '</tbody></table>')
        s = re.sub(r'\\begin\{(tabular|longtable|tabularx|array)\}(?:\[[^\]]*\])?\{(?:[^{}]|\{[^{}]*\})*\}(.*?)\\end\{\1\}',
                   tab_rep, s, flags=re.S)
        # 不需要的外壳
        s = re.sub(r'\\begin\{(center|minipage|flushleft|flushright|small|footnotesize)\}(\{[^}]*\})?', '', s)
        s = re.sub(r'\\end\{(center|minipage|flushleft|flushright|small|footnotesize)\}', '', s)
        s = re.sub(r'\\begingroup|\\endgroup', '', s)
        # 图
        s = replace_cmd(s, 'tu', 1, lambda o, a: self.put('<img src="/fig/ky/' + a[0].strip() + '.svg" alt="图">'))
        s = re.sub(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', '', s, flags=re.S)
        # 选项
        def opts(o, a):
            return self.put('<ol class="plain">' + ''.join(
                '<li>(' + 'ABCD'[k] + ') ' + self.inline(x.strip()) + '</li>' for k, x in enumerate(a)) + '</ol>')
        for nm in ['kztxuanxiangI', 'xuanxiangIV', 'xuanxiangII', 'xuanxiang', 'kztmaxopt']:
            s = replace_cmd(s, nm, 4, opts)
        s = replace_cmd(s, 'daan', 1, lambda o, a: self.put('<p><strong>答案：</strong>' + self.inline(a[0]) + '</p>'))
        return s

    # 3. 行内命令
    def inline(self, s):
        s = re.sub(r'\\(noindent|par|medskip|smallskip|bigskip|centering|raggedright|hfill|nopagebreak|newpage|clearpage|small|footnotesize|scriptsize|normalsize|large|Large|sffamily|bfseries|itshape|selectfont|relax|null|leavevmode)(?![a-zA-Z])', ' ', s)
        s = re.sub(r'\\(vspace|hspace|addvspace)\*?\{[^}]*\}', ' ', s)
        s = re.sub(r'\\setlength\{[^}]*\}\{[^}]*\}|\\renewcommand\{\\arraystretch\}\{[^}]*\}', '', s)
        s = re.sub(r'\\(label|index|pageref|ref)\{[^}]*\}', '', s)
        s = re.sub(r'\\color\{[^}]*\}', '', s)
        s = replace_cmd(s, 'textcolor', 2, lambda o, a: a[1])
        s = replace_cmd(s, 'colorbox', 2, lambda o, a: a[1])
        for nm, tag in [('textbf', 'strong'), ('emph', 'em'), ('textit', 'em'), ('underline', 'em'), ('textsl', 'em')]:
            s = replace_cmd(s, nm, 1, lambda o, a, tag=tag: '<' + tag + '>' + self.inline(a[0]) + '</' + tag + '>')
        for nm in ['text', 'mbox', 'textrm', 'textsf', 'texttt', 'textnormal', 'makebox', 'fbox']:
            s = replace_cmd(s, nm, 1, lambda o, a: self.inline(a[0]))
        tags = {'tONE': '仅数一', 'tOT': '数一三', 'tALL': '三卷通用', 'tTWO': '数二重点', 'tTHR': '仅数三'}
        for k, v in tags.items():
            s = re.sub(r'\\' + k + r'(?![a-zA-Z])', '〔' + v + '〕', s)
        s = re.sub(r'\\pos(?![a-zA-Z])', '<strong>本讲定位：</strong>', s)
        s = re.sub(r'\\yasuo(?![a-zA-Z])', '〔压缩讲〕', s)
        s = re.sub(r'\\zhongdian(?![a-zA-Z])', '〔重点讲〕', s)
        s = re.sub(r'\\sol(?![a-zA-Z])', '<strong>解．</strong>', s)
        s = re.sub(r'\\qed(?![a-zA-Z])', '■', s)
        s = re.sub(r'\\checkmark(?![a-zA-Z])', '✓', s)
        s = re.sub(r'\\(ldots|dots|cdots)(?![a-zA-Z])', '…', s)
        s = re.sub(r'\\\\(\[[^\]]*\])?|\\newline(?![a-zA-Z])', '<br>', s)
        s = s.replace(r'\%', '%').replace(r'\&', '&amp;').replace(r'\_', '_').replace(r'\#', '#').replace(r'\{', '{').replace(r'\}', '}')
        s = s.replace('---', '—').replace('--', '–').replace('``', '“').replace("''", '”')
        s = re.sub(r'\\(quad|qquad|enspace|,|;| )', ' ', s)
        s = s.replace('~', ' ')
        # 其余未知命令：记下来，保留参数内容
        def unk(m):
            UNKNOWN[m.group(1)] += 1
            if os.environ.get('UNKDBG') and UNKNOWN[m.group(1)] <= 2: print('UNK', m.group(1), repr(s[max(0,m.start()-80):m.end()+60]), file=sys.stderr)
            return ''
        s = re.sub(r'\\([a-zA-Z]+)\*?', unk, s)
        s = s.replace('{', '').replace('}', '')
        return s

def esc_text(t):
    return esc(t)

def tex_to_html(tex):
    """一段 LaTeX → HTML（$…$ 公式保留给 MathJax）。"""
    c = Conv()
    tex = expand_macros(tex)
    tex = re.sub(r'(?<!\\)%.*', '', tex)
    tex = replace_cmd(tex, 'lec', 4, lambda o, a: '\n\n\\textbf{L' + a[0] + '}\\quad ' + a[1] + '\\quad \\textbf{' + a[2] + '}\\\\\n' + a[3] + '\n\n')
    tex = re.sub(r'\\(sub)*section\*?\{([^{}]*)\}', lambda m: '\n\n\\textbf{' + m.group(2) + '}\n\n', tex)
    tex = re.sub(r'\\(cleardoublepage|clearpage|newpage|end\{document\})', '', tex)
    tex = re.sub(r'\\renewcommand\{\\arraystretch\}\{[^{}]*\}', '', tex)
    tex = c.protect_math(tex)
    # 数学之外的 < > & 先转义（占位符里的不动）
    tex = tex.replace('&', '\u0003').replace('<', '&lt;').replace('>', '&gt;')
    tex = tex.replace('\u0003', '&')
    tex = c.blocks(tex)
    # 段落：空行或块级占位符分段
    parts = re.split(r'\n\s*\n', tex)
    html = []
    for p in parts:
        # 块级占位符单独成段
        segs = re.split('(\u0001\\d+\u0002)', p)
        buf = ''
        for sg in segs:
            mm = re.fullmatch('\u0001(\\d+)\u0002', sg)
            if mm and re.match(r'<(ol|ul|table|img|p)\b', c.ph[int(mm.group(1))]):
                if buf.strip(): html.append('<p>' + c.inline(buf).strip() + '</p>')
                buf = ''; html.append(sg)
            elif mm and c.ph[int(mm.group(1))].startswith('$$'):
                if buf.strip(): html.append('<p>' + c.inline(buf).strip() + '</p>')
                buf = ''; html.append(sg)
            else:
                buf += sg
        if buf.strip():
            t = c.inline(buf).strip()
            if t: html.append('<p>' + t + '</p>')
    out = c.restore(''.join(html))
    out = re.sub(r'<p>\s*</p>', '', out)
    out = re.sub(r'[ \t\n]+', ' ', out)
    return out.strip()


def strip_title(t):
    t = tex_to_html(t)
    t = re.sub(r'<[^>]+>', '', t)
    return t.strip()

# ───────────────────────── 真题 ─────────────────────────
SUBJ = {'1': '数一', '2': '数二', '3': '数三'}
def src_text(ids):
    parts = []
    for i in ids:
        y, s, n = i.split('-')
        parts.append(f'{y} {SUBJ.get(s, s)} 第 {n} 题')
    return ' ＝ '.join(parts) + ('（跨卷同题）' if len(ids) > 1 else '')

def sol_html(pid):
    p = os.path.join(ZT, 'solutions', pid + '.tex')
    if not os.path.exists(p):
        return '<p>（详解待补）</p>'
    src = open(p, encoding='utf-8').read()
    out = []
    names = {'kaodiantip': '考点', 'xiangjie': '解', 'jielun': '结论', 'yicuo': '易错'}
    for m in re.finditer(r'\\begin\{(kaodiantip|xiangjie|jielun|yicuo)\}(?:\[([^\]]*)\])?(.*?)\\end\{\1\}', src, re.S):
        env, ttl, body = m.group(1), m.group(2), m.group(3)
        h = tex_to_html(body)
        label = (ttl or names[env]).strip()
        if env == 'xiangjie':
            out.append(f'<p><strong>{esc(label)}</strong></p>' + h)
        else:
            out.append(f'<div class="tip"><p><strong>{esc(label)}</strong></p>{h}</div>')
    return ''.join(out) or tex_to_html(src)

problems = {}       # 首个 id → 题目
by_any = {}         # 任一 id → 首个 id
lec_groups = {}     # 'L03' → [(考点名, 卷别, [首个 id…])]
for f in sorted(glob.glob(os.path.join(ZT, 'parts', 'P*', 'L*.tex'))):
    lec = os.path.basename(f)[:-4]
    src = open(f, encoding='utf-8').read()
    src = re.sub(r'\\begin\{chayin\}.*?\\end\{chayin\}', '', src, flags=re.S)
    groups = []
    cur = None
    pos = 0
    tokens = re.finditer(r'\\kaodian(\[[^\]]*\])?\{([^}]*)\}\{([^}]*)\}|\\begin\{zhenti\}\{([^}]*)\}(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?(.*?)\\end\{zhenti\}', src, re.S)
    for m in tokens:
        if m.group(2) is not None:
            cur = [strip_title(m.group(2)), m.group(3), []]; groups.append(cur); continue
        ids = [x.strip() for x in m.group(4).split(';') if x.strip()]
        pid = ids[0]
        if cur is None:
            cur = ['真题', '', []]; groups.append(cur)
        diff = int(m.group(6)) if (m.group(6) or '').strip().isdigit() else None
        problems[pid] = {'ids': ids, 'title': strip_title(m.group(5) or '') or src_text(ids[:1]), 'diff': diff,
                         'stmt': m.group(7), 'lec': lec}
        for x in ids: by_any[x] = pid
        cur[2].append(pid)
    lec_groups[lec] = groups

def zt_node(pid):
    p = problems[pid]
    meta = '出处：' + src_text(p['ids']) + ('　难度：' + '★' * p['diff'] if p['diff'] else '')
    body = tex_to_html(p['stmt']) + f'<p class="small">{esc(meta)}</p>'
    return {'type': 'exercise', 'imp': 3 if (p['diff'] or 0) >= 4 else 2, 'title': p['title'], 'alias': p['ids'],
            'body': body, 'sols': [{'name': '详解', 'deps': [], 'body': sol_html(pid)}]}

# ───────────────────────── 讲义 ─────────────────────────
B = {'root': {'title': '考研数学', 'ordered': True, 'kids': []}}
N = {}
used = set()

def nid_zt(pid): return 'zt' + pid.replace('-', '_')

def add_node(bub, nid, node):
    N[nid] = node; B[bub]['kids'].append(nid)

def frag_files():
    fs = sorted(glob.glob(os.path.join(FRAG, '*.tex')), key=lambda p: int(os.path.basename(p).split('-')[0]))
    return [f for f in fs if not os.path.basename(f).startswith('00-')]

def prep(src):
    src = re.sub(r'%%ZT\{([^}]*)\}\{([^}]*)\}', r'\\ZTMARK{\1}{\2}', src)
    def kp(m):
        body, _ = read_group(src, m.end() - 1)
        return '\\KAOPIN{' + body + '}'
    out, i = [], 0
    for m in re.finditer(r'%%KAOPIN\{', src):
        if m.start() < i: continue
        body, j = read_group(src, m.end() - 1)
        out.append(src[i:m.start()]); out.append('\\KAOPIN{' + body + '}'); i = j
    out.append(src[i:])
    src = ''.join(out)
    src = re.sub(r'(?<!\\)%.*', '', src)
    return src

ITEM_RE = re.compile(r'\\section\*?\{|\\begin\{(defbox|thmbox|jielun|warnbox|exbox)\}|\\ZTMARK\{|\\KAOPIN\{')

def parse_lecture(src):
    """返回 [(节标题, [元素…])]，元素是 ('prose', tex) / ('box', 类型, 标题, tex) / ('zt', id, 标题) / ('kaopin', tex)。"""
    secs = [['__intro__', []]]
    i = 0
    while True:
        m = ITEM_RE.search(src, i)
        prose = src[i:m.start()] if m else src[i:]
        if prose.strip(): secs[-1][1].append(('prose', prose))
        if not m: break
        tok = m.group(0)
        if tok.startswith('\\section'):
            t, j = read_group(src, m.end() - 1)
            secs.append([strip_title(t), []]); i = j
        elif tok.startswith('\\begin'):
            env = m.group(1)
            j = m.end()
            ttl = ''
            if src[j:j + 1] == '[':
                ttl, j = read_group(src, j, '[', ']')
            end = src.index('\\end{' + env + '}', j)
            secs[-1][1].append(('box', env, ttl, src[j:end])); i = end + len('\\end{' + env + '}')
        elif tok.startswith('\\ZTMARK'):
            _, a, j = read_args(src, m.end() - 1, 2)
            secs[-1][1].append(('zt', a[0].strip(), a[1])); i = j
        else:
            body, j = read_group(src, m.end() - 1)
            secs[-1][1].append(('kaopin', body)); i = j
    return secs


def derive_title(html, fallback):
    """没有标题的节点：取正文里第一处加粗，或者第一句话。"""
    import html as H
    maths = []
    t = re.sub(r'\$\$[\s\S]*?\$\$', ' ', html or '')
    def keep(m):
        maths.append(m.group(0)); return '\u0005%d\u0006' % (len(maths) - 1)
    t = re.sub(r'\$[^$]*\$', keep, t)
    restore = lambda x: re.sub('\u0005(\\d+)\u0006', lambda m: maths[int(m.group(1))], x)
    tip_free = re.sub(r'<div class="tip">.*?</div>', ' ', t, flags=re.S)
    if not re.sub(r'<[^>]+>|\s', '', tip_free): tip_free = t      # 整段都是提示框
    m = re.search(r'<strong>(.*?)</strong>', tip_free, flags=re.S)
    if m:
        c = re.sub(r'<[^>]+>', '', m.group(1)).strip().rstrip('：:。，,．.')
        c = H.unescape(c)
        if 2 <= len(c) <= 24 and not re.fullmatch(r'[\s\u0005\u0006\d]*', c) and not re.match(r'^[（(]?[IVⅠⅡⅢ\d]+[)）]?$', c) and c not in ('注意', '解', '例', '结论', '读法'):
            return restore(c)
    plain = H.unescape(re.sub(r'<[^>]+>', ' ', tip_free))
    plain = re.sub(r'\s+', ' ', plain).strip()
    first = re.split(r'[。；！？]', plain)[0].strip()
    if len(first) > 24:
        parts = re.split(r'[，：:]', first)
        first = parts[0] if 4 <= len(parts[0]) <= 24 else re.sub('\u0005\\d*$', '', first[:20]) + '…'
    first = first.strip().rstrip('：:，,')
    if len(first) < 2 or re.fullmatch(r'[\s\u0005\u0006\d]*', first): return fallback   # 只有公式：用节名
    return restore(first)

TYPE_OF = {'defbox': 'def', 'thmbox': 'thm', 'jielun': 'prop', 'exbox': 'example'}

def lecture_nodes(lec, bub_prefix, secs, chapter_title):
    """把一讲的各节变成泡泡与节点。返回这一讲下面的子泡泡 id 列表。"""
    kids = []
    for si, (title, items) in enumerate(secs):
        bid = f'{bub_prefix}s{si}'
        btitle = '本讲定位' if title == '__intro__' else title
        B[bid] = {'title': btitle, 'ordered': True, 'kids': []}
        last = None
        pending_last = [None]
        pending = []
        k = 0
        def flush_pending_as_note():
            nonlocal last, k
            if pending:
                k += 1
                nid = f'{lec}_{si}_{k}'
                body = ''.join(pending)
                if title == '__intro__': nt = lec + ' 本讲定位'
                elif not B[bid]['kids']:    # 一节开头的讲解：短小标题就用它，否则用节名
                    sec_name = re.sub(r'^\s*[\d.]+\s*', '', btitle).strip() or btitle
                    d = derive_title(body, sec_name); nt = d if len(d) <= 12 else sec_name
                else: nt = derive_title(body, btitle)
                add_node(bid, nid, {'type': 'note', 'imp': 2, 'title': nt, 'alias': [], 'body': body})
                pending.clear(); last = nid; pending_last[0] = nid
        for it in items:
            if it[0] == 'prose' or (it[0] == 'box' and it[1] == 'warnbox') or it[0] == 'kaopin':
                if it[0] == 'prose':
                    h = tex_to_html(it[1])
                elif it[0] == 'kaopin':
                    h = '<div class="tip"><p><strong>真题考频</strong></p>' + tex_to_html(it[1]) + '</div>'
                else:
                    h = '<div class="tip">' + tex_to_html(it[3]) + '</div>'
                if not h: continue
                if last and N[last]['type'] != 'exercise': N[last]['body'] += h
                else: pending.append(h)
            elif it[0] == 'box':
                flush_pending_as_note()
                k += 1
                env, ttl, body = it[1], it[2], it[3]
                t = strip_title(ttl)
                t2 = re.sub(r'^\s*[\d.]+\s*', '', t).strip()
                bh = tex_to_html(body)
                fb = re.sub(r'^\s*[\d.]+\s*', '', btitle).strip() or btitle
                name = t2 or derive_title(bh, fb)
                # 没标题、正文又只是公式：前面紧挨着的短讲解（比如「方差」）就是它的名字
                prev = N.get(pending_last[0]) if pending_last[0] else None
                if not t2 and name == fb and prev and prev['type'] == 'note' and len(prev['title']) <= 10: name = prev['title']
                nid = f'{lec}_{si}_{k}'
                add_node(bid, nid, {'type': TYPE_OF[env], 'imp': 3 if env == 'thmbox' else 2, 'title': name, 'alias': [t] if t and t != name else [],
                                    'body': bh})
                last = nid
            elif it[0] == 'zt':
                flush_pending_as_note()
                pid = by_any.get(it[1])
                if not pid:
                    print('找不到真题', it[1], '在', lec, file=sys.stderr); continue
                nid = nid_zt(pid)
                if pid in used:      # 已经在前面出现过：只引用
                    if last: N[last]['body'] += f'<p>真题见 [[{nid}]]。</p>'
                    continue
                used.add(pid)
                add_node(bid, nid, zt_node(pid))
                last = nid
        flush_pending_as_note()
        if B[bid]['kids']: kids.append(bid)
        else: del B[bid]
    return kids

CH = []           # [(chapter id, tag, title)]
cur_ch = None
guide_n = 0
lec_bubbles = {}
for f in frag_files():
    name = os.path.basename(f)
    src = prep(open(f, encoding='utf-8').read())
    mpart = re.search(r'\\part\*?\{第\s*(\d+)\s*编\\quad\s*([^}]*)\}', src)
    if mpart:
        n = int(mpart.group(1))
        cur_ch = f'p{n}'
        if cur_ch in B:
            B[cur_ch]['title'] = mpart.group(2).strip()
        else:
            B[cur_ch] = {'title': mpart.group(2).strip(), 'tag': f'第{n}编', 'ordered': True, 'kids': []}
            B['root']['kids'].append(cur_ch); CH.append(cur_ch)
        continue
    mchap = re.search(r'\\chapter\*?\{(.*?)\}\s*\n', src)
    if not mchap:
        print('跳过', name, file=sys.stderr); continue
    raw_title = mchap.group(1)
    body = src[mchap.end():]
    body = re.sub(r'\\addcontentsline\{[^}]*\}\{[^}]*\}\{[^}]*\}|\\markboth\{[^}]*\}\{[^}]*\}', '', body)
    if cur_ch is None:  # 第 0 编之前的「这门课怎么用」「全课程地图」，放进第 0 编开头
        cur_ch = 'p0'
        B['p0'] = {'title': '预备', 'tag': '第0编', 'ordered': True, 'kids': []}
        B['root']['kids'].append('p0'); CH.append('p0')
    mlec = re.match(r'L(\d+)', name.split('-', 1)[1])
    if mlec:
        lec = 'L%02d' % int(mlec.group(1))
        flag = '重点讲' if '\\zhongdian' in raw_title else '压缩讲' if '\\yasuo' in raw_title else ''
        t = strip_title(re.sub(r'^L\d+\\quad', '', raw_title).replace('\\yasuo', '').replace('\\zhongdian', ''))
        lid = lec
        secs = parse_lecture(body)
        kids = lecture_nodes(lec, lid, secs, t)
        # 这一讲剩下的真题，按考点成组
        gi = 0
        for gname, subj, pids in lec_groups.get(lec, []):
            rest = [p for p in pids if p not in used]
            if not rest: continue
            gi += 1
            gb = f'{lid}k{gi}'
            B[gb] = {'title': '真题｜' + gname, 'ordered': False, 'kids': [], 'desc': ('考查卷别：数' + subj) if subj else ''}
            for p in rest:
                used.add(p); nid = nid_zt(p); N[nid] = zt_node(p); B[gb]['kids'].append(nid)
            kids.append(gb)
        nz = sum(len(g[2]) for g in lec_groups.get(lec, []))
        B[lid] = {'title': f'{lec} {t}', 'ordered': True, 'kids': kids,
                  'desc': '　'.join(x for x in [flag, f'{nz} 道真题' if nz else '本讲不挂真题'] if x)}
        B[cur_ch]['kids'].append(lid)
    else:   # 导读、课程说明：一个泡泡、一个注记节点
        guide_n += 1
        gid = f'{cur_ch}g{guide_n}'
        t = strip_title(raw_title)
        secs = parse_lecture(body)
        html = ''
        for st, items in secs:
            if st != '__intro__': html += f'<p><strong>{esc(st)}</strong></p>'
            for it in items:
                if it[0] == 'prose': html += tex_to_html(it[1])
                elif it[0] == 'box': html += ('<div class="tip">' if it[1] == 'warnbox' else '') + tex_to_html(it[3]) + ('</div>' if it[1] == 'warnbox' else '')
                elif it[0] == 'kaopin': html += '<div class="tip">' + tex_to_html(it[1]) + '</div>'
        B[gid] = {'title': t, 'ordered': True, 'kids': [f'{gid}n']}
        N[f'{gid}n'] = {'type': 'note', 'imp': 2, 'title': t, 'alias': [], 'body': html}
        B[cur_ch]['kids'].append(gid)

# 没被任何讲收录的真题（理论上没有）
left = [p for p in problems if p not in used]
if left: print('未收录的真题：', len(left), left[:10], file=sys.stderr)

# 章节关系图（8 编）
CH_EDGES = [['p0', 'p1'], ['p1', 'p2'], ['p1', 'p3'], ['p3', 'p4'], ['p0', 'p5'], ['p1', 'p6'],
            ['p2', 'p7'], ['p4', 'p7'], ['p5', 'p7'], ['p6', 'p7']]
CH_POS = {'p0': [100, 18], 'p1': [62, 62], 'p5': [150, 62], 'p2': [30, 112], 'p3': [92, 112],
          'p6': [160, 128], 'p4': [92, 166], 'p7': [100, 214]}

with open(OUT, 'w', encoding='utf-8') as fo:
    fo.write('/* 由 tools/kaoyan/convert.py 自动生成：考研数学讲义 + 真题分类精解 */\n')
    fo.write('const B=' + json.dumps(B, ensure_ascii=False) + ';\n')
    fo.write('const N=' + json.dumps(N, ensure_ascii=False) + ';\n')
    fo.write('const CH_EDGES=' + json.dumps(CH_EDGES) + ';\n')
    fo.write('const CH_POS=' + json.dumps(CH_POS) + ';\n')

types = collections.Counter(n['type'] for n in N.values())
print('泡泡', len(B), '节点', len(N), dict(types), '真题', len(problems), '已收录', len(used), file=sys.stderr)
print('未识别命令（前 40）：', UNKNOWN.most_common(40), file=sys.stderr)
