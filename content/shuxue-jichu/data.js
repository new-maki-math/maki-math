const R = String.raw;
function tt(head, rows) {
  return '<div class="tt-wrap"><table class="tt"><thead><tr>' +
    head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map(c => '<td class="' + (c === 'T' ? 'vt' : c === 'F' ? 'vf' : '') + '">' + c + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}

/* ---------- 泡泡树：title 为 null 的是纯结构分组（不可进入） ---------- */
const B = {
  root: { title: '数学基础', ordered: true, kids: ['b1', 'b2', 'g1'] },
  b1: { title: '命题与量词', tag: 'P1', ordered: true, kids: ['b1a', 'b1b', 'b1c', 'b1d', 'b1e', 'b1f', 'b1g'] },
  b1a: { title: '命题与联结词', ordered: true, kids: ['notation', 'symbols', 'prop', 'not', 'and', 'or'] },
  b1b: { title: '运算律', ordered: true, kids: ['dneg', 'comm', 'assoc', 'demorgan', 'dist', 'lem', 'contra', 'idem', 'absorb'] },
  b1c: { title: '蕴含与等价', ordered: true, kids: ['imp', 'vacuous', 'negimp', 'implaw', 'orimp', 'contrapos', 'equiv', 'syllog'] },
  b1d: { title: '证明的基本方法', ordered: true, kids: ['m_imp', 'ex_x2', 'm_and', 'm_or', 'm_case', 'exr_case', 'ex_or', 'm_iff'] },
  b1e: { title: '混合蕴含律', ordered: false, kids: ['mix1', 'mix2', 'mix3', 'mix4', 'mix5'] },
  b1f: { title: '量词', ordered: true, kids: ['forall', 'exists', 'm_forall', 'm_exists', 'ex_sq', 'ex_100'] },
  b1g: { title: '反证法', ordered: true, kids: [], pending: '手写稿第 26–29 页，待录入' },
  b2: { title: '集合（上）', tag: 'P2', ordered: true, kids: [], pending: '待录入' },
  g1: { title: null, ordered: false, kids: ['g2', 'g6'] },
  g2: { title: null, ordered: true, kids: ['b3', 'b4', 'b5', 'g5'] },
  g5: { title: null, ordered: false, kids: ['b8', 'b9'] },
  g6: { title: null, ordered: true, kids: ['b6', 'b7'] },
  b3: { title: '关系', tag: 'P3', ordered: true, kids: [], pending: '待录入' },
  b4: { title: '映射', tag: 'P4', ordered: true, kids: [], pending: '待录入' },
  b5: { title: '集合（下）', tag: 'P5', ordered: true, kids: [], pending: '待录入' },
  b6: { title: '实数', tag: 'P6', ordered: true, kids: [], pending: '待录入' },
  b7: { title: '复数', tag: 'P7', ordered: true, kids: [], pending: '待录入' },
  b8: { title: '组合', tag: 'P8', ordered: true, kids: [], pending: '待录入' },
  b9: { title: '数论', tag: 'P9', ordered: true, kids: [], pending: '待录入' }
};

/* ---------- 节点 ----------
   type: def 定义 / thm 定理 / prop 性质 / method 方法 / example 例题 / exercise 练习
   imp: 3 核心 / 2 常用 / 1 铺垫
   proofs（定理、方法）或 sols（题目）：每套各自声明 deps
   正文里的 [[id]] 是对其他节点的引用 */
const N = {
  notation: { type: 'def', imp: 2, title: '常用数集记号', alias: ['N', 'Z', 'Q', 'R', 'C', '自然数', '整数', '有理数', '实数', '复数', '数集'], deps: [],
    body: R`<ul class="plain">
<li>$\mathbb{N}=\mathbb{N}_0=\{0,1,2,\dots\}$（本课约定自然数包含 $0$）</li>
<li>$\mathbb{Z}=\{0,\pm1,\pm2,\dots\}$</li>
<li>$\mathbb{Q}=\left\{\dfrac{a}{b} : a,b\in\mathbb{Z},\ b\neq 0,\ \gcd(a,b)=1\right\}$</li>
<li>$\mathbb{R}$：全体实数</li>
<li>$\mathbb{C}=\{a+bi : a,b\in\mathbb{R}\}$，其中 $i^2=-1$</li></ul>` },

  symbols: { type: 'def', imp: 2, title: '逻辑符号', alias: ['∀', '∃', '∧', '∨', '¬', '⇒', '⇔', '联结词'], deps: [],
    body: tt(['符号', '读作', '含义'], [
      [R`$\forall$`, '全称量词', '对于任意的'],
      [R`$\exists$`, '存在量词', '存在至少一个'],
      [R`$\exists!$`, '存在唯一', '存在唯一一个'],
      [R`$\wedge$`, '与', '两个同时成立'],
      [R`$\vee$`, '或', '至少有一个成立'],
      [R`$\neg$`, '非', '否定'],
      [R`$\Rightarrow$`, '蕴含', '如果……那么……'],
      [R`$\Leftrightarrow$`, '等价', '真假性相同']]) },

  prop: { type: 'def', imp: 3, title: '命题', alias: ['proposition', '真', '假', 'T', 'F'], deps: [],
    body: R`<p>命题是有确定真假性的陈述句，常用 $p,q,r,\dots$ 表示。命题为真记作 $\mathrm{T}$，为假记作 $\mathrm{F}$。</p>` },

  not: { type: 'def', imp: 3, title: '否定（非）', alias: ['¬', '非', 'negation'], deps: ['prop'],
    body: R`<p>命题 $p$ 的否定记作 $\neg p$，它的真假与 $p$ 相反：</p>` +
      tt([R`$p$`, R`$\neg p$`], [['T', 'F'], ['F', 'T']]) },

  and: { type: 'def', imp: 3, title: '合取（与）', alias: ['∧', '与', '且', 'conjunction'], deps: ['prop'],
    body: R`<p>$p\wedge q$ 读作「$p$ 与 $q$」，当且仅当 $p,q$ 同时为真时为真：</p>` +
      tt([R`$p$`, R`$q$`, R`$p\wedge q$`], [['T', 'T', 'T'], ['T', 'F', 'F'], ['F', 'T', 'F'], ['F', 'F', 'F']]) },

  or: { type: 'def', imp: 3, title: '析取（或）', alias: ['∨', '或', 'disjunction'], deps: ['prop'],
    body: R`<p>$p\vee q$ 读作「$p$ 或 $q$」，当且仅当 $p,q$ 至少有一个为真时为真：</p>` +
      tt([R`$p$`, R`$q$`, R`$p\vee q$`], [['T', 'T', 'T'], ['T', 'F', 'T'], ['F', 'T', 'T'], ['F', 'F', 'F']]) },

  dneg: { type: 'thm', imp: 2, title: '双重否定律', alias: ['double negation', '¬¬p'],
    body: R`$$\neg(\neg p)\Leftrightarrow p$$`,
    proofs: [{ name: '真值表', deps: ['not'],
      body: tt([R`$p$`, R`$\neg p$`, R`$\neg(\neg p)$`], [['T', 'F', 'T'], ['F', 'T', 'F']]) + '<p>第一列与第三列完全相同。</p>' }] },

  comm: { type: 'thm', imp: 2, title: '交换律', alias: ['commutative'],
    body: R`$$p\wedge q\Leftrightarrow q\wedge p,\qquad p\vee q\Leftrightarrow q\vee p$$`,
    proofs: [
      { name: '真值分析', deps: ['and', 'or'],
        body: R`<p>第一式：左边为真 $\Leftrightarrow$ $p,q$ 都为真 $\Leftrightarrow$ $q,p$ 都为真 $\Leftrightarrow$ 右边为真。</p><p>第二式：左边为假 $\Leftrightarrow$ $p,q$ 都为假 $\Leftrightarrow$ $q,p$ 都为假 $\Leftrightarrow$ 右边为假。</p>` },
      { name: '推导', deps: ['m_iff', 'm_imp', 'and'],
        body: R`<p>以第一式为例。由对称性，只需证明「$\Rightarrow$」。</p><p>假设 $p\wedge q$，要证 $q\wedge p$。由 $p\wedge q$ 可知 $p$ 与 $q$ 都成立，于是 $q\wedge p$。第二式同理。</p>` }] },

  assoc: { type: 'thm', imp: 2, title: '结合律', alias: ['associative'],
    body: R`$$p\wedge(q\wedge r)\Leftrightarrow(p\wedge q)\wedge r$$$$p\vee(q\vee r)\Leftrightarrow(p\vee q)\vee r$$<p>因此可以不加括号地写 $p\wedge q\wedge r$ 与 $p\vee q\vee r$。</p>`,
    proofs: [{ name: '真值分析', deps: ['and', 'or'],
      body: R`<p>第一式：左边为真 $\Leftrightarrow$ $p$ 与 $q\wedge r$ 都为真 $\Leftrightarrow$ $p,q,r$ 都为真 $\Leftrightarrow$ 右边为真。</p><p>第二式：左边为假 $\Leftrightarrow$ $p$ 与 $q\vee r$ 都为假 $\Leftrightarrow$ $p,q,r$ 都为假 $\Leftrightarrow$ 右边为假。</p>` }] },

  demorgan: { type: 'thm', imp: 3, title: 'De Morgan 律', alias: ['德摩根', 'de morgan'],
    body: R`$$\neg(p\wedge q)\Leftrightarrow(\neg p)\vee(\neg q)$$$$\neg(p\vee q)\Leftrightarrow(\neg p)\wedge(\neg q)$$`,
    proofs: [
      { name: '真值分析', deps: ['not', 'and', 'or'],
        body: R`<p>第一式：左边为假 $\Leftrightarrow$ $p\wedge q$ 为真 $\Leftrightarrow$ $p,q$ 都为真 $\Leftrightarrow$ $\neg p,\neg q$ 都为假 $\Leftrightarrow$ 右边为假。</p><p>第二式：左边为真 $\Leftrightarrow$ $p\vee q$ 为假 $\Leftrightarrow$ $p,q$ 都为假 $\Leftrightarrow$ $\neg p,\neg q$ 都为真 $\Leftrightarrow$ 右边为真。</p>` },
      { name: '真值表（第一式）', deps: ['not', 'and', 'or'],
        body: tt([R`$p$`, R`$q$`, R`$p\wedge q$`, R`$\neg(p\wedge q)$`, R`$\neg p$`, R`$\neg q$`, R`$(\neg p)\vee(\neg q)$`],
          [['T', 'T', 'T', 'F', 'F', 'F', 'F'], ['T', 'F', 'F', 'T', 'F', 'T', 'T'], ['F', 'T', 'F', 'T', 'T', 'F', 'T'], ['F', 'F', 'F', 'T', 'T', 'T', 'T']]) +
          R`<p>第 4 列与第 7 列完全相同。</p>` }] },

  dist: { type: 'thm', imp: 3, title: '分配律', alias: ['distributive'],
    body: R`<p>①</p>$$p\wedge(q\vee r)\Leftrightarrow(p\wedge q)\vee(p\wedge r)$$<p>②</p>$$p\vee(q\wedge r)\Leftrightarrow(p\vee q)\wedge(p\vee r)$$`,
    proofs: [
      { name: '真值分析', deps: ['and', 'or'],
        body: R`<p>①：左边为真 $\Leftrightarrow$ $p$ 为真，且 $q,r$ 至少一个为真 $\Leftrightarrow$「$p,q$ 都为真」或「$p,r$ 都为真」$\Leftrightarrow$ 右边为真。</p><p>②：左边为假 $\Leftrightarrow$ $p$ 为假，且 $q,r$ 至少一个为假 $\Leftrightarrow$「$p,q$ 都为假」或「$p,r$ 都为假」$\Leftrightarrow$ 右边为假。</p>` },
      { name: '由 ① 推出 ②', deps: ['demorgan', 'dneg'],
        body: R`<p>假设 ① 已成立。</p>$$\begin{aligned}p\vee(q\wedge r)&\Leftrightarrow \neg(\neg p)\vee\big(\neg(\neg q)\wedge\neg(\neg r)\big)\\&\Leftrightarrow \neg(\neg p)\vee\neg\big((\neg q)\vee(\neg r)\big)\\&\Leftrightarrow \neg\Big((\neg p)\wedge\big((\neg q)\vee(\neg r)\big)\Big)\\&\Leftrightarrow \neg\big(((\neg p)\wedge(\neg q))\vee((\neg p)\wedge(\neg r))\big)\\&\Leftrightarrow \neg((\neg p)\wedge(\neg q))\wedge\neg((\neg p)\wedge(\neg r))\\&\Leftrightarrow (p\vee q)\wedge(p\vee r)\end{aligned}$$<p>依次用到 [[dneg]]、[[demorgan]]、[[demorgan]]、①、[[demorgan]]，最后一步再用 De Morgan 律与双重否定律。</p>` },
      { name: '推导（①）', deps: ['m_iff', 'm_imp', 'm_case', 'm_or'],
        body: R`<p>「$\Rightarrow$」假设 $p\wedge(q\vee r)$，于是 $p$ 成立，且 $q\vee r$ 成立。要证 $(p\wedge q)\vee(p\wedge r)$。</p><p>方法一（分类讨论）：若 $q$，则 $p\wedge q$；若 $r$，则 $p\wedge r$。两种情形下右边都成立。</p><p>方法二：假设 $p\wedge q$ 不成立。由于 $p$ 成立，所以 $q$ 不成立；又 $q\vee r$，因此 $r$ 成立，故 $p\wedge r$。</p><p>「$\Leftarrow$」假设 $(p\wedge q)\vee(p\wedge r)$。由对称性，不妨设 $p\wedge q$，于是 $p$ 与 $q$ 都成立，从而 $q\vee r$，故 $p\wedge(q\vee r)$。</p>` }] },

  lem: { type: 'thm', imp: 2, title: '排中律', alias: ['excluded middle'],
    body: R`$$p\vee(\neg p)\Leftrightarrow\mathrm{T}$$`,
    proofs: [{ name: '真值分析', deps: ['not', 'or'], body: R`<p>$p$ 与 $\neg p$ 恰有一个为真，所以 $p\vee(\neg p)$ 总为真。</p>` }] },

  contra: { type: 'thm', imp: 2, title: '矛盾律', alias: ['contradiction'],
    body: R`$$p\wedge(\neg p)\Leftrightarrow\mathrm{F}$$`,
    proofs: [{ name: '真值分析', deps: ['not', 'and'], body: R`<p>$p$ 与 $\neg p$ 恰有一个为假，所以 $p\wedge(\neg p)$ 总为假。</p>` }] },

  idem: { type: 'thm', imp: 1, title: '幂等律', alias: ['idempotent'],
    body: R`$$p\wedge p\Leftrightarrow p,\qquad p\vee p\Leftrightarrow p$$`,
    proofs: [{ name: '真值分析', deps: ['and', 'or'], body: R`<p>$p\wedge p$ 为真 $\Leftrightarrow$ $p$ 为真；$p\vee p$ 为真 $\Leftrightarrow$ $p$ 为真。</p>` }] },

  absorb: { type: 'thm', imp: 2, title: '吸收律', alias: ['absorption'],
    body: R`$$p\wedge(p\vee q)\Leftrightarrow p,\qquad p\vee(p\wedge q)\Leftrightarrow p$$`,
    proofs: [
      { name: '真值分析', deps: ['and', 'or'],
        body: R`<p>第一式：左边为真 $\Leftrightarrow$ $p$ 与 $p\vee q$ 都为真 $\Leftrightarrow$ $p$ 为真（$p$ 为真时 $p\vee q$ 自动为真）。</p><p>第二式：左边为假 $\Leftrightarrow$ $p$ 与 $p\wedge q$ 都为假 $\Leftrightarrow$ $p$ 为假（$p$ 为假时 $p\wedge q$ 自动为假）。</p>` },
      { name: '推导（第二式）', deps: ['m_iff', 'm_imp', 'm_case'],
        body: R`<p>「$\Leftarrow$」若 $p$，则 $p\vee(p\wedge q)$。</p><p>「$\Rightarrow$」假设 $p\vee(p\wedge q)$，要证 $p$。分类讨论：若 $p$，则 $p$；若 $p\wedge q$，则 $p$。</p>` }] },

  imp: { type: 'def', imp: 3, title: '蕴含', alias: ['⇒', '若则', '如果那么', 'implication'], deps: ['prop'],
    body: R`<p>「若 $p$，则 $q$」记作 $p\Rightarrow q$，意思是：当 $p$ 成立时，$q$ 必须成立。它只在 $p$ 真而 $q$ 假时为假：</p>` +
      tt([R`$p$`, R`$q$`, R`$p\Rightarrow q$`], [['T', 'T', 'T'], ['T', 'F', 'F'], ['F', 'T', 'T'], ['F', 'F', 'T']]) },

  vacuous: { type: 'prop', imp: 2, title: '虚真', alias: ['vacuous truth', '假命题蕴含任何命题'],
    body: R`<p>假命题蕴含任何命题：</p>$$(\mathrm{F}\Rightarrow p)\Leftrightarrow\mathrm{T}$$<p>例如「$1+1=3\Rightarrow$ 哥德巴赫猜想成立」是真命题，尽管哥德巴赫猜想至今没有被证明。</p>`,
    proofs: [{ name: '由真值表', deps: ['imp'], body: R`<p>[[imp]]的真值表中，前件为 $\mathrm{F}$ 的两行（第 3、4 行）结果都是 $\mathrm{T}$。</p>` }] },

  negimp: { type: 'thm', imp: 2, title: '蕴含的否定', alias: ['¬(p⇒q)'],
    body: R`$$\neg(p\Rightarrow q)\Leftrightarrow p\wedge(\neg q)$$`,
    proofs: [{ name: '真值分析', deps: ['imp', 'not', 'and'], body: R`<p>由真值表，$p\Rightarrow q$ 为假当且仅当 $p$ 真且 $q$ 假，也就是 $p\wedge(\neg q)$ 为真。</p>` }] },

  implaw: { type: 'thm', imp: 3, title: '蕴含律', alias: ['material implication'],
    body: R`$$(p\Rightarrow q)\Leftrightarrow(\neg p)\vee q$$<p>它把蕴含化成「非」与「或」，后面的等价变形大多从这里出发。</p>`,
    proofs: [{ name: '真值分析', deps: ['imp', 'not', 'or'], body: R`<p>右边为假 $\Leftrightarrow$ $\neg p$ 与 $q$ 都为假 $\Leftrightarrow$ $p$ 真且 $q$ 假 $\Leftrightarrow$ 左边为假。</p>` }] },

  orimp: { type: 'thm', imp: 2, title: '析取的蕴含形式', alias: ['p∨q', '或化蕴含'],
    body: R`$$p\vee q\Leftrightarrow\big((\neg p)\Rightarrow q\big)\Leftrightarrow\big((\neg q)\Rightarrow p\big)$$`,
    proofs: [{ name: '等价变形', deps: ['implaw', 'dneg', 'comm'],
      body: R`$$\begin{aligned}p\vee q&\Leftrightarrow\neg(\neg p)\vee q\Leftrightarrow\big((\neg p)\Rightarrow q\big)\\p\vee q&\Leftrightarrow q\vee p\Leftrightarrow\big((\neg q)\Rightarrow p\big)\end{aligned}$$<p>用到 [[dneg]]、[[implaw]] 和 [[comm]]。</p>` }] },

  contrapos: { type: 'thm', imp: 3, title: '逆否命题律', alias: ['contrapositive', '逆否'],
    body: R`$$(p\Rightarrow q)\Leftrightarrow\big((\neg q)\Rightarrow(\neg p)\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'comm', 'dneg'],
        body: R`$$\begin{aligned}(p\Rightarrow q)&\Leftrightarrow(\neg p)\vee q\\&\Leftrightarrow q\vee(\neg p)\\&\Leftrightarrow\neg(\neg q)\vee(\neg p)\\&\Leftrightarrow\big((\neg q)\Rightarrow(\neg p)\big)\end{aligned}$$` },
      { name: '真值分析', deps: ['imp', 'not'],
        body: R`<p>左边为假 $\Leftrightarrow$ $p$ 真、$q$ 假 $\Leftrightarrow$ $\neg q$ 真、$\neg p$ 假 $\Leftrightarrow$ 右边为假。</p>` }] },

  equiv: { type: 'def', imp: 3, title: '等价', alias: ['⇔', '当且仅当', 'iff', '充要条件'], deps: ['imp', 'and'],
    body: R`<p>$p\Leftrightarrow q$ 表示 $p$ 与 $q$ 的真假性相同。它与两个方向的蕴含同时成立是一回事：</p>$$(p\Leftrightarrow q)\Leftrightarrow\big((p\Rightarrow q)\wedge(q\Rightarrow p)\big)$$` },

  syllog: { type: 'thm', imp: 3, title: '三段论', alias: ['modus ponens', 'syllogism'],
    body: R`$$\big(p\wedge(p\Rightarrow q)\big)\Rightarrow q$$`,
    proofs: [{ name: '真值分析', deps: ['imp', 'and', 'vacuous'],
      body: R`<p>若左边为假，由 [[vacuous]]，整个蕴含为真。</p><p>若左边为真，则 $p$ 为真且 $p\Rightarrow q$ 为真。查蕴含的真值表，前件为真且结果为真的只有第 1 行，所以 $q$ 为真。</p>` }] },

  m_imp: { type: 'method', imp: 3, title: '直接证明 p ⇒ q', alias: ['直接证明', '假设 p 证明 q'], deps: ['imp'],
    body: R`<p>要证明 $p\Rightarrow q$：假设 $p$，去证明 $q$。</p>`,
    proofs: [{ name: '为什么可以这样做', deps: ['imp', 'vacuous'], body: R`<p>当 $p$ 为假时，$p\Rightarrow q$ 自动为真（[[vacuous]]），所以只需检查 $p$ 为真的情形。</p>` }] },

  ex_x2: { type: 'example', imp: 2, title: '例：x > 2 ⇒ x² > 4', alias: ['x²>4'], attach: ['m_imp'],
    body: R`<p>设 $x\in\mathbb{R}$，证明 $x>2\Rightarrow x^2>4$。</p>`,
    sols: [{ name: '直接证明', deps: ['m_imp', 'notation'],
      body: R`<p>假设 $x>2$，只需证明 $x^2>4$。因为 $x>2>0$，两个同向的正数不等式相乘，得 $x\cdot x>2\cdot 2$，即 $x^2>4$。</p>` }] },

  m_and: { type: 'method', imp: 2, title: '证明 p ∧ q', alias: ['证明与'], deps: ['and'],
    body: R`<p>要证明 $p\wedge q$：分别证明 $p$ 和 $q$。</p>` },

  m_or: { type: 'method', imp: 3, title: '证明 p ∨ q', alias: ['证明或'], deps: ['or'],
    body: R`<p>要证明 $p\vee q$，两种方法任选其一：</p><p>方法一：假设 $p$ 不成立，证明 $q$ 成立。</p><p>方法二：假设 $q$ 不成立，证明 $p$ 成立。</p>`,
    proofs: [{ name: '为什么可以这样做', deps: ['orimp', 'm_imp'], body: R`<p>由 [[orimp]]，$p\vee q\Leftrightarrow\big((\neg p)\Rightarrow q\big)\Leftrightarrow\big((\neg q)\Rightarrow p\big)$，再用 [[m_imp]] 证明右边任意一个蕴含即可。</p>` }] },

  m_case: { type: 'method', imp: 3, title: '分类讨论', alias: ['分情况', 'case analysis', '不妨设'], deps: ['imp', 'and', 'not'],
    body: R`<p>若 $q$ 成立时能推出 $p$，且 $q$ 不成立时也能推出 $p$，则 $p$ 成立：</p>$$\big((q\Rightarrow p)\wedge((\neg q)\Rightarrow p)\big)\Rightarrow p$$<p>它的证明留作练习。</p>` },

  exr_case: { type: 'exercise', imp: 2, title: '练习：证明分类讨论的正确性', alias: ['分类讨论'], attach: ['m_case'],
    body: R`<p>证明 $\big((q\Rightarrow p)\wedge((\neg q)\Rightarrow p)\big)\Rightarrow p$ 恒为真。</p>`, sols: [] },

  ex_or: { type: 'example', imp: 2, title: '例：x < 1 或 x² ≥ 1', alias: ['x²≥1'], attach: ['m_or', 'm_case'],
    body: R`<p>设 $x\in\mathbb{R}$，证明 $x<1$ 或 $x^2\geq 1$。</p>`,
    sols: [
      { name: '假设一边不成立', deps: ['m_or'], body: R`<p>假设 $x<1$ 不成立，即 $x\geq 1$。由 $x\geq 1>0$，两式相乘得 $x^2\geq 1$。</p>` },
      { name: '分类讨论', deps: ['m_case'], body: R`<p>若 $x<1$，结论已成立。若 $x\geq 1$，同上可得 $x^2\geq 1$。两种情形下结论都成立。</p>` }] },

  m_iff: { type: 'method', imp: 3, title: '证明 p ⇔ q（推导）', alias: ['推导', 'deduction', '双向证明'], deps: ['equiv'],
    body: R`<p>分别证明两个方向：</p><p>「$\Rightarrow$」假设 $p$，证明 $q$；</p><p>「$\Leftarrow$」假设 $q$，证明 $p$。</p>`,
    proofs: [{ name: '为什么可以这样做', deps: ['equiv', 'm_and', 'm_imp'], body: R`<p>由 [[equiv]]，$p\Leftrightarrow q$ 与 $(p\Rightarrow q)\wedge(q\Rightarrow p)$ 等价，再用 [[m_and]] 和 [[m_imp]]。</p>` }] },

  mix1: { type: 'thm', imp: 3, title: '混合蕴含律 ①', alias: ['混合蕴含律'],
    body: R`$$\big((p\Rightarrow q)\vee(p\Rightarrow r)\big)\Leftrightarrow\big(p\Rightarrow(q\vee r)\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'assoc', 'comm', 'idem'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow\big((\neg p)\vee q\big)\vee\big((\neg p)\vee r\big)\\&\Leftrightarrow\big((\neg p)\vee(\neg p)\big)\vee(q\vee r)\\&\Leftrightarrow(\neg p)\vee(q\vee r)\Leftrightarrow\text{右边}\end{aligned}$$` },
      { name: '推导', deps: ['m_iff', 'm_imp', 'm_case', 'syllog', 'negimp'],
        body: R`<p>「$\Rightarrow$」不妨设 $p\Rightarrow r$（另一种情形对称）。要证 $p\Rightarrow(q\vee r)$：假设 $p$，由 [[syllog]] 得 $r$，于是 $q\vee r$。</p><p>「$\Leftarrow$」假设 $p\Rightarrow(q\vee r)$，要证 $(p\Rightarrow q)\vee(p\Rightarrow r)$。假设 $p\Rightarrow q$ 不成立，由 [[negimp]]，$p$ 成立而 $q$ 不成立。要证 $p\Rightarrow r$：假设 $p$，由 $p\Rightarrow(q\vee r)$ 知 $q\vee r$，而 $q$ 不成立，因此 $r$。</p>` }] },

  mix2: { type: 'thm', imp: 3, title: '混合蕴含律 ②', alias: ['混合蕴含律'],
    body: R`$$\big((p\Rightarrow q)\wedge(p\Rightarrow r)\big)\Leftrightarrow\big(p\Rightarrow(q\wedge r)\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'dist'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow\big((\neg p)\vee q\big)\wedge\big((\neg p)\vee r\big)\\&\Leftrightarrow(\neg p)\vee(q\wedge r)\Leftrightarrow\text{右边}\end{aligned}$$<p>第二步用 [[dist]] ②。</p>` },
      { name: '推导', deps: ['m_iff', 'm_imp', 'syllog'],
        body: R`<p>「$\Rightarrow$」假设 $p\Rightarrow q$ 且 $p\Rightarrow r$。再假设 $p$，要证 $q\wedge r$：由 [[syllog]] 得 $q$ 与 $r$，于是 $q\wedge r$。</p><p>「$\Leftarrow$」假设 $p\Rightarrow(q\wedge r)$。由对称性只需证明 $p\Rightarrow q$：假设 $p$，则 $q\wedge r$，故 $q$。</p>` }] },

  mix3: { type: 'thm', imp: 3, title: '混合蕴含律 ③', alias: ['混合蕴含律'],
    body: R`$$\big((p\Rightarrow r)\vee(q\Rightarrow r)\big)\Leftrightarrow\big((p\wedge q)\Rightarrow r\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'assoc', 'comm', 'idem', 'demorgan'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow\big((\neg p)\vee r\big)\vee\big((\neg q)\vee r\big)\\&\Leftrightarrow(\neg p)\vee(\neg q)\vee r\\&\Leftrightarrow\neg(p\wedge q)\vee r\Leftrightarrow\text{右边}\end{aligned}$$` },
      { name: '推导', deps: ['m_iff', 'm_imp', 'm_case', 'syllog', 'negimp'],
        body: R`<p>「$\Rightarrow$」不妨设 $p\Rightarrow r$。再设 $p\wedge q$，要证 $r$：由 $p$ 及 [[syllog]] 得 $r$。</p><p>「$\Leftarrow$」假设 $(p\wedge q)\Rightarrow r$。假设 $p\Rightarrow r$ 不成立，由 [[negimp]]，$p$ 成立而 $r$ 不成立。要证 $q\Rightarrow r$：假设 $q$，则 $p\wedge q$，因此 $r$。</p>` }] },

  mix4: { type: 'thm', imp: 3, title: '混合蕴含律 ④', alias: ['混合蕴含律'],
    body: R`$$\big((p\Rightarrow r)\wedge(q\Rightarrow r)\big)\Leftrightarrow\big((p\vee q)\Rightarrow r\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'dist', 'comm', 'demorgan'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow\big((\neg p)\vee r\big)\wedge\big((\neg q)\vee r\big)\\&\Leftrightarrow\big((\neg p)\wedge(\neg q)\big)\vee r\\&\Leftrightarrow\neg(p\vee q)\vee r\Leftrightarrow\text{右边}\end{aligned}$$<p>第二步用 [[dist]] ② 与 [[comm]]，第三步用 [[demorgan]]。</p>` },
      { name: '推导', deps: ['m_iff', 'm_imp', 'm_case'],
        body: R`<p>「$\Rightarrow$」假设 $p\Rightarrow r$ 且 $q\Rightarrow r$，再设 $p\vee q$，要证 $r$。不妨设 $p$（另一种情形对称），于是 $r$。</p><p>「$\Leftarrow$」假设 $(p\vee q)\Rightarrow r$。由对称性只需证明 $p\Rightarrow r$：假设 $p$，则 $p\vee q$，于是 $r$。</p>` }] },

  mix5: { type: 'thm', imp: 3, title: '混合蕴含律 ⑤', alias: ['混合蕴含律'],
    body: R`$$\big(p\Rightarrow(q\Rightarrow r)\big)\Leftrightarrow\big((p\wedge q)\Rightarrow r\big)$$`,
    proofs: [
      { name: '等价变形', deps: ['implaw', 'assoc', 'demorgan'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow(\neg p)\vee\big((\neg q)\vee r\big)\\&\Leftrightarrow\big((\neg p)\vee(\neg q)\big)\vee r\\&\Leftrightarrow\neg(p\wedge q)\vee r\Leftrightarrow\text{右边}\end{aligned}$$` },
      { name: '推导', deps: ['m_iff', 'm_imp'],
        body: R`<p>「$\Rightarrow$」假设 $p\Rightarrow(q\Rightarrow r)$，再设 $p$ 与 $q$，要证 $r$：由 $p$ 得 $q\Rightarrow r$，再由 $q$ 得 $r$。</p><p>「$\Leftarrow$」假设 $(p\wedge q)\Rightarrow r$。要证 $p\Rightarrow(q\Rightarrow r)$：设 $p$，再设 $q$，要证 $r$。此时 $p\wedge q$ 成立，故 $r$。</p>` }] },

  forall: { type: 'def', imp: 3, title: '全称量词', alias: ['∀', '任意', 'for all'], deps: ['prop', 'symbols'],
    body: R`$$\forall x\in A,\ p(x)$$<p>读作：对于任意的 $x\in A$，都有 $p(x)$。</p>` },

  exists: { type: 'def', imp: 3, title: '存在量词', alias: ['∃', '存在', 'there exists', '∃!'], deps: ['prop', 'symbols'],
    body: R`$$\exists x\in A,\ p(x)$$<p>读作：存在一个 $x\in A$，使得 $p(x)$。$\exists!$ 表示存在唯一一个。</p>` },

  m_forall: { type: 'method', imp: 3, title: '证明全称命题', alias: ['证明任意'], deps: ['forall'],
    body: R`<p>要证明 $\forall x\in A,\ p(x)$：设 $x\in A$（任意取定），证明 $p(x)$。</p>` },

  m_exists: { type: 'method', imp: 3, title: '证明存在命题', alias: ['证明存在', '构造'], deps: ['exists'],
    body: R`<p>要证明 $\exists x\in A,\ p(x)$：直接找到一个 $x_0\in A$，验证它满足 $p(x_0)$。</p>` },

  ex_sq: { type: 'example', imp: 2, title: '例：任意实数的平方非负', alias: ['x²≥0'], attach: ['m_forall'],
    body: R`<p>证明 $\forall x\in\mathbb{R},\ x^2\geq 0$。</p>`,
    sols: [{ name: '分类讨论', deps: ['m_forall', 'm_case'],
      body: R`<p>设 $x\in\mathbb{R}$，分类讨论：</p><p>① 若 $x\geq 0$，则 $x^2=x\cdot x\geq 0$；</p><p>② 若 $x<0$，则 $-x>0$，于是 $x^2=(-x)^2>0$。</p>` }] },

  ex_100: { type: 'example', imp: 1, title: '例：存在平方大于 100 的实数', alias: ['x²>100'], attach: ['m_exists'],
    body: R`<p>证明 $\exists x\in\mathbb{R},\ x^2>100$。</p>`,
    sols: [{ name: '构造', deps: ['m_exists'], body: R`<p>取 $x_0=10000$，则 $x_0^2=10^8>100$。</p>` }] }
};
