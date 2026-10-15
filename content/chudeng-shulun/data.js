/* 初等数论 —— 由 Maki 手写讲义（72 页）录入。
   笔记里略去的证明在证明名里注明「补全」；笔误已改正。 */
const R = String.raw;

/* ---------- 泡泡树 ---------- */
const B = {
  root: { title: '初等数论', ordered: true, kids: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'] },

  c1: { title: '整除', tag: '第1章', ordered: true, desc: '从良序公理出发，证明带余除法，建立整除的基本性质。', kids: ['c1a', 'c1b'] },
  c1a: { title: '带余除法', ordered: true, kids: ['nt_n', 'divalg'] },
  c1b: { title: '整除及其性质', ordered: true, kids: ['div_def', 'div_basic', 'div_lin', 'div_trans', 'div_pm'] },

  c2: { title: '最大公因数与最小公倍数', tag: '第2章', ordered: true, desc: '辗转相除法、Bézout 定理，以及由它推出的一整套整除性质；最后解二元一次不定方程。', kids: ['c2a', 'c2b', 'c2c', 'c2d', 'c2e'] },
  c2a: { title: '定义', ordered: true, kids: ['gcd_def', 'coprime_def'] },
  c2b: { title: '辗转相除法与 Bézout 定理', ordered: true, kids: ['euclid_alg', 'bezout', 'ex_bezout', 'az_def', 'lincomb'] },
  c2c: { title: '公因数与互素', ordered: true, kids: ['cd_gcd', 'gcd_scale', 'gcd_reduce', 'euclid_lemma', 'euclid_cor', 'ex_10_12c'] },
  c2d: { title: '最小公倍数', ordered: true, kids: ['lcm_coprime', 'lcm_ideal', 'lcm_div', 'gcd_lcm', 'lcm_scale'] },
  c2e: { title: '二元一次不定方程', ordered: true, kids: ['ex_3x2y', 'lin_dioph'] },

  c3: { title: '素数与算术基本定理', tag: '第3章', ordered: true, desc: '素数有无穷多个；每个大于 1 的整数都唯一地分解成素数的乘积。', kids: ['c3a', 'c3b', 'c3c'] },
  c3a: { title: '素数', ordered: true, kids: ['prime_def', 'min_div_prime', 'inf_primes', 'prime_div'] },
  c3b: { title: '算术基本定理', ordered: true, kids: ['fta'] },
  c3c: { title: 'v_p 记号', ordered: true, kids: ['vp_def', 'vp_exact', 'vp_prod', 'vp_gcd_lcm'] },

  c4: { title: '同余', tag: '第4章', ordered: true, desc: '同余与同余类，ℤ/nℤ 上的加法和乘法，一次同余方程与乘法逆元。', kids: ['c4a', 'c4b', 'c4c', 'c4d'] },
  c4a: { title: '同余', ordered: true, kids: ['cong_def', 'cong_eqv', 'cong_arith'] },
  c4b: { title: '同余类与 ℤ/nℤ', ordered: true, kids: ['nt_z10', 'class_def', 'class_props', 'zn_def'] },
  c4c: { title: '一次同余方程', ordered: true, kids: ['inverse', 'lin_cong', 'ex_2x3'] },
  c4d: { title: '同余的约去', ordered: true, kids: ['cong_div', 'cong_prime', 'cong_cancel', 'cong_cancel2'] },

  c5: { title: '初等数论的经典定理', tag: '第5章', ordered: true, desc: 'Euler φ 函数、中国剩余定理、Euler 定理、Fermat 小定理、Lagrange 定理、Wilson 定理。', kids: ['c5a', 'c5b', 'c5c', 'c5d'] },
  c5a: { title: '乘法群 (ℤ/nℤ)ˣ', ordered: true, kids: ['coprime_mult', 'units_def', 'units_group', 'ex_units10'] },
  c5b: { title: 'Euler φ 函数与中国剩余定理', ordered: true, kids: ['phi_def', 'phi_pp', 'crt', 'crt_map', 'phi_mult', 'phi_formula', 'ex_phi120'] },
  c5c: { title: 'Euler 定理与 Fermat 小定理', ordered: true, kids: ['euler', 'ex_euler10', 'fermat', 'ex_fermat13'] },
  c5d: { title: 'Lagrange 定理与 Wilson 定理', ordered: true, kids: ['lagrange', 'ex_lagrange3', 'sq_one', 'wilson'] },

  c6: { title: '二次剩余', tag: '第6章', ordered: true, desc: 'Legendre 记号、Euler 判别法、(−1/p) 与 (2/p)、Gauss 引理，最后是二次互反律。', kids: ['c6a', 'c6b', 'c6c', 'c6d'] },
  c6a: { title: '二次同余方程与 Legendre 记号', ordered: true, kids: ['nt_quad', 'legendre_def', 'qr_count', 'qr_mult', 'legendre_mult'] },
  c6b: { title: 'Euler 判别法与 (−1/p)', ordered: true, kids: ['euler_crit', 'minus_one', 'sqrt_minus_one'] },
  c6c: { title: 'Gauss 引理与 (2/p)', ordered: true, kids: ['gauss_lemma', 'two_over_p'] },
  c6d: { title: '二次互反律', ordered: true, kids: ['qr_law'] },

  c7: { title: '原根', tag: '第7章', ordered: true, desc: '(ℤ/pℤ)ˣ 中元素的阶；模 p 的原根存在，并且恰有 φ(p−1) 个。', kids: ['c7a', 'c7b'] },
  c7a: { title: '元素的阶', ordered: true, kids: ['ord_def', 'ord_div', 'ord_distinct', 'ord_power'] },
  c7b: { title: '原根', ordered: true, kids: ['primroot_def', 'phi_sum', 'primroot_exist', 'primroot_count'] }
};

/* ---------- 节点 ---------- */
const N = {
  /* ===== 第 1 章 整除 ===== */
  nt_n: {
    type: 'note', imp: 2, title: '自然数、数学归纳法与良序公理', alias: ['N', '良序公理', '数学归纳法'],
    deps: ['shuxue-jichu:induction', 'shuxue-jichu:wellorder'],
    body: R`<p>本课约定 $\mathbb{N}=\{1,2,3,\dots\}$。</p>
<p><strong>数学归纳法.</strong> 对一族命题 $\{P(n):n\in\mathbb{N}\}$，</p>
$$\forall n\in\mathbb{N},\ P(n)\iff\begin{cases}P(1),\\ \forall n\in\mathbb{N},\ P(n)\Rightarrow P(n+1).\end{cases}$$
<p><strong>良序公理.</strong> 设 $\varnothing\ne A\subset\mathbb{N}$，则 $A$ 必有最小元素 $m$，即</p>
$$\begin{cases}m\in A,\\ \forall a\in A,\ m\le a.\end{cases}$$
<p>数学归纳法 $\iff$ 良序公理，证明见「数学基础」：[[shuxue-jichu:induction]]、[[shuxue-jichu:wellorder]]。整门课里「取最小的那个」都靠良序公理。</p>`
  },
  divalg: {
    type: 'thm', imp: 3, title: '带余除法', alias: ['division algorithm', '余数'],
    body: R`<p>设 $a\in\mathbb{Z}$，$b\in\mathbb{N}$。则存在<strong>唯一</strong>的 $q,r\in\mathbb{Z}$，满足</p>
$$\begin{cases}a=qb+r,\\ 0\le r\le b-1.\end{cases}$$`,
    proofs: [{
      name: '良序公理', deps: ['shuxue-jichu:wellorder'],
      body: R`<p><strong>存在性.</strong> 考虑 $S=\{a-qb:\ q\in\mathbb{Z}\}\cap\mathbb{Z}_{\ge0}$，即所有形如 $a-qb$ 的非负整数。$S\ne\varnothing$：取 $q=-|a|$，则 $a-qb=a+|a|b\ge a+|a|\ge0$。</p>
<p>由良序公理（$S$ 中若有 $0$ 则 $0$ 就是最小元；否则 $S\subset\mathbb{N}$），设 $r_0=\min S$，则存在 $q_0\in\mathbb{Z}$ 使得 $a-q_0b=r_0$，$r_0\ge0$。</p>
<p>目标：证明 $r_0\le b-1$。用反证法，假设 $r_0\ge b$，则</p>
$$0\le r_0-b=a-q_0b-b=a-(q_0+1)b\in S,$$
<p>而 $r_0-b<r_0$，这和 $r_0=\min S$ 矛盾。</p>
<p><strong>唯一性.</strong> 设 $a=q_1b+r_1=q_2b+r_2$，其中 $q_1,q_2,r_1,r_2\in\mathbb{Z}$，$0\le r_1,r_2\le b-1$。则</p>
$$(q_1-q_2)b=r_2-r_1\in[-(b-1),\,b-1].$$
<p>左边是 $b$ 的倍数，而区间 $[-(b-1),b-1]$ 里 $b$ 的倍数只有 $0$。因此 $q_1=q_2$，$r_1=r_2$。</p>`
    }]
  },
  div_def: {
    type: 'def', imp: 3, title: '整除', alias: ['倍数', '因数', 'divides', 'b|a'],
    deps: ['divalg'],
    body: R`<p>设 $a,b\in\mathbb{Z}$，$b\ne0$。若存在 $q\in\mathbb{Z}$ 使得 $a=qb$（当 $b>0$ 时，就是带余除法 $a=qb+r$ 中余数 $r=0$），则称</p>
<ul><li>$a$ 是 $b$ 的<strong>倍数</strong>，$b$ 是 $a$ 的<strong>因数</strong>；</li><li>$b$ <strong>整除</strong> $a$，记作 $b\mid a$；也说 $a$ 能被 $b$ 整除。</li></ul>
<p>否则记 $b\nmid a$。例：$2\mid 6$。</p>`
  },
  div_basic: {
    type: 'prop', imp: 1, title: '1 和 n 整除 n', alias: ['整除的性质 (1)'],
    body: R`<p>设 $n\in\mathbb{N}$，则 $1\mid n$，$n\mid n$。</p>`,
    proofs: [{ name: '直接验证', deps: ['div_def'], body: R`<p>$n=n\cdot1=1\cdot n$。</p>` }]
  },
  div_lin: {
    type: 'prop', imp: 3, title: '整除线性组合', alias: ['整除的性质 (2)', 'a|(kb+lc)'],
    body: R`<p>设 $a,b,c\in\mathbb{Z}$，$a\ne0$，且 $a\mid b$，$a\mid c$。则 $a\mid(b+c)$；更一般地，对任意 $k,l\in\mathbb{Z}$，</p>
$$a\mid(kb+lc).$$
<p>$kb+lc$ 叫做 $b$ 和 $c$ 的一个<strong>线性组合</strong>。</p>`,
    proofs: [{
      name: '直接验证', deps: ['div_def'],
      body: R`<p>设 $b=ad$，$c=ae$（$d,e\in\mathbb{Z}$），则</p>$$kb+lc=kad+lae=a(kd+le),$$<p>因此 $a\mid(kb+lc)$。取 $k=l=1$ 即得 $a\mid(b+c)$。</p>`
    }]
  },
  div_trans: {
    type: 'prop', imp: 2, title: '整除的传递性', alias: ['整除的性质 (3)'],
    body: R`<p>设 $a,b,c\in\mathbb{Z}$，$a,b\ne0$。若 $a\mid b$，$b\mid c$，则 $a\mid c$。</p>`,
    proofs: [{ name: '直接验证', deps: ['div_def'], body: R`<p>设 $b=ad$，$c=be$（$d,e\in\mathbb{Z}$），则 $c=be=ade$，故 $a\mid c$。</p>` }]
  },
  div_pm: {
    type: 'prop', imp: 2, title: '互相整除则相差符号', alias: ['整除的性质 (4)', 'a=±b'],
    body: R`<p>若 $a,b\in\mathbb{Z}$，$a,b\ne0$，且 $a\mid b$，$b\mid a$，则 $a=\pm b$。特别地，两个互相整除的正整数相等。</p>`,
    proofs: [{
      name: '直接验证', deps: ['div_def'],
      body: R`<p>设 $b=ad$，$a=be$（$d,e\in\mathbb{Z}$），则 $a=be=ade$。因为 $a\ne0$，约去得 $de=1$；$d,e$ 是整数，所以 $e=\pm1$。故 $a=\pm b$。</p>`
    }]
  },

  /* ===== 第 2 章 最大公因数与最小公倍数 ===== */
  gcd_def: {
    type: 'def', imp: 3, title: '最大公因数与最小公倍数', alias: ['gcd', 'lcm', 'greatest common divisor', 'least common multiple', '(a,b)', '[a,b]'],
    deps: ['div_def'],
    body: R`<p>设 $a,b\in\mathbb{N}$。定义</p>
<ul><li>$\gcd(a,b)$：$a$ 和 $b$ 最大的公因数（greatest common divisor），也记作 $(a,b)$；</li>
<li>$\operatorname{lcm}(a,b)$：$a$ 和 $b$ 最小的（正的）公倍数（least common multiple），也记作 $[a,b]$。</li></ul>
<p>公因数都不超过 $a$，且 $1$ 是公因数，所以最大公因数存在；$ab$ 是公倍数，由良序公理最小公倍数存在。</p>
<p><strong>例.</strong> $\gcd(10,12)=2$，$\operatorname{lcm}(10,12)=60$。注意到 $10\cdot12=120=2\cdot60$——这不是巧合，见 [[gcd_lcm]]。</p>`
  },
  coprime_def: {
    type: 'def', imp: 3, title: '互素', alias: ['互质', 'coprime', 'a⊥b'],
    deps: ['gcd_def'],
    body: R`<p>若 $a,b\in\mathbb{N}$ 且 $\gcd(a,b)=1$，则称 $a,b$ <strong>互素</strong>，记作 $a\perp b$。</p>`
  },
  euclid_alg: {
    type: 'method', imp: 3, title: '辗转相除法', alias: ['Euclid 算法', '欧几里得算法', 'Euclidean algorithm'],
    deps: ['divalg', 'gcd_def'],
    body: R`<p>求 $\gcd(a,b)$：对 $(a,b)$ 做带余除法 $a=qb+r$，换成 $(b,r)$ 继续，直到余数为 $0$；最后一个非零余数就是 $\gcd(a,b)$。</p>
<p><strong>例.</strong> 求 $\gcd(18,48)$。从 $(48,18)$ 开始：</p>
$$\begin{aligned}48&=2\cdot18+12&&(48,18)\\ 18&=1\cdot12+6&&(18,12)\\ 12&=2\cdot6&&(12,6)\end{aligned}$$
<p>因此 $\gcd(18,48)=6$。</p>`,
    proofs: [{
      name: '为什么可行（补全）', deps: ['div_lin'],
      body: R`<p>若 $a=qb+r$，则 $a,b$ 的公因数和 $b,r$ 的公因数完全相同：$e\mid a,\ e\mid b\Rightarrow e\mid a-qb=r$；反之 $e\mid b,\ e\mid r\Rightarrow e\mid qb+r=a$。所以 $\gcd(a,b)=\gcd(b,r)$。余数严格变小，有限步后为 $0$；而 $\gcd(d,0)$ 按约定为 $d$（$d\mid d$，$d\mid 0$）。</p>`
    }]
  },
  bezout: {
    type: 'thm', imp: 3, title: 'Bézout 定理（裴蜀定理）', alias: ['Bezout', '裴蜀定理', 'gcd=ka+lb'],
    body: R`<p>设 $a,b\in\mathbb{N}$，则存在 $k,l\in\mathbb{Z}$，使得</p>$$\gcd(a,b)=ka+lb.$$`,
    proofs: [{
      name: '取最小的正线性组合（补全）', deps: ['shuxue-jichu:wellorder', 'divalg', 'div_lin', 'gcd_def'],
      body: R`<p>笔记里只给了结论和例子，这里补上证明。</p>
<p>令 $S=\{ka+lb:\ k,l\in\mathbb{Z}\}\cap\mathbb{N}$。$a=1\cdot a+0\cdot b\in S$，故 $S\ne\varnothing$。由良序公理设 $d_0=\min S=k_0a+l_0b$。</p>
<p><strong>$d_0\mid a$.</strong> 做带余除法 $a=qd_0+r$，$0\le r\le d_0-1$。则 $r=a-q(k_0a+l_0b)=(1-qk_0)a+(-ql_0)b$ 也是 $a,b$ 的线性组合。若 $r>0$，则 $r\in S$ 且 $r<d_0$，与 $d_0$ 的最小性矛盾。故 $r=0$，$d_0\mid a$。同理 $d_0\mid b$。</p>
<p><strong>$d_0$ 是最大的.</strong> 设 $e$ 是 $a,b$ 的任一正公因数，则 $e\mid k_0a+l_0b=d_0$，所以 $e\le d_0$。</p>
<p>因此 $d_0=\gcd(a,b)$，即 $\gcd(a,b)=k_0a+l_0b$。</p>`
    }]
  },
  ex_bezout: {
    type: 'example', imp: 2, title: '例：把 gcd(18,48) 写成线性组合', alias: ['Bezout 例题'], attach: ['bezout', 'euclid_alg'],
    body: R`<p>求 $k,l\in\mathbb{Z}$，使得 $18k+48l=6=\gcd(18,48)$。</p>`,
    sols: [{
      name: '辗转相除倒推', deps: ['euclid_alg'],
      body: R`<p>由辗转相除法：$48=2\cdot18+12$，$18=1\cdot12+6$，$12=2\cdot6$。</p>
<p>思路：先把 $6$ 写成 $18,12$ 的线性组合，再写成 $48,18$ 的线性组合……</p>
$$\begin{aligned}6&=1\cdot18-1\cdot12\\&=1\cdot18-1\cdot(1\cdot48-2\cdot18)\\&=3\cdot18-1\cdot48.\end{aligned}$$
<p>所以 $k=3$，$l=-1$。</p>`
    }]
  },
  az_def: {
    type: 'def', imp: 2, title: 'aℤ', alias: ['倍数集', 'aZ'],
    deps: ['div_def'],
    body: R`<p>设 $a\in\mathbb{N}$，定义</p>$$a\mathbb{Z}=\{ak:\ k\in\mathbb{Z}\}=\{\dots,-2a,-a,0,a,2a,\dots\},$$<p>即 $a$ 的全体倍数。</p>`
  },
  lincomb: {
    type: 'thm', imp: 3, title: '线性组合全体 = gcd(a,b)ℤ', alias: ['{ka+lb} = gcd Z'],
    body: R`<p>若 $a,b\in\mathbb{N}$，则</p>$$\{ka+lb:\ k,l\in\mathbb{Z}\}=\gcd(a,b)\,\mathbb{Z}.$$<p>也就是说，$a,b$ 能凑出的数恰好是 $\gcd(a,b)$ 的全体倍数。</p>`,
    proofs: [{
      name: '两边互相包含', deps: ['bezout', 'az_def'],
      body: R`<p>设 $S=\{ka+lb:\ k,l\in\mathbb{Z}\}$，$d=\gcd(a,b)$。</p>
<p><strong>$d\mathbb{Z}\subset S$.</strong> 由 Bézout 定理 $d=k_0a+l_0b$。对任意 $m\in\mathbb{Z}$，$dm=(k_0m)a+(l_0m)b\in S$，即 $\{\dots,-2d,-d,0,d,2d,\dots\}\subset S$。</p>
<p><strong>$S\subset d\mathbb{Z}$.</strong> 设 $c=ka+lb$。设 $a=da'$，$b=db'$，则 $c=ka'd+lb'd=(ka'+lb')d\in d\mathbb{Z}$。</p>`
    }]
  },
  cd_gcd: {
    type: 'prop', imp: 3, title: '公因数整除最大公因数', alias: ['e|a, e|b ⇒ e|gcd'],
    body: R`<p>设 $a,b,e\in\mathbb{N}$。若 $e\mid a$，$e\mid b$，则 $e\mid\gcd(a,b)$。</p>`,
    proofs: [{
      name: 'Bézout', deps: ['bezout', 'div_lin'],
      body: R`<p>由 Bézout 定理，存在 $k,l\in\mathbb{Z}$ 使 $\gcd(a,b)=ka+lb$。由 $e\mid a$，$e\mid b$ 可知 $e\mid ka+lb=\gcd(a,b)$。</p>`
    }]
  },
  gcd_scale: {
    type: 'prop', imp: 2, title: 'gcd(ka,kb) = k·gcd(a,b)', alias: ['gcd 提公因子'],
    body: R`<p>设 $a,b,k\in\mathbb{N}$，则</p>$$\gcd(ka,kb)=k\gcd(a,b).$$`,
    proofs: [{
      name: '用线性组合的集合', deps: ['lincomb', 'div_pm'],
      body: R`<p>设 $S=\{m(ka)+n(kb):\ m,n\in\mathbb{Z}\}$。一方面由 [[lincomb]]，$S=\gcd(ka,kb)\mathbb{Z}$。另一方面</p>
$$S=\{(mk)a+(nk)b\}=\{k(ma+nb):\ m,n\in\mathbb{Z}\}=k\gcd(a,b)\mathbb{Z},$$
<p>因为 $\{ma+nb\}=\gcd(a,b)\mathbb{Z}$。两个正整数生成同一个倍数集，它们互相整除，故相等：$\gcd(ka,kb)=k\gcd(a,b)$。</p>`
    }, {
      name: '互相整除', deps: ['cd_gcd', 'div_pm'],
      body: R`<p>要证 $\gcd(ka,kb)=k\gcd(a,b)$，证两边互相整除。</p>
<p><strong>1°</strong> $k\gcd(a,b)\mid ka$，$k\gcd(a,b)\mid kb$，因此 $k\gcd(a,b)\mid\gcd(ka,kb)$。</p>
<p><strong>2°</strong> 要证 $\dfrac{\gcd(ka,kb)}{k}\mid\gcd(a,b)$。由于 $k\mid ka$，$k\mid kb$，因此 $k\mid\gcd(ka,kb)$，上式左边是整数。$\gcd(ka,kb)\mid ka$，设 $ka=\gcd(ka,kb)\,c$，则 $\dfrac{\gcd(ka,kb)}{k}\,c=a$，因此 $\dfrac{\gcd(ka,kb)}{k}\mid a$。同理 $\dfrac{\gcd(ka,kb)}{k}\mid b$。综上 $\dfrac{\gcd(ka,kb)}{k}\mid\gcd(a,b)$，故 $\gcd(ka,kb)\mid k\gcd(a,b)$。</p>
<p>两者都是正整数且互相整除，所以相等。</p>`
    }]
  },
  gcd_reduce: {
    type: 'prop', imp: 3, title: '除掉最大公因数后互素', alias: ['a/d, b/d 互素', '探究 a,b 之间的关系'],
    body: R`<p>设 $a,b\in\mathbb{N}$，$d=\gcd(a,b)$，$a=da'$，$b=db'$（$a',b'\in\mathbb{Z}$）。则 $\gcd(a',b')=1$。</p>
<p><strong>例.</strong> $\gcd(10,12)=2$，$10=2\cdot5$，$12=2\cdot6$，则 $\gcd(5,6)=1$。</p>`,
    proofs: [{
      name: '提公因子', deps: ['gcd_scale'],
      body: R`<p>$d\mid a$，$d\mid b$，所以 $a',b'\in\mathbb{N}$。</p>$$d=\gcd(a,b)=\gcd(da',db')=d\gcd(a',b'),$$<p>因此 $\gcd(a',b')=1$。</p>`
    }]
  },
  euclid_lemma: {
    type: 'prop', imp: 3, title: '互素时可以约去：a|bc, (a,b)=1 ⇒ a|c', alias: ['Euclid 引理', '欧几里得引理'],
    body: R`<p>设 $a,b\in\mathbb{N}$，$c\in\mathbb{Z}$。若 $a\mid bc$ 且 $\gcd(a,b)=1$，则 $a\mid c$。</p>`,
    proofs: [{
      name: 'Bézout', deps: ['bezout', 'div_lin'],
      body: R`<p>由 Bézout 定理，设 $ka+lb=1$（$k,l\in\mathbb{Z}$）。由 $a\mid bc$，设 $bc=ad$。目标：证明 $a\mid c$。</p>
<p>两边同乘 $c$：$kac+lbc=c$，即 $kac+lad=c$。于是 $a\mid(kac+lad)=c$。</p>`
    }]
  },
  euclid_cor: {
    type: 'prop', imp: 2, title: '推论：a|bc ⇒ a/gcd(a,b) | c', alias: ['Euclid 引理推论'],
    body: R`<p>设 $a,b\in\mathbb{N}$，$c\in\mathbb{Z}$。若 $a\mid bc$，则</p>$$\frac{a}{\gcd(a,b)}\ \Big|\ c.$$`,
    proofs: [{
      name: '约去 gcd', deps: ['gcd_reduce', 'euclid_lemma'],
      body: R`<p>$\gcd(a,b)$ 同时整除 $a$ 和 $b$。由 $a\mid bc$ 可知</p>$$\frac{a}{\gcd(a,b)}\ \Big|\ \frac{b}{\gcd(a,b)}\,c.$$<p>前面证明了 $\dfrac{a}{\gcd(a,b)}$ 与 $\dfrac{b}{\gcd(a,b)}$ 互素，由上一条性质可知 $\dfrac{a}{\gcd(a,b)}\mid c$。</p>`
    }]
  },
  ex_10_12c: {
    type: 'example', imp: 1, title: '例：10 | 12c ⇒ 5 | c', alias: [], attach: ['euclid_cor'],
    body: R`<p>设 $10\mid 12c$，求证 $5\mid c$。</p>`,
    sols: [{ name: '约去 gcd', deps: ['euclid_cor'], body: R`<p>$\gcd(10,12)=2$，所以 $5\mid 6c$；$\gcd(5,6)=1$，即 $5\mid c$。</p>` }]
  },
  lcm_coprime: {
    type: 'prop', imp: 2, title: '互素时 lcm(a,b) = ab', alias: [],
    body: R`<p>设 $a,b\in\mathbb{N}$，$\gcd(a,b)=1$，则 $\operatorname{lcm}(a,b)=ab$。更强地：$a,b$ 的每个公倍数都是 $ab$ 的倍数。</p>`,
    proofs: [{
      name: '直接证明', deps: ['euclid_lemma', 'gcd_def'],
      body: R`<p>首先，$ab$ 显然是 $a$ 和 $b$ 的公倍数。设 $m$ 是 $a$ 和 $b$ 的公倍数：$a\mid m$，$b\mid m$。</p>
<p>由 $a\mid m$，设 $m=ak$（$k\in\mathbb{Z}$）。由 $b\mid m$ 可知 $b\mid ak$。由 $\gcd(a,b)=1$ 可知 $b\mid k$。两边同乘 $a$：$ab\mid ak=m$。</p>
<p>故 $m$ 一定是 $ab$ 的倍数，最小的正公倍数就是 $ab$。因此 $\operatorname{lcm}(a,b)=ab$。</p>`
    }]
  },
  lcm_ideal: {
    type: 'thm', imp: 3, title: 'aℤ ∩ bℤ = lcm(a,b)ℤ，且 lcm = ab/gcd', alias: ['探究 aZ∩bZ', 'lcm 公式'],
    body: R`<p>设 $a,b\in\mathbb{N}$，则</p>$$a\mathbb{Z}\cap b\mathbb{Z}=\operatorname{lcm}(a,b)\,\mathbb{Z},\qquad \operatorname{lcm}(a,b)=\frac{ab}{\gcd(a,b)}.$$`,
    proofs: [{
      name: '先互素、再一般', deps: ['lcm_coprime', 'gcd_reduce', 'az_def', 'div_trans'],
      body: R`<p><strong>① 假设 $\gcd(a,b)=1$.</strong> 设 $m\in a\mathbb{Z}\cap b\mathbb{Z}$，即 $a\mid m$，$b\mid m$，则由上一条性质的证明可知 $ab\mid m$，即 $m\in ab\mathbb{Z}$。反过来，设 $n\in ab\mathbb{Z}$，则 $ab\mid n$，于是 $a\mid n$，$b\mid n$，故 $n\in a\mathbb{Z}\cap b\mathbb{Z}$。因此若 $\gcd(a,b)=1$，则 $a\mathbb{Z}\cap b\mathbb{Z}=ab\mathbb{Z}$。</p>
<p><strong>② 一般情形.</strong> 设 $d=\gcd(a,b)$，$a=da'$，$b=db'$，则 $\gcd(a',b')=1$，故 $a'\mathbb{Z}\cap b'\mathbb{Z}=a'b'\mathbb{Z}$。目标：证明 $a\mathbb{Z}\cap b\mathbb{Z}=da'b'\mathbb{Z}$（笔记说「可以通过两边互相包含来证明」，补全如下）。</p>
<p>「$\supset$」：$da'b'=a\cdot b'=b\cdot a'$ 同时是 $a$ 和 $b$ 的倍数，所以它的倍数都在 $a\mathbb{Z}\cap b\mathbb{Z}$ 里。</p>
<p>「$\subset$」：设 $m\in a\mathbb{Z}\cap b\mathbb{Z}$。由 $d\mid a\mid m$ 设 $m=dm'$。由 $da'\mid dm'$ 得 $a'\mid m'$，同理 $b'\mid m'$，所以 $m'\in a'\mathbb{Z}\cap b'\mathbb{Z}=a'b'\mathbb{Z}$，于是 $m=dm'\in da'b'\mathbb{Z}$。</p>
<p>$a\mathbb{Z}\cap b\mathbb{Z}$ 中最小的正数就是最小公倍数，所以</p>$$\operatorname{lcm}(a,b)=da'b'=d\cdot\frac{a}{d}\cdot\frac{b}{d}=\frac{ab}{d}=\frac{ab}{\gcd(a,b)},$$<p>并且 $a\mathbb{Z}\cap b\mathbb{Z}=\operatorname{lcm}(a,b)\mathbb{Z}$。</p>`
    }]
  },
  lcm_div: {
    type: 'prop', imp: 3, title: '公倍数是最小公倍数的倍数', alias: ['a|n, b|n ⇒ lcm|n'],
    body: R`<p>设 $a,b\in\mathbb{N}$，$n\in\mathbb{Z}$。若 $a\mid n$，$b\mid n$，则 $\operatorname{lcm}(a,b)\mid n$。</p><p>（回顾对偶的结论：$e\mid a,\ e\mid b\Rightarrow e\mid\gcd(a,b)$，见 [[cd_gcd]]。）</p>`,
    proofs: [{
      name: '用 aℤ∩bℤ', deps: ['lcm_ideal'],
      body: R`<p>$a\mathbb{Z}\cap b\mathbb{Z}=\operatorname{lcm}(a,b)\mathbb{Z}$。由 $a\mid n$，$b\mid n$ 可知 $n\in a\mathbb{Z}\cap b\mathbb{Z}=\operatorname{lcm}(a,b)\mathbb{Z}$，故 $\operatorname{lcm}(a,b)\mid n$。</p>`
    }]
  },
  gcd_lcm: {
    type: 'prop', imp: 3, title: 'gcd(a,b)·lcm(a,b) = ab', alias: ['gcd 乘 lcm'],
    body: R`<p>若 $a,b\in\mathbb{N}$，则</p>$$\gcd(a,b)\operatorname{lcm}(a,b)=ab.$$`,
    proofs: [{
      name: '由 lcm 公式', deps: ['lcm_ideal'],
      body: R`<p>由 $\operatorname{lcm}(a,b)=\dfrac{ab}{\gcd(a,b)}$ 易知。</p>`
    }, {
      name: '重新证明：两边互相整除', deps: ['cd_gcd', 'lcm_div', 'div_pm'],
      body: R`<p><strong>① 「右边 | 左边」.</strong> 要证 $\dfrac{ab}{\operatorname{lcm}(a,b)}\mid\gcd(a,b)$，只需证 $\dfrac{ab}{\operatorname{lcm}(a,b)}\mid a$（同理 $\mid b$，再用 [[cd_gcd]]）。由 $a\mid ab$，$b\mid ab$ 可知 $\operatorname{lcm}(a,b)\mid ab$，所以左边是整数；又</p>$$a\Big/\frac{ab}{\operatorname{lcm}(a,b)}=\frac{\operatorname{lcm}(a,b)}{b}\in\mathbb{Z},$$<p>由于 $b\mid\operatorname{lcm}(a,b)$。</p>
<p><strong>② 「左边 | 右边」.</strong> 要证 $\operatorname{lcm}(a,b)\mid\dfrac{ab}{\gcd(a,b)}\in\mathbb{Z}$，只需证 $a\mid\dfrac{ab}{\gcd(a,b)}$（同理 $b\mid$，再用 [[lcm_div]]）：</p>$$\frac{ab}{\gcd(a,b)}\Big/a=\frac{b}{\gcd(a,b)}\in\mathbb{Z},$$<p>由于 $\gcd(a,b)\mid b$。</p>
<p>综上所述，$\gcd(a,b)\operatorname{lcm}(a,b)=ab$。</p>`
    }, {
      name: '用 v_p：min + max = 和', deps: ['vp_gcd_lcm'],
      body: R`<p>对实数 $a,b$ 有 $\min(a,b)+\max(a,b)=a+b$。所以</p>
$$\begin{aligned}\gcd(m,n)\operatorname{lcm}(m,n)&=\prod_p p^{\min(v_p(m),v_p(n))+\max(v_p(m),v_p(n))}=\prod_p p^{v_p(m)+v_p(n)}\\&=\prod_p\big(p^{v_p(m)}p^{v_p(n)}\big)=\Big(\prod_p p^{v_p(m)}\Big)\Big(\prod_p p^{v_p(n)}\Big)=mn.\end{aligned}$$`
    }]
  },
  lcm_scale: {
    type: 'prop', imp: 1, title: 'lcm(ka,kb) = k·lcm(a,b)', alias: [],
    body: R`<p>设 $a,b,k\in\mathbb{N}$，则 $\operatorname{lcm}(ka,kb)=k\operatorname{lcm}(a,b)$。</p>`,
    proofs: [{
      name: '由 gcd·lcm = ab（补全）', deps: ['gcd_lcm', 'gcd_scale'],
      body: R`<p>$$\operatorname{lcm}(ka,kb)=\frac{ka\cdot kb}{\gcd(ka,kb)}=\frac{k^2ab}{k\gcd(a,b)}=k\cdot\frac{ab}{\gcd(a,b)}=k\operatorname{lcm}(a,b).$$</p>`
    }]
  },
  ex_3x2y: {
    type: 'example', imp: 2, title: '例：解 3x + 2y = 1', alias: ['二元一次方程', '不定方程'], attach: ['euclid_lemma'],
    body: R`<p>求方程 $3x+2y=1$ 的全部整数解。</p>`,
    sols: [{
      name: '齐次化', deps: ['euclid_lemma'],
      body: R`<p>$(x_0,y_0)=(1,-1)$ 是一组解。于是 $3x+2y=1=3x_0+2y_0$，</p>
$$3(x-x_0)=2(y_0-y).\qquad\text{①}$$
<p>$3\mid 3(x-x_0)=2(y_0-y)$，即 $3\mid 2(y_0-y)$。由 $\gcd(3,2)=1$ 可知 $3\mid(y_0-y)$。设 $y_0-y=3k$（$k\in\mathbb{Z}$），代入 ① 式得 $x-x_0=2k$。所以</p>
$$\begin{cases}x=x_0+2k=1+2k,\\ y=y_0-3k=-1-3k,\end{cases}\qquad (x,y)=(1+2k,\,-1-3k)\ (k\in\mathbb{Z}).$$`
    }]
  },
  lin_dioph: {
    type: 'thm', imp: 3, title: '二元一次不定方程 ax + by = c', alias: ['不定方程', 'linear Diophantine equation'],
    body: R`<p>设 $a,b\in\mathbb{N}$，$c\in\mathbb{Z}$，考虑 $ax+by=c$（$x,y\in\mathbb{Z}$）。</p>
<ol class="plain"><li>① 若 $\gcd(a,b)\nmid c$，则原方程无解。</li>
<li>② 若 $\gcd(a,b)\mid c$，则有解；取一组解 $(x_0,y_0)$，全部解为
$$(x,y)=\Big(x_0+m\frac{b}{\gcd(a,b)},\ y_0-m\frac{a}{\gcd(a,b)}\Big)\qquad(m\in\mathbb{Z}).$$</li></ol>`,
    proofs: [{
      name: '先找一组解，再齐次化', deps: ['lincomb', 'bezout', 'gcd_reduce', 'euclid_lemma'],
      body: R`<p>注意到 $\{ax+by:\ x,y\in\mathbb{Z}\}=\gcd(a,b)\mathbb{Z}$。</p>
<p><strong>①</strong> 若 $\gcd(a,b)\nmid c$，则 $c\notin\gcd(a,b)\mathbb{Z}$，原方程无解。</p>
<p><strong>②</strong> 若 $\gcd(a,b)\mid c$，设 $c=\gcd(a,b)\,e$。由 Bézout 定理设 $\gcd(a,b)=ka+lb$，两边同乘 $e$：$c=kea+leb$。设 $x_0=ke$，$y_0=le$，则 $(x_0,y_0)$ 是一组解。</p>
<p>对任一解：$ax+by=c=ax_0+by_0$，所以 $a(x-x_0)=b(y_0-y)$，两边除以 $\gcd(a,b)$：</p>
$$\frac{a}{\gcd(a,b)}(x-x_0)=\frac{b}{\gcd(a,b)}(y_0-y).$$
<p>两个系数互素，于是 $\dfrac{a}{\gcd(a,b)}\mid(y_0-y)$。设 $y_0-y=m\dfrac{a}{\gcd(a,b)}$（$m\in\mathbb{Z}$），则 $x-x_0=m\dfrac{b}{\gcd(a,b)}$。故</p>
$$\begin{cases}x=x_0+m\dfrac{b}{\gcd(a,b)},\\[2mm] y=y_0-m\dfrac{a}{\gcd(a,b)}\end{cases}\quad(m\in\mathbb{Z}).$$
<p>反过来，直接代入可验证这些都是解。</p>`
    }]
  },

  /* ===== 第 3 章 素数与算术基本定理 ===== */
  prime_def: {
    type: 'def', imp: 3, title: '素数与合数', alias: ['质数', 'prime', '合数'],
    deps: ['div_def'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$。若 $n$ 唯二的（正）因数是 $1$ 和 $n$，则称 $n$ 是一个<strong>素数</strong>；否则称 $n$ 是<strong>合数</strong>。</p>
<p>正整数分成三类：</p>
$$\text{正整数}\begin{cases}1\\ \text{素数}&2,3,5,7,11,\dots\\ \text{合数}&4,6,8,9,10,\dots\end{cases}$$`
  },
  min_div_prime: {
    type: 'prop', imp: 2, title: '最小的非 1 正因数是素数', alias: ['(*)', '最小素因子'],
    body: R`<p>若 $a\in\mathbb{N}$，$a\ge2$，则除了 $1$ 以外，$a$ 最小的正因数一定是素数。特别地，每个 $a\ge2$ 都有素因数。</p>`,
    proofs: [{
      name: '反证法', deps: ['prime_def', 'div_trans', 'shuxue-jichu:wellorder'],
      body: R`<p>$a$ 的大于 $1$ 的正因数构成非空集合（$a$ 本身在内），由良序公理有最小元，设这个数为 $p\ne1$，所以 $p\ge2$。</p>
<p>用反证法，假设 $p$ 不是素数，则 $p=bc$（$b,c\in\mathbb{N}$，$b,c\ge2$）。$b\mid p\mid a$，所以 $b\mid a$。因此 $b$ 是比 $p$ 更小的、至少为 $2$ 的 $a$ 的正因数，这和 $p$ 的最小性矛盾。</p>`
    }]
  },
  inf_primes: {
    type: 'thm', imp: 3, title: '素数有无穷多个', alias: ['Euclid', '欧几里得定理'],
    body: R`<p>素数有无穷多个。</p>`,
    proofs: [{
      name: '反证法（Euclid）', deps: ['min_div_prime', 'div_lin'],
      body: R`<p>用反证法。设只有 $k$ 个素数：$p_1<\dots<p_k$。令</p>$$N=p_1\cdots p_k+1.$$
<p>因为 $N>p_i$（$1\le i\le k$），所以 $N$ 不是素数；显然 $N\ge2$，故 $N$ 是一个合数。</p>
<p>设 $p$ 是 $N$ 的最小的至少为 $2$ 的正因数，由 [[min_div_prime]]，$p$ 一定是素数，设 $p=p_i$。则 $p_i\mid N=p_1\cdots p_i\cdots p_k+1$；又因为 $p_i\mid p_1\cdots p_i\cdots p_k$，所以 $p_i\mid 1$，不可能，矛盾。</p>`
    }]
  },
  prime_div: {
    type: 'prop', imp: 3, title: '素数整除乘积则整除某个因子', alias: ['p|ab ⇒ p|a 或 p|b', 'Euclid 引理（素数版）'],
    body: R`<p>设 $p$ 是素数，$a,b\in\mathbb{Z}$。若 $p\mid ab$，则 $p\mid a$ 或 $p\mid b$。</p>
<p><strong>注.</strong> $6\mid 2\cdot3$，但 $6\nmid2$ 且 $6\nmid3$。所以这个性质只对素数成立。</p>
<p>由归纳法，若 $p\mid a_1a_2\cdots a_r$，则 $p$ 整除某个 $a_i$。</p>`,
    proofs: [{
      name: '用 gcd(a,p)', deps: ['prime_def', 'euclid_lemma'],
      body: R`<p>设 $p\mid ab$，$p\nmid a$，只需证明 $p\mid b$。</p>
<p>$\gcd(a,p)\mid p$，故 $\gcd(a,p)=1$ 或 $p$。由 $p\nmid a$ 可知 $\gcd(a,p)\ne p$，所以 $\gcd(a,p)=1$。由 $p\mid ab$，$\gcd(p,a)=1$ 可知 $p\mid b$。</p>`
    }]
  },
  fta: {
    type: 'thm', imp: 3, title: '算术基本定理', alias: ['唯一分解定理', 'fundamental theorem of arithmetic', '素因数分解'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，则 $n$ 存在唯一的素因数分解</p>
$$n=p_1^{\alpha_1}\cdots p_k^{\alpha_k},\qquad\begin{cases}p_1<\dots<p_k\ \text{是素数},\\ \alpha_1,\dots,\alpha_k\ \text{是正整数}.\end{cases}$$
<p><strong>例.</strong> $12=2^2\cdot3$，$180=2^2\cdot3^2\cdot5$。</p>`,
    proofs: [{
      name: '强归纳 + 素数的性质', deps: ['shuxue-jichu:strong_ind', 'min_div_prime', 'prime_div'],
      body: R`<p><strong>存在性.</strong></p>
<p>① 当 $n=2$ 时，$2=2^1$。</p>
<p>② 假设算术基本定理对 $2,\dots,n-1$ 都成立（$n\ge3$），下面证明对 $n$ 成立。</p>
<p>1° 若 $n$ 是素数，$n=n^1$。</p>
<p>2° 若 $n$ 是合数，设 $n$ 除了 $1$ 以外最小的因数为 $p$，则由 [[min_div_prime]] 可知 $p$ 是素数。设 $n=pm$，$p\ge2$，故 $2\le m<n$。由归纳假设设 $m=p_1^{\alpha_1}\cdots p_k^{\alpha_k}$，把 $p$ 并进去（若 $p$ 是某个 $p_i$ 就把 $\alpha_i$ 加 $1$，否则添一个因子 $p^1$）即得 $n$ 的分解。</p>
<p><strong>唯一性.</strong> 设</p>$$n=p_1^{\alpha_1}\cdots p_k^{\alpha_k}=q_1^{\beta_1}\cdots q_l^{\beta_l},$$<p>其中 $p_1<\dots<p_k$，$q_1<\dots<q_l$ 是素数，$\alpha_i,\beta_j,k,l\in\mathbb{N}$。</p>
<p>$p_1\mid q_1^{\beta_1}\cdots q_l^{\beta_l}$。由素数的性质，存在 $q_j$（$1\le j\le l$）使 $p_1\mid q_j$，于是 $p_1=q_j$。</p>
<p>目标：证明 $j=1$。用反证法，假设 $j\ge2$，则 $q_1\mid n$，$q_1<q_j=p_1$。同理 $q_1\mid p_1^{\alpha_1}\cdots p_k^{\alpha_k}$，存在 $p_i$ 使 $q_1=p_i\ge p_1$。但是 $q_1<p_1$，矛盾。因此 $p_1=q_1$。</p>
<p>（补全）再证 $\alpha_1=\beta_1$：若 $\alpha_1<\beta_1$，两边约去 $p_1^{\alpha_1}$ 后，右边仍含因子 $p_1$，而左边 $p_2^{\alpha_2}\cdots p_k^{\alpha_k}$ 的素因子都大于 $p_1$，由素数的性质 $p_1$ 不整除左边，矛盾；同理 $\alpha_1>\beta_1$ 也不行。</p>
<p>约去 $p_1^{\alpha_1}$ 后得到更小的数 $n/p_1^{\alpha_1}$ 的两个分解，不断重复此操作（对 $n$ 归纳）：</p>
$$\begin{cases}p_1=q_1,&\alpha_1=\beta_1,\\ p_2=q_2,&\alpha_2=\beta_2,\\ \quad\vdots\\ p_k=q_k,&\alpha_k=\beta_k,\\ k=l.\end{cases}$$`
    }]
  },
  vp_def: {
    type: 'def', imp: 2, title: 'v_p 记号与恰好整除', alias: ['p-adic valuation', 'p 进赋值', '恰好整除', 'p^n‖a'],
    deps: ['fta'],
    body: R`<p><strong>$v_p$ 记号.</strong> 设 $p$ 是素数，$n\in\mathbb{N}$，$n\ge2$。</p>
<ul><li>若 $p\nmid n$，定义 $v_p(n)=0$；</li>
<li>若 $p\mid n$，设 $n=p^{\alpha}p_1^{\alpha_1}\cdots p_k^{\alpha_k}$（$p,p_1,\dots,p_k$ 是互异的素数，$\alpha,\alpha_1,\dots,\alpha_k\in\mathbb{N}$），定义 $v_p(n)=\alpha$。</li></ul>
<p>（约定 $v_p(1)=0$。）</p>
<p><strong>例.</strong> $n=12=2^2\cdot3$：$v_2(12)=2$，$v_3(12)=1$，$v_5(12)=0$。</p>
<p><strong>恰好整除.</strong> 设 $p$ 是素数，$n,a\in\mathbb{N}$。若 $p^n\mid a$ 且 $p^{n+1}\nmid a$，则记 $p^n\parallel a$，称 $p^n$ <strong>恰好整除</strong> $a$。</p>`
  },
  vp_exact: {
    type: 'prop', imp: 1, title: 'p^{v_p(m)} 恰好整除 m', alias: [],
    body: R`<p>若 $p\mid m$，则 $p^{v_p(m)}\parallel m$。</p>`,
    proofs: [{
      name: '由唯一分解（补全）', deps: ['vp_def', 'fta', 'prime_div'],
      body: R`<p>设 $m=p^{\alpha}p_1^{\alpha_1}\cdots p_k^{\alpha_k}$，$\alpha=v_p(m)$。显然 $p^\alpha\mid m$。若 $p^{\alpha+1}\mid m$，则 $p\mid p_1^{\alpha_1}\cdots p_k^{\alpha_k}$，由素数的性质 $p$ 等于某个 $p_i$，与互异矛盾。</p>`
    }]
  },
  vp_prod: {
    type: 'prop', imp: 2, title: 'n = ∏ p^{v_p(n)}', alias: [],
    body: R`<p>若 $n\in\mathbb{N}$，$n\ge2$，则</p>$$n=\prod_{p\ \text{素数}}p^{v_p(n)},$$<p>这是一个有限乘积（只有 $p\mid n$ 的项不等于 $1$）。</p>`,
    proofs: [{ name: '由定义', deps: ['vp_def', 'fta'], body: R`<p>就是把算术基本定理的分解 $n=p_1^{\alpha_1}\cdots p_k^{\alpha_k}$ 用 $v_{p_i}(n)=\alpha_i$ 重写；其余素数的指数为 $0$。</p>` }]
  },
  vp_gcd_lcm: {
    type: 'prop', imp: 2, title: 'v_p(gcd) = min，v_p(lcm) = max', alias: ['gcd 的素因数分解', 'lcm 的素因数分解'],
    body: R`<p>设 $m,n\in\mathbb{N}$，$p$ 是素数，则</p>
$$\begin{cases}v_p(\gcd(m,n))=\min(v_p(m),v_p(n)),\\ v_p(\operatorname{lcm}(m,n))=\max(v_p(m),v_p(n)),\end{cases}$$
<p>即</p>
$$\gcd(m,n)=\prod_p p^{\min(v_p(m),v_p(n))},\qquad \operatorname{lcm}(m,n)=\prod_p p^{\max(v_p(m),v_p(n))}.$$`,
    proofs: [{
      name: '比较指数（补全）', deps: ['vp_prod', 'vp_exact', 'gcd_def'],
      body: R`<p>笔记直接给出了结论，这里补上理由。关键事实：对正整数 $d,m$，</p>$$d\mid m\iff \text{对每个素数 }p,\ v_p(d)\le v_p(m).$$
<p>「$\Leftarrow$」：$m/d=\prod_p p^{v_p(m)-v_p(d)}$ 是整数。「$\Rightarrow$」：若 $m=de$，由唯一分解，$m$ 的分解就是 $d$ 与 $e$ 的分解合并，所以 $v_p(m)=v_p(d)+v_p(e)\ge v_p(d)$。</p>
<p>于是 $d$ 是 $m,n$ 的公因数 $\iff$ 对每个 $p$，$v_p(d)\le\min(v_p(m),v_p(n))$。在这些 $d$ 中最大的就是每个指数都取到上限的 $\prod_p p^{\min(v_p(m),v_p(n))}$。lcm 同理：公倍数 $\iff$ 每个 $v_p\ge\max$，最小的取等号。</p>`
    }]
  },

  /* ===== 第 4 章 同余 ===== */
  cong_def: {
    type: 'def', imp: 3, title: '同余', alias: ['congruence', 'mod', '模'],
    deps: ['div_def'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$a,b\in\mathbb{Z}$。若 $n\mid(a-b)$，则记</p>$$a\equiv b\pmod n,$$<p>读作 $a$ 与 $b$ 模 $n$ <strong>同余</strong>；$n$ 叫做<strong>模</strong>。</p>
<p><strong>例.</strong> $-18\equiv-8\equiv2\equiv12\equiv22\pmod{10}$。</p>`
  },
  cong_eqv: {
    type: 'prop', imp: 2, title: '同余是等价关系', alias: ['自反', '对称', '传递'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$a,b,c\in\mathbb{Z}$。</p>
<ol class="plain"><li>(1) $a\equiv a\pmod n$；</li><li>(2) 若 $a\equiv b\pmod n$，则 $b\equiv a\pmod n$；</li><li>(3) 若 $a\equiv b\pmod n$，$b\equiv c\pmod n$，则 $a\equiv c\pmod n$。</li></ol>`,
    proofs: [{
      name: '直接验证', deps: ['cong_def', 'div_lin'],
      body: R`<p>(1) $n\mid0$。(2) $n\mid(a-b)\Rightarrow n\mid(b-a)$。</p><p>(3) $n\mid(a-b)$，$n\mid(b-c)$，故 $n\mid(a-b)+(b-c)=a-c$，因此 $a\equiv c\pmod n$。</p>`
    }]
  },
  cong_arith: {
    type: 'prop', imp: 3, title: '同余可以相加、相乘、乘方', alias: ['同余的运算'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$a,b,c,d\in\mathbb{Z}$，$k\in\mathbb{N}$。</p>
<ol class="plain"><li>(4) 若 $a\equiv b\pmod n$，$c\equiv d\pmod n$，则 $a+c\equiv b+d\pmod n$，$ac\equiv bd\pmod n$；</li>
<li>(5) 若 $a\equiv b\pmod n$，则 $a^k\equiv b^k\pmod n$。</li></ol>`,
    proofs: [{
      name: '直接验证', deps: ['cong_def', 'div_lin', 'shuxue-jichu:induction'],
      body: R`<p>(4) $n\mid(a-b)$，$n\mid(c-d)$，所以 $n\mid(a+c)-(b+d)$，故 $a+c\equiv b+d\pmod n$。</p>
<p>设 $a-b=kn$，$c-d=ln$，则</p>$$ac=(b+kn)(d+ln)=bd+\underbrace{bln+kdn+kln^2}_{n\text{ 的倍数}}\equiv bd\pmod n.$$
<p>(5) 由 $a\equiv b$，$a\equiv b$ 有 $a^2\equiv b^2\pmod n$，……由归纳法，$a^k\equiv b^k\pmod n$。</p>`
    }]
  },
  nt_z10: {
    type: 'note', imp: 2, title: '探究：模 10 把整数分成 10 类', alias: [],
    deps: ['cong_eqv'],
    body: R`<p>当 $n=10$ 时：</p>
$$\begin{array}{ll}\cdots\equiv-10\equiv0\equiv10\equiv20\equiv\cdots & \overline{0}=\{\dots,0,10,\dots\}\\ \cdots\equiv-9\equiv1\equiv11\equiv\cdots & \overline{1}=\{\dots,1,11,\dots\}\\ \cdots\equiv2\equiv12\equiv\cdots & \quad\vdots\\ \cdots\equiv-1\equiv9\equiv19\equiv\cdots & \overline{9}=\{\dots,9,19,\dots\}\end{array}$$
<p>$\mathbb{Z}/10\mathbb{Z}=\{\overline{0},\overline{1},\dots,\overline{9}\}$。$\mathbb{Z}/10\mathbb{Z}$ 上面可以做加、乘运算。</p>`
  },
  class_def: {
    type: 'def', imp: 3, title: '同余类', alias: ['剩余类', 'residue class', 'ā'],
    deps: ['cong_def'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$a\in\mathbb{Z}$。定义</p>$$\overline{a}=\{b\in\mathbb{Z}:\ b\equiv a\pmod n\},$$<p>称为 $a$ 的模 $n$ <strong>同余类</strong>。</p>`
  },
  class_props: {
    type: 'prop', imp: 2, title: '同余类要么相等要么不交，ā = a + nℤ', alias: [],
    body: R`<p>若 $n\in\mathbb{N}$，$n\ge2$，$a,b\in\mathbb{Z}$：</p>
<ol class="plain"><li>① 若 $a\equiv b\pmod n$，则 $\overline{a}=\overline{b}$；</li><li>② 若 $a\not\equiv b\pmod n$，则 $\overline{a}\cap\overline{b}=\varnothing$。</li></ol>
<p>并且</p>$$\overline{a}=\{\dots,a-n,a,a+n,a+2n,\dots\}=a+\{\dots,-n,0,n,2n,\dots\}=a+n\mathbb{Z},$$<p>即把 $n\mathbb{Z}$ 的每个元素都加上 $a$。</p>`,
    proofs: [{
      name: '由等价关系（补全）', deps: ['cong_eqv', 'class_def', 'az_def'],
      body: R`<p>① 设 $a\equiv b$。若 $c\in\overline{a}$，即 $c\equiv a$，由传递性 $c\equiv b$，$c\in\overline{b}$；反之亦然。</p>
<p>② 若 $c\in\overline{a}\cap\overline{b}$，则 $c\equiv a$，$c\equiv b$，由对称、传递得 $a\equiv b$，矛盾。</p>
<p>最后，$b\equiv a\iff n\mid b-a\iff b-a\in n\mathbb{Z}\iff b\in a+n\mathbb{Z}$。</p>`
    }]
  },
  zn_def: {
    type: 'def', imp: 3, title: 'ℤ/nℤ', alias: ['模 n 加法群', 'Z/nZ', '剩余类环'],
    deps: ['class_props', 'cong_arith', 'divalg'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$。定义</p>$$\mathbb{Z}/n\mathbb{Z}=\{\overline{a}:\ 0\le a\le n-1\}=\{a+n\mathbb{Z}:\ 0\le a\le n-1\}.$$
<p>由带余除法，每个整数恰好落在其中一类里。定义 $\overline{a}+\overline{b}=\overline{a+b}$，$\overline{a}\cdot\overline{b}=\overline{ab}$；由 [[cong_arith]]，结果与代表元的选取无关。</p>
<p><strong>例.</strong> $n=10$：$\overline{3}+\overline{8}=\overline{11}=\overline{1}$，$\overline{3}\cdot\overline{8}=\overline{24}=\overline{4}$。</p>
<p><strong>例.</strong> $n=7$：$\overline{4}+\overline{5}=\overline{9}=\overline{2}$，$\overline{4}\cdot\overline{5}=\overline{20}=\overline{-1}=\overline{6}$。</p>`
  },
  inverse: {
    type: 'thm', imp: 3, title: '乘法逆元：ax ≡ 1 (mod n)', alias: ['逆元', 'modular inverse', 'a^{-1}'],
    body: R`<p>若 $a\in\mathbb{Z}$，$a\ne0$，$n\in\mathbb{N}$，$n\ge2$，则同余方程 $ax\equiv1\pmod n$：</p>
$$\begin{cases}\text{无解}, & \gcd(a,n)\ne1,\\ \text{存在唯一解}\ (\mathrm{mod}\ n), & \gcd(a,n)=1.\end{cases}$$
<p>$\gcd(a,n)=1$ 时这个解称为 $a$ 的（模 $n$）<strong>乘法逆元</strong>，记作 $a^{-1}\pmod n$。</p>
<p>（探究：$x+b\equiv c\pmod n$ 很简单，$x\equiv c-b$；乘法就要问能不能「除以 $a$」。）</p>`,
    proofs: [{
      name: '转化为 xa + kn = 1', deps: ['lincomb', 'euclid_lemma', 'cong_def'],
      body: R`<p>$ax\equiv1\pmod n$ 有解 $\iff$ 存在 $x\in\mathbb{Z}$，存在 $k\in\mathbb{Z}$：$ax-1=kn$，即 $xa+kn=1$——这是 $a$ 与 $n$ 的线性组合。</p>
<p><strong>1°</strong> 若 $\gcd(a,n)\ne1$，则 $xa+kn$ 总是 $\gcd(a,n)$ 的倍数，不可能等于 $1$，显然这样的 $x,k$ 不存在，$ax\equiv1\pmod n$ 无解。</p>
<p><strong>2°</strong> 若 $\gcd(a,n)=1$，则存在 $x,k\in\mathbb{Z}$ 使得 $ax+kn=1$，故 $ax\equiv1\pmod n$ 有解。</p>
<p>进一步，设 $x_1,x_2$ 都是解，则 $ax_1\equiv ax_2\pmod n$，$n\mid a(x_1-x_2)$。由 $\gcd(n,a)=1$ 可知 $n\mid(x_1-x_2)$，即 $x_1\equiv x_2\pmod n$。</p>`
    }]
  },
  lin_cong: {
    type: 'thm', imp: 3, title: '一次同余方程 ax ≡ b (mod n)', alias: ['线性同余方程'],
    body: R`<p>若 $a\in\mathbb{Z}$，$a\ne0$，$n\in\mathbb{N}$，$n\ge2$，$b\in\mathbb{Z}$，则 $ax\equiv b\pmod n$：</p>
$$\begin{cases}\text{无解}, & \gcd(a,n)\nmid b,\\ \text{有 }\gcd(a,n)\text{ 个不同的模 }n\text{ 的解}, & \gcd(a,n)\mid b,\end{cases}$$
<p>后一种情形的解为 $x\equiv x_0+k\dfrac{n}{\gcd(a,n)}\pmod n$（$0\le k\le\gcd(a,n)-1$），$x_0$ 是任一特解。</p>`,
    proofs: [{
      name: '转化为 xa + kn = b', deps: ['lincomb', 'euclid_cor', 'cong_def'],
      body: R`<p>希望存在 $x\in\mathbb{Z}$，$k\in\mathbb{Z}$：$ax-b=kn$，即 $xa+kn=b$。</p>
<p><strong>1°</strong> 若 $\gcd(a,n)\nmid b$，$b\notin\gcd(a,n)\mathbb{Z}$，无解。</p>
<p><strong>2°</strong> 若 $\gcd(a,n)\mid b$，设 $x_0a+k_0n=b$（$k_0,x_0\in\mathbb{Z}$），则 $ax_0\equiv b\pmod n$，原方程有解。</p>
<p>假设 $ax\equiv b\pmod n$，则 $ax\equiv ax_0\pmod n$，$n\mid a(x-x_0)$，于是 $\dfrac{n}{\gcd(a,n)}\mid(x-x_0)$，</p>
$$x=x_0+k\frac{n}{\gcd(a,n)}\pmod n\qquad(0\le k\le\gcd(a,n)-1).$$
<p>反过来这些都是解；并且它们两两不同余：两个的差是 $(k-k')\dfrac{n}{\gcd(a,n)}$，$0<|k-k'|<\gcd(a,n)$，绝对值小于 $n$ 且不为 $0$（补全）。所以原方程有 $\gcd(a,n)$ 个模 $n$ 下的解。</p>`
    }]
  },
  ex_2x3: {
    type: 'example', imp: 2, title: '例：解 2x ≡ 3 (mod 5)', alias: [], attach: ['inverse'],
    body: R`<p>解同余方程 $2x\equiv3\pmod 5$。</p>`,
    sols: [{
      name: '乘以逆元', deps: ['inverse', 'cong_arith'],
      body: R`<p>先找 $2^{-1}\pmod5$：$\underbrace{2\cdot3}_{6}\equiv1\pmod5$，所以 $2^{-1}\equiv3\pmod5$。</p>
$$x\equiv2^{-1}\cdot2x\equiv2^{-1}\cdot3\equiv3\cdot3=9\equiv4\pmod5.$$
<p>$x\equiv4\pmod5$。检验：$2\cdot4=8\equiv3\pmod5$。</p>`
    }]
  },
  cong_div: {
    type: 'prop', imp: 1, title: '模 n 同余 ⇒ 模 n 的因数同余', alias: [],
    body: R`<p>设 $a,b\in\mathbb{Z}$，$m,n\in\mathbb{N}$，$m,n\ge2$。若 $a\equiv b\pmod n$ 且 $m\mid n$，则 $a\equiv b\pmod m$。</p><p><strong>例.</strong> 若 $a\equiv b\pmod{12}$，则 $a\equiv b\pmod4$。</p>`,
    proofs: [{ name: '传递性', deps: ['div_trans', 'cong_def'], body: R`<p>$m\mid n\mid(a-b)$，故 $a\equiv b\pmod m$。</p>` }]
  },
  cong_prime: {
    type: 'prop', imp: 2, title: '模素数没有零因子', alias: ['ab≡0 (mod p)'],
    body: R`<p>设 $p$ 是素数，$a,b\in\mathbb{Z}$。若 $ab\equiv0\pmod p$，则 $a\equiv0\pmod p$ 或 $b\equiv0\pmod p$。</p>`,
    proofs: [{ name: '素数的性质', deps: ['prime_div', 'cong_def'], body: R`<p>$p\mid ab$，则 $p\mid a$ 或 $p\mid b$。</p>` }]
  },
  cong_cancel: {
    type: 'prop', imp: 3, title: '同余的约去：gcd(k,n) = 1 时', alias: ['消去律'],
    body: R`<p>设 $a,b\in\mathbb{Z}$，$n,k\in\mathbb{N}$，$n\ge2$。若 $ka\equiv kb\pmod n$ 且 $\gcd(k,n)=1$，则 $a\equiv b\pmod n$。</p>`,
    proofs: [{
      name: '整除', deps: ['euclid_lemma', 'cong_def'],
      body: R`<p>$n\mid k(a-b)$。因为 $\gcd(n,k)=1$，所以 $n\mid(a-b)$，即 $a\equiv b\pmod n$。</p>`
    }, {
      name: '乘以逆元', deps: ['inverse', 'cong_arith'],
      body: R`<p>因为 $\gcd(k,n)=1$，所以 $k^{-1}\pmod n$ 存在。两边同乘 $k^{-1}$：$k^{-1}ka\equiv k^{-1}kb\pmod n$，即 $a\equiv b\pmod n$。</p>`
    }]
  },
  cong_cancel2: {
    type: 'prop', imp: 2, title: '同余的约去：一般情形', alias: [],
    body: R`<p>若 $ka\equiv kb\pmod n$，则</p>$$a\equiv b\ \Big(\mathrm{mod}\ \frac{n}{\gcd(k,n)}\Big).$$`,
    proofs: [{
      name: '整除', deps: ['euclid_cor', 'cong_def'],
      body: R`<p>$n\mid k(a-b)$，于是 $\dfrac{n}{\gcd(k,n)}\mid(a-b)$，即 $a\equiv b\ \big(\mathrm{mod}\ \frac{n}{\gcd(k,n)}\big)$。</p>`
    }]
  },

  /* ===== 第 5 章 初等数论的经典定理 ===== */
  coprime_mult: {
    type: 'prop', imp: 2, title: '与 n 互素的数相乘仍与 n 互素', alias: ['(a,n)=(b,n)=1 ⇒ (ab,n)=1'],
    body: R`<p>若 $n\in\mathbb{N}$，$n\ge2$，$a,b\in\mathbb{Z}$，$a,b\ne0$，且 $(a,n)=1$，$(b,n)=1$，则 $(ab,n)=1$。</p>`,
    proofs: [{
      name: '素因数', deps: ['min_div_prime', 'prime_div'],
      body: R`<p>由算术基本定理，$a$ 和 $b$ 都没有 $n$ 的素因数作为它们的素因数，因此 $(ab,n)=1$。</p>
<p>（展开写：若 $(ab,n)>1$，取它的一个素因数 $p$，则 $p\mid n$，$p\mid ab$，于是 $p\mid a$ 或 $p\mid b$，与 $(a,n)=(b,n)=1$ 矛盾。）</p>`
    }]
  },
  units_def: {
    type: 'def', imp: 3, title: '(ℤ/nℤ)ˣ', alias: ['乘法群', '既约剩余系', 'units'],
    deps: ['zn_def', 'coprime_def'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$。定义</p>$$(\mathbb{Z}/n\mathbb{Z})^\times=\{\overline{a}:\ \gcd(a,n)=1\},$$<p>称为 $\mathbb{Z}/n\mathbb{Z}$ 的<strong>乘法群</strong>。（$\gcd(a+kn,n)=\gcd(a,n)$，所以条件与代表元无关。）</p>
<p><strong>例.</strong> $n=10$：$\gcd(k,10)=1$，$1\le k\le9\iff k=1,3,7,9$，所以 $(\mathbb{Z}/10\mathbb{Z})^\times=\{\overline1,\overline3,\overline7,\overline9\}$。</p>`
  },
  units_group: {
    type: 'prop', imp: 2, title: '(ℤ/nℤ)ˣ 对乘法封闭，有单位元和逆元', alias: [],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$\overline{a}\in(\mathbb{Z}/n\mathbb{Z})^\times$。</p>
<ol class="plain"><li>(0) 若 $\overline{a},\overline{b}\in(\mathbb{Z}/n\mathbb{Z})^\times$，则 $\overline{a}\cdot\overline{b}\in(\mathbb{Z}/n\mathbb{Z})^\times$；</li>
<li>(1) $\overline{1}\cdot\overline{a}=\overline{a}\cdot\overline{1}=\overline{a}$（$\overline1\in(\mathbb{Z}/n\mathbb{Z})^\times$）；</li>
<li>(2) $\overline{a}\cdot\overline{a^{-1}}=\overline{a^{-1}}\cdot\overline{a}=\overline{1}$。</li></ol>`,
    proofs: [{
      name: '由逆元存在', deps: ['coprime_mult', 'inverse', 'units_def'],
      body: R`<p>(0) 由 [[coprime_mult]]。(1) 显然。(2) $\gcd(a,n)=1$，由 [[inverse]] $a^{-1}\pmod n$ 存在；而 $a\cdot a^{-1}\equiv1$ 说明 $\gcd(a^{-1},n)=1$，故 $\overline{a^{-1}}\in(\mathbb{Z}/n\mathbb{Z})^\times$。</p>`
    }]
  },
  ex_units10: {
    type: 'example', imp: 1, title: '例：(ℤ/10ℤ)ˣ 的乘法表', alias: [], attach: ['units_group'],
    body: R`<p>写出 $(\mathbb{Z}/10\mathbb{Z})^\times=\{\overline1,\overline3,\overline7,\overline9\}$ 的乘法表。</p>`,
    sols: [{
      name: '逐个计算', deps: ['units_def'],
      body: R`$$\begin{array}{c|cccc}\times\ (\mathrm{mod}\ 10)&1&3&7&9\\\hline 1&1&3&7&9\\ 3&3&9&1&7\\ 7&7&1&9&3\\ 9&9&7&3&1\end{array}$$<p>每行每列都恰好是 $1,3,7,9$ 的一个排列；每个元素都有逆元：$3\cdot7\equiv1$，$9\cdot9\equiv1$。</p>`
    }]
  },
  phi_def: {
    type: 'def', imp: 3, title: 'Euler φ 函数', alias: ['欧拉函数', 'phi', 'totient'],
    deps: ['units_def'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，定义</p>$$\varphi(n)=\#\{1\le k\le n:\ \gcd(k,n)=1\},$$<p>$\#$ 表示元素个数。显然 $\varphi(n)=\#\big((\mathbb{Z}/n\mathbb{Z})^\times\big)$。（约定 $\varphi(1)=1$。）</p>`
  },
  phi_pp: {
    type: 'prop', imp: 3, title: 'φ(p) = p − 1，φ(pˡ) = pˡ − pˡ⁻¹', alias: ['素数幂的 φ'],
    body: R`<p>设 $p$ 是素数，$l\in\mathbb{N}$，则</p>$$\varphi(p)=p-1,\qquad \varphi(p^l)=p^l-p^{l-1}=p^{l-1}(p-1)=p^l\Big(1-\frac1p\Big).$$`,
    proofs: [{
      name: '数一数', deps: ['phi_def', 'prime_def'],
      body: R`<p><strong>(1)</strong> 设 $S=\{1\le k\le p:\ \gcd(k,p)=1\}$。当 $1\le k\le p-1$ 时 $\gcd(k,p)=1$；当 $k=p$ 时 $\gcd(k,p)=p\ne1$。故 $\varphi(p)=\#S=p-1$，即 $\#\big((\mathbb{Z}/p\mathbb{Z})^\times\big)=p-1$。</p>
<p><strong>(2)</strong> 设 $S=\{1\le k\le p^l:\ \gcd(k,p^l)=1\}=\{1\le k\le p^l:\ p\nmid k\}$，则</p>$$\#S=p^l-\#\{1\le k\le p^l:\ p\mid k\}=p^l-p^{l-1}.$$`
    }]
  },
  crt: {
    type: 'thm', imp: 3, title: '中国剩余定理', alias: ['孙子定理', 'CRT', 'Chinese remainder theorem'],
    body: R`<p>设 $m,n\in\mathbb{N}$，$m,n\ge2$，$a,b\in\mathbb{Z}$，$\gcd(m,n)=1$。则</p>$$\begin{cases}x\equiv a\pmod m,\\ x\equiv b\pmod n\end{cases}$$<p>存在模 $mn$ 下的唯一解。</p>`,
    proofs: [{
      name: '先满足第一个，再调整', deps: ['inverse', 'lcm_coprime'],
      body: R`<p>设 $x=a+lm$（$l\in\mathbb{Z}$），这样第一个方程自动成立。希望 $a+lm\equiv b\pmod n$，即 $lm\equiv b-a\pmod n$。</p>
<p>由 $\gcd(m,n)=1$ 可知 $\widetilde m=m^{-1}\pmod n$ 存在，于是 $l\equiv\widetilde m(b-a)\pmod n$，并且在模 $n$ 下唯一。则 $l=\widetilde m(b-a)+kn$（$k\in\mathbb{Z}$），故</p>$$x=a+\widetilde m m(b-a)+knm\quad(k\in\mathbb{Z}),$$<p>即 $x\equiv a+\widetilde m m(b-a)\pmod{mn}$。</p>
<p>（补全唯一性：若 $x,x'$ 都是解，则 $m\mid x-x'$，$n\mid x-x'$，由 [[lcm_coprime]] 得 $mn\mid x-x'$。）</p>`
    }]
  },
  crt_map: {
    type: 'prop', imp: 3, title: '中国剩余定理（映射形式）', alias: ['Z/mnZ ≅ Z/mZ × Z/nZ'],
    body: R`<p>若 $m,n\in\mathbb{N}$，$m,n\ge2$，$\gcd(m,n)=1$，则</p>
$$\mathbb{Z}/mn\mathbb{Z}\ \xrightarrow{\ \sim\ }\ (\mathbb{Z}/m\mathbb{Z})\times(\mathbb{Z}/n\mathbb{Z}),\qquad c\ (\mathrm{mod}\ mn)\longmapsto\big(c\ (\mathrm{mod}\ m),\ c\ (\mathrm{mod}\ n)\big)$$
<p>是双射，并且保持加法和乘法（逐个分量运算：$(a,b)\cdot(c,d)=(ac,bd)$）。左边 $mn$ 种选法，右边 $m$ 种 $\times$ $n$ 种选法。</p>
<p>注意：$\gcd(c,mn)=1\iff\gcd(c,m)=\gcd(c,n)=1$。所以它限制成</p>
$$(\mathbb{Z}/mn\mathbb{Z})^\times\ \xrightarrow{\ \sim\ }\ (\mathbb{Z}/m\mathbb{Z})^\times\times(\mathbb{Z}/n\mathbb{Z})^\times.$$`,
    proofs: [{
      name: '由中国剩余定理', deps: ['crt', 'coprime_mult', 'units_def', 'cong_arith'],
      body: R`<p>映射与代表元无关（$mn$ 的倍数也是 $m$、$n$ 的倍数）。中国剩余定理说：对每个 $(a\ \mathrm{mod}\ m,\ b\ \mathrm{mod}\ n)$ 恰有一个 $c\ (\mathrm{mod}\ mn)$ 与之对应，即双射。运算保持由 [[cong_arith]]。</p>
<p>$\gcd(c,mn)=1\Rightarrow$ $c$ 与 $mn$ 的因数 $m,n$ 都互素；反之由 [[coprime_mult]]（对 $m,n$ 的对称版本：$(c,m)=(c,n)=1\Rightarrow(c,mn)=1$）。</p>`
    }]
  },
  phi_mult: {
    type: 'thm', imp: 3, title: 'φ 是积性函数', alias: ['Euler φ 函数的乘法性质', 'φ(mn)=φ(m)φ(n)'],
    body: R`<p>设 $m,n\in\mathbb{N}$，$m,n\ge2$。若 $\gcd(m,n)=1$，则 $\varphi(mn)=\varphi(m)\varphi(n)$。</p>`,
    proofs: [{
      name: '数元素个数', deps: ['crt_map', 'phi_def'],
      body: R`<p>由于 $(\mathbb{Z}/mn\mathbb{Z})^\times\simeq(\mathbb{Z}/m\mathbb{Z})^\times\times(\mathbb{Z}/n\mathbb{Z})^\times$（双射），两边元素个数相等，因此 $\varphi(mn)=\varphi(m)\cdot\varphi(n)$。</p>`
    }]
  },
  phi_formula: {
    type: 'prop', imp: 3, title: 'φ(n) = n ∏ (1 − 1/p)', alias: ['欧拉函数公式'],
    body: R`<p>若 $n=p_1^{\alpha_1}\cdots p_k^{\alpha_k}$，则</p>$$\varphi(n)=p_1^{\alpha_1}\Big(1-\frac1{p_1}\Big)\cdots p_k^{\alpha_k}\Big(1-\frac1{p_k}\Big)=n\prod_{p\mid n}\Big(1-\frac1p\Big).$$`,
    proofs: [{
      name: '积性 + 素数幂', deps: ['phi_mult', 'phi_pp', 'fta'],
      body: R`$$\begin{aligned}\varphi(n)&=\varphi(p_1^{\alpha_1})\,\varphi(p_2^{\alpha_2}\cdots p_k^{\alpha_k})\qquad\big(\gcd(p_1^{\alpha_1},p_2^{\alpha_2}\cdots p_k^{\alpha_k})=1\big)\\&=\cdots=\varphi(p_1^{\alpha_1})\cdots\varphi(p_k^{\alpha_k})\\&=(p_1^{\alpha_1}-p_1^{\alpha_1-1})\cdots(p_k^{\alpha_k}-p_k^{\alpha_k-1})\\&=p_1^{\alpha_1}\Big(1-\frac1{p_1}\Big)\cdots p_k^{\alpha_k}\Big(1-\frac1{p_k}\Big).\end{aligned}$$`
    }]
  },
  ex_phi120: {
    type: 'example', imp: 2, title: '例：1 到 120 中与 120 互素的数有几个', alias: ['φ(120)'], attach: ['phi_formula'],
    body: R`<p>$\#\{1\le k\le120:\ \gcd(k,120)=1\}=\ ?$</p>`,
    sols: [{
      name: '公式', deps: ['phi_formula'],
      body: R`$$\begin{aligned}\varphi(120)&=120\prod_{p\mid120}\Big(1-\frac1p\Big)=120\Big(1-\frac12\Big)\Big(1-\frac13\Big)\Big(1-\frac15\Big)\\&=120\cdot\frac12\cdot\frac23\cdot\frac45=40\cdot\frac45=32.\end{aligned}$$`
    }]
  },
  euler: {
    type: 'thm', imp: 3, title: 'Euler 定理', alias: ['欧拉定理', 'a^φ(n) ≡ 1'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，$a\in\mathbb{Z}$，$\gcd(a,n)=1$。则</p>$$a^{\varphi(n)}\equiv1\pmod n.$$`,
    proofs: [{
      name: '乘以 ā 是 (ℤ/nℤ)ˣ 上的双射', deps: ['units_group', 'phi_def', 'cong_cancel'],
      body: R`<p>注意 $(\mathbb{Z}/n\mathbb{Z})^\times$。$\gcd(a,n)=1$，则 $\overline{a}\in(\mathbb{Z}/n\mathbb{Z})^\times$。考虑</p>
$$L_{\overline a}:(\mathbb{Z}/n\mathbb{Z})^\times\to(\mathbb{Z}/n\mathbb{Z})^\times,\qquad L_{\overline a}(\overline x)=\overline a\cdot\overline x=\overline{ax}.$$
<p>同理我们有 $L_{\overline{a^{-1}}}(\overline y)=\overline{a^{-1}}\cdot\overline y=\overline{a^{-1}y}$。「乘 $\overline a$」与「乘 $\overline{a^{-1}}$」互为逆映射，因此 $L_{\overline a}$ 是一个双射。</p>
<p>设 $(\mathbb{Z}/n\mathbb{Z})^\times=\{\overline{x_1},\dots,\overline{x_{\varphi(n)}}\}$，则</p>$$\{\overline{ax_1},\dots,\overline{ax_{\varphi(n)}}\}=\{\overline{x_1},\dots,\overline{x_{\varphi(n)}}\}.$$
<p>把两边的元素全部乘起来：$\overline{a^{\varphi(n)}x_1\cdots x_{\varphi(n)}}=\overline{x_1\cdots x_{\varphi(n)}}$，即</p>$$a^{\varphi(n)}x_1\cdots x_{\varphi(n)}\equiv x_1\cdots x_{\varphi(n)}\pmod n.$$
<p>每个 $x_i$ 都与 $n$ 互素，可以约去，得 $a^{\varphi(n)}\equiv1\pmod n$。</p>`
    }]
  },
  ex_euler10: {
    type: 'example', imp: 1, title: '例：模 10 的 Euler 定理', alias: [], attach: ['euler'],
    body: R`<p>取 $n=10$，验证 Euler 定理。</p>`,
    sols: [{
      name: '直接计算', deps: ['euler', 'phi_mult', 'phi_pp'],
      body: R`<p>$\varphi(10)=\varphi(2)\varphi(5)=1\cdot4=4$，$(\mathbb{Z}/10\mathbb{Z})^\times=\{\overline1,\overline3,\overline7,\overline9\}$。</p>$$7^4\equiv1,\qquad 3^4\equiv1,\qquad 9^4\equiv1\pmod{10}.$$`
    }]
  },
  fermat: {
    type: 'thm', imp: 3, title: 'Fermat 小定理', alias: ['费马小定理', 'a^{p-1} ≡ 1'],
    body: R`<p>设 $p$ 是素数，$a\in\mathbb{Z}$，$p\nmid a$，则</p>$$a^{p-1}\equiv1\pmod p.$$`,
    proofs: [{
      name: 'Euler 定理的特例', deps: ['euler', 'phi_pp'],
      body: R`<p>由 $p\nmid a$ 知 $\gcd(a,p)=1$。由 Euler 定理，$a^{\varphi(p)}\equiv1\pmod p$；$\varphi(p)=p-1$，故 $a^{p-1}\equiv1\pmod p$。</p>`
    }]
  },
  ex_fermat13: {
    type: 'example', imp: 1, title: '例：模 13 的 Fermat 小定理', alias: [], attach: ['fermat'],
    body: R`<p>$p=13$ 是素数，$13\nmid9$。</p>`,
    sols: [{ name: '直接应用', deps: ['fermat'], body: R`<p>$9^{12}\equiv1\pmod{13}$。事实上 $1^{12}\equiv2^{12}\equiv\cdots\equiv12^{12}\equiv1\pmod{13}$。</p>` }]
  },
  lagrange: {
    type: 'thm', imp: 3, title: 'Lagrange 定理（模 p 多项式根的个数）', alias: ['拉格朗日定理', '多项式同余方程'],
    body: R`<p>设 $f(x)=a_nx^n+\cdots+a_1x+a_0$（$a_i\in\mathbb{Z}$），$p$ 是素数，$p\nmid a_n$。则同余方程</p>$$f(x)\equiv0\pmod p$$<p>至多有 $n$ 个根（模 $p$ 互不同余）。</p>
<p><strong>注.</strong> 如果模一个合数，根的个数完全可以超过 $n$。例如 $x^2\equiv1\pmod8$ 有 $1,3,5,7$ 四个根。</p>`,
    proofs: [{
      name: '多项式除法 + 归纳（补全）', deps: ['cong_prime', 'cong_arith', 'shuxue-jichu:induction'],
      body: R`<p>设 $x_0$ 是它的一个根，即 $f(x_0)\equiv0\pmod p$。考虑在模 $p$ 下做多项式除法（多项式长除法得到）：</p>$$f(x)\equiv g(x)(x-x_0)+r\pmod p,$$<p>其中 $g$ 的次数为 $n-1$，首项系数仍是 $a_n$。代入 $x_0$：$0\equiv f(x_0)\equiv r\pmod p$。因此 $f(x)\equiv g(x)(x-x_0)\pmod p$。</p>
<p>（笔记的思路是：若 $f$ 有 $n$ 个根 $x_1,\dots,x_n$，则 $f(x)\equiv a_n(x-x_1)\cdots(x-x_n)\pmod p$，$a_n\not\equiv0$，所以不能再有别的根。下面把它写成归纳法。）</p>
<p>对次数 $n$ 归纳。$n=0$ 时 $f\equiv a_0\not\equiv0$，没有根。设结论对 $n-1$ 次成立。若 $f$ 没有根，结论成立；否则取一个根 $x_0$，$f(x)\equiv g(x)(x-x_0)$。若 $x_1$ 是 $f$ 的另一个根，$x_1\not\equiv x_0$，则 $g(x_1)(x_1-x_0)\equiv0$，由模素数没有零因子得 $g(x_1)\equiv0$。所以 $f$ 的根 $\subset\{x_0\}\cup\{g\text{ 的根}\}$，至多 $1+(n-1)=n$ 个。</p>`
    }]
  },
  ex_lagrange3: {
    type: 'example', imp: 1, title: '例：模 3 的多项式除法', alias: ['长除法'], attach: ['lagrange'],
    body: R`<p>$2^3+2+2\equiv0\pmod3$。设 $f(x)=x^3+x+2$，$f(2)\equiv0\pmod3$。在模 $3$ 下把 $f(x)$ 除以 $x-2\equiv x+1$。</p>`,
    sols: [{
      name: '长除法', deps: ['lagrange'],
      body: R`<p>模 $3$ 下做长除法（$x^3+0\cdot x^2+x+2$ 除以 $x+1$）：</p>
$$\begin{array}{rll}x^3+0x^2+x+2&-\ x^2(x+1)=&2x^2+x+2\\ 2x^2+x+2&-\ 2x(x+1)=&2x+2\ \ (\text{因为 }x-2x=-x\equiv2x)\\ 2x+2&-\ 2(x+1)=&0\end{array}$$
<p>商为 $x^2+2x+2$，余数为 $0$：</p>$$x^3+x+2\equiv(x+1)(x^2+2x+2)\pmod3.$$`
    }]
  },
  sq_one: {
    type: 'prop', imp: 2, title: 'x² ≡ 1 (mod p) 只有 x ≡ ±1', alias: ['二次同余方程 x²≡1'],
    body: R`<p>设 $p\ge3$ 是奇素数，则 $x^2\equiv1\pmod p$ 的解恰为 $x\equiv\pm1\pmod p$。</p>`,
    proofs: [{
      name: 'Lagrange 定理', deps: ['lagrange'],
      body: R`<p>显然 $\pm1$ 都是解，且 $1\not\equiv-1\pmod p$（$p\ge3$）。由 Lagrange 定理，二次方程至多 $2$ 个根，所以 $x\equiv\pm1\pmod p$。</p>`
    }, {
      name: '分解因式', deps: ['prime_div'],
      body: R`<p>$p\mid(x^2-1)=(x+1)(x-1)$，即 $p\mid(x+1)$ 或 $p\mid(x-1)$，所以 $x\equiv\pm1\pmod p$。</p>`
    }]
  },
  wilson: {
    type: 'thm', imp: 3, title: 'Wilson 定理', alias: ['威尔逊定理', '(p-1)! ≡ -1'],
    body: R`<p>设 $p$ 是奇素数，则</p>$$(p-1)!\equiv-1\pmod p.$$`,
    proofs: [{
      name: '逆元两两配对', deps: ['units_group', 'sq_one', 'phi_pp'],
      body: R`<p>探究 $(\mathbb{Z}/p\mathbb{Z})^\times$，$p$ 奇素数。$p-1$ 是偶数，$\frac{p-1}2\in\mathbb{N}$；$\#\big((\mathbb{Z}/p\mathbb{Z})^\times\big)=p-1$ 是偶数。</p>
<p>研究取逆 $\cdot^{-1}:(\mathbb{Z}/p\mathbb{Z})^\times\to(\mathbb{Z}/p\mathbb{Z})^\times$。易知若 $p\nmid a$，则 $(a^{-1})^{-1}\equiv a\pmod p$，所以 $\cdot^{-1}$ 自己就是自己的逆映射，也是一个双射。</p>
<p>1° 若 $a^{-1}\not\equiv a\pmod p$，则 $a$ 与 $a^{-1}$ 形成了配对。</p>
<p>2° 若 $a^{-1}\equiv a\pmod p$，即 $a^2\equiv1\pmod p$，即 $a\equiv1$ 或 $p-1\pmod p$。</p>
<p>因此 $1,\dots,p-1$ 中只有 $1$ 和 $p-1$ 的乘法逆元是自己，剩余 $p-3$ 个元素两两配对、互为逆元，每一对的乘积 $\equiv1$。于是</p>
$$(p-1)!=1\cdot\underbrace{2\cdot\cdots\cdot(p-2)}_{\text{两两配对，乘积}\equiv1}\cdot(p-1)\equiv1\cdot(p-1)\equiv-1\pmod p.$$`
    }]
  },

  /* ===== 第 6 章 二次剩余 ===== */
  nt_quad: {
    type: 'note', imp: 2, title: '二次同余方程：配方', alias: ['ax²+bx+c≡0'],
    deps: ['inverse', 'cong_cancel'],
    body: R`<p>考虑二次同余方程 $ax^2+bx+c\equiv0\pmod p$，$p$ 是奇素数，其中 $a\not\equiv0\pmod p$，即 $p\nmid a$。</p>
<p>两边乘 $4a$（$4a$ 与 $p$ 互素，可逆，不改变解集）：</p>$$4a^2x^2+4abx\equiv-4ac\pmod p,\qquad(2ax+b)^2\equiv b^2-4ac\pmod p.$$
<p>所以关键问题是：<strong>$x^2\equiv d\pmod p$ 什么时候有解？</strong> 这就是 Legendre 记号要回答的。</p>`
  },
  legendre_def: {
    type: 'def', imp: 3, title: 'Legendre 记号', alias: ['勒让德符号', '平方剩余', 'QR', 'NR', '二次剩余'],
    deps: ['cong_def'],
    body: R`<p>设 $p$ 是奇素数，$a\in\mathbb{Z}$。定义</p>
$$\left(\frac ap\right)=\begin{cases}0, & a\equiv0\pmod p,\\ 1, & p\nmid a\ \text{且}\ x^2\equiv a\pmod p\ \text{有根},\\ -1, & p\nmid a\ \text{且}\ x^2\equiv a\pmod p\ \text{无根}.\end{cases}$$
<p>若 $\left(\frac ap\right)=1$，则称 $a$ 是<strong>平方剩余</strong>（QR）；若 $\left(\frac ap\right)=-1$，则称 $a$ 不是平方剩余（NR）。</p>`
  },
  qr_count: {
    type: 'prop', imp: 2, title: '平方剩余与非平方剩余各占一半', alias: ['#QR = #NR = (p-1)/2'],
    body: R`<p>设 $p$ 是奇素数，则在 $1,\dots,p-1$ 中</p>$$\#QR=\#NR=\frac{p-1}2,$$<p>并且 QR 恰是 $1^2,2^2,\dots,\big(\frac{p-1}2\big)^2\pmod p$，这些数两两不同余。</p>`,
    proofs: [{
      name: '±a 平方相同', deps: ['legendre_def', 'prime_div'],
      body: R`<p>QR 就是 $1^2,2^2,\dots,\big(\frac{p-1}2\big)^2,\big(\frac{p+1}2\big)^2,\dots,(p-1)^2\pmod p$。而</p>$$(p-a)^2\equiv(-a)^2\equiv a^2\pmod p,$$<p>所以 $1^2\equiv(p-1)^2$，……，$\big(\frac{p-1}2\big)^2\equiv\big(\frac{p+1}2\big)^2$，后一半与前一半重复。</p>
<p>设 $i^2\equiv j^2\pmod p$，$1\le i,j\le\frac{p-1}2$，则 $p\mid(i-j)(i+j)$，$i\equiv\pm j\pmod p$。假如 $i\equiv-j\pmod p$，则 $p\mid(i+j)$，而 $2\le i+j\le p-1$，矛盾。所以 $i=j$。</p>
<p>因此 QR 是互异的 $i^2\pmod p$，其中 $1\le i\le\frac{p-1}2$，共 $\frac{p-1}2$ 个；其余 $\frac{p-1}2$ 个是 NR。</p>`
    }]
  },
  qr_mult: {
    type: 'prop', imp: 2, title: 'QR·QR = QR，QR·NR = NR，NR·NR = QR', alias: ['平方剩余的乘法'],
    body: R`<p>设 $p$ 是奇素数，在模 $p$ 下：</p><ol class="plain"><li>(1) QR $\cdot$ QR $=$ QR；</li><li>(2) QR $\cdot$ NR $=$ NR；</li><li>(3) NR $\cdot$ NR $=$ QR。</li></ol>`,
    proofs: [{
      name: '乘以一个数是置换', deps: ['qr_count', 'units_group', 'cong_cancel'],
      body: R`<p>(1) $a^2\cdot b^2=(ab)^2\pmod p$。</p>
<p>(2) 设 $Q$ 是一个 QR。考虑 $Q$ 乘上所有的 $\{1,\dots,p-1\}$，得到的仍是 $\{1,\dots,p-1\}$（模 $p$，乘以可逆元是双射）。由 (1)，$Q\cdot\text{QR}\subset\text{QR}$，这已经占满了 $\frac{p-1}2$ 个 QR；剩下的 $Q\cdot\text{NR}$ 只能是那 $\frac{p-1}2$ 个 NR。</p>
<p>(3) 设 $N$ 是一个 NR。$N$ 乘上 $\{1,\dots,p-1\}$ 仍是 $\{1,\dots,p-1\}$。由 (2)，$N\cdot\text{QR}=\text{NR}$（$\frac{p-1}2$ 个 NR），所以 $N\cdot\text{NR}=\text{QR}$（剩下 $\frac{p-1}2$ 个 QR）。</p>`
    }]
  },
  legendre_mult: {
    type: 'prop', imp: 3, title: 'Legendre 记号是完全积性的', alias: ['(ab/p)=(a/p)(b/p)'],
    body: R`<p>设 $p$ 是奇素数，$a,b\in\mathbb{Z}$，则</p>$$\left(\frac{ab}p\right)=\left(\frac ap\right)\left(\frac bp\right).$$`,
    proofs: [{
      name: '分情况', deps: ['qr_mult', 'cong_prime'],
      body: R`<p>① $\left(\frac{ab}p\right)=0\iff ab\equiv0\pmod p\iff a\equiv0$ 或 $b\equiv0\pmod p\iff\left(\frac ap\right)=0$ 或 $\left(\frac bp\right)=0$。</p>
<p>② 若 $\left(\frac{ab}p\right)\ne0$，此时 $a,b\not\equiv0\pmod p$。由 QR$\cdot$QR$=$QR，QR$\cdot$NR$=$NR，NR$\cdot$NR$=$QR，即 $1\cdot1=1$，$1\cdot(-1)=-1$，$(-1)(-1)=1$，得 $\left(\frac{ab}p\right)=\left(\frac ap\right)\left(\frac bp\right)$。</p>`
    }]
  },
  euler_crit: {
    type: 'thm', imp: 3, title: 'Euler 判别法', alias: ['欧拉判别法', 'Euler criterion'],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$，则</p>$$\left(\frac ap\right)\equiv a^{\frac{p-1}2}\pmod p.$$`,
    proofs: [{
      name: 'Fermat + Lagrange', deps: ['fermat', 'sq_one', 'lagrange', 'qr_count'],
      body: R`<p>$\big(a^{\frac{p-1}2}\big)^2=a^{p-1}\equiv1\pmod p$，因此 $a^{\frac{p-1}2}\equiv\pm1\pmod p$。</p>
<p>① 设 $a\equiv b^2\pmod p$，即 $\left(\frac ap\right)=1$。则 $a^{\frac{p-1}2}\equiv(b^2)^{\frac{p-1}2}=b^{p-1}\equiv1\pmod p$。</p>
<p>② 观察 $x^{\frac{p-1}2}\equiv1\pmod p$：由 ①，它有 $\frac{p-1}2$ 个根（所有的 QR）。由 Lagrange 定理，这就是全部的根。设 $a$ 是 NR，即 $\left(\frac ap\right)=-1$，此时 $a^{\frac{p-1}2}\not\equiv1\pmod p$，所以 $a^{\frac{p-1}2}\equiv-1\pmod p$。</p>`
    }]
  },
  minus_one: {
    type: 'thm', imp: 3, title: '(−1/p)：x² ≡ −1 何时有解', alias: ['第一补充律', '-1 是平方剩余'],
    body: R`<p>设 $p$ 是奇素数，则</p>$$\left(\frac{-1}p\right)=(-1)^{\frac{p-1}2}=\begin{cases}1, & p\equiv1\pmod4,\\ -1, & p\equiv3\pmod4.\end{cases}$$`,
    proofs: [{
      name: 'Euler 判别法', deps: ['euler_crit'],
      body: R`<p>由 Euler 判别法，$\left(\frac{-1}p\right)\equiv(-1)^{\frac{p-1}2}\pmod p$，两边都是 $\pm1$ 且 $1\not\equiv-1$，所以相等。$\frac{p-1}2\in\mathbb{Z}$。</p>
<p>1° 若 $\frac{p-1}2=2k$（$k\in\mathbb{Z}$），即 $p\equiv1\pmod4$，则 $\left(\frac{-1}p\right)=1$。</p>
<p>2° 若 $\frac{p-1}2=2k+1$（$k\in\mathbb{Z}$），即 $p\equiv3\pmod4$，则 $\left(\frac{-1}p\right)=-1$。</p>`
    }]
  },
  sqrt_minus_one: {
    type: 'prop', imp: 2, title: 'p ≡ 1 (mod 4) 时 x² ≡ −1 的根', alias: [],
    body: R`<p>设 $p\equiv1\pmod4$ 是素数，则 $x^2\equiv-1\pmod p$ 的根是</p>$$x\equiv\pm\Big(\frac{p-1}2\Big)!\pmod p.$$`,
    proofs: [{
      name: 'Wilson 定理', deps: ['wilson', 'sq_one'],
      body: R`<p>由 Wilson 定理，$(p-1)!\equiv-1\pmod p$。把后一半 $\frac{p+1}2,\dots,p-1$ 写成 $-\frac{p-1}2,\dots,-1$：</p>
$$\begin{aligned}-1&\equiv1\cdot\cdots\cdot\frac{p-1}2\cdot\frac{p+1}2\cdot\cdots\cdot(p-1)\\&\equiv1\cdot\cdots\cdot\frac{p-1}2\cdot\Big(-\frac{p-1}2\Big)\cdot\cdots\cdot(-1)\\&\equiv\Big(\Big(\frac{p-1}2\Big)!\Big)^2(-1)^{\frac{p-1}2}\pmod p.\end{aligned}$$
<p>$p\equiv1\pmod4$ 时 $(-1)^{\frac{p-1}2}=1$，因此 $x\equiv\pm\big(\frac{p-1}2\big)!$ 是根；由 Lagrange 定理（或 [[sq_one]] 的同样论证）只有这两个根。</p>`
    }]
  },
  gauss_lemma: {
    type: 'thm', imp: 3, title: 'Gauss 引理', alias: ['高斯引理'],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$。令</p>$$n=\#\Big\{1\le i\le\frac{p-1}2:\ ai\ (\mathrm{mod}\ p)>\frac{p-1}2\Big\},$$<p>这里 $ai\ (\mathrm{mod}\ p)$ 指 $ai$ 模 $p$ 的最小非负余数。则 $\left(\frac ap\right)=(-1)^n$。</p>`,
    proofs: [{
      name: '把 aS 与 ±S 比较', deps: ['euler_crit', 'cong_cancel'],
      body: R`<p>笔记先对 $a=2$ 做了推导（见 [[two_over_p]]），一般的 $a$ 一字不改即可（补全）。</p>
<p>设 $S=\{1,2,\dots,\frac{p-1}2\}$，考虑 $aS=\{a,2a,\dots,\frac{p-1}2a\}$。</p>
<p><strong>Gauss 的观察：</strong>$\forall\,i\ne j\in S$，$ai\not\equiv\pm aj\pmod p$。证：若 $ai\equiv aj$，约去 $a$ 得 $i\equiv j$，不可能；若 $ai\equiv-aj$，则 $p\mid a(i+j)$，$p\mid(i+j)$，而 $2\le i+j\le p-1$，矛盾。</p>
<p>因此 $aS$ 模 $p$ 恰好是 $\{\pm1,\pm2,\dots,\pm\frac{p-1}2\}$——每个绝对值 $1,\dots,\frac{p-1}2$ 恰好出现一次，取负号的次数就是 $n$（余数 $>\frac{p-1}2$ 的那些写成负数）。把 $aS$ 中的元素全部相乘：</p>
$$a\cdot1\cdot a\cdot2\cdots a\cdot\frac{p-1}2\equiv(-1)^n\Big(\frac{p-1}2\Big)!\pmod p,$$
$$\left(\frac ap\right)\equiv a^{\frac{p-1}2}\Big(\frac{p-1}2\Big)!\Big/\Big(\frac{p-1}2\Big)!\equiv(-1)^n\pmod p.$$
<p>两边都是 $\pm1$，因此 $\left(\frac ap\right)=(-1)^n$。</p>`
    }]
  },
  two_over_p: {
    type: 'thm', imp: 3, title: '(2/p)：第二补充律', alias: ['2 是平方剩余', '(2/p)'],
    body: R`<p>设 $p$ 是奇素数，则</p>$$\left(\frac2p\right)=\begin{cases}1, & p\equiv\pm1\pmod8,\\ -1, & p\equiv\pm3\pmod8.\end{cases}$$`,
    proofs: [{
      name: 'Gauss 引理数一数', deps: ['gauss_lemma'],
      body: R`<p>由 Euler 判别法 $\left(\frac2p\right)\equiv2^{\frac{p-1}2}\pmod p$；Gauss 引理（$a=2$ 的版本）把它化成计数：$S=\{1,\dots,\frac{p-1}2\}$，$2S=\{2,4,\dots,p-1\}=\{\pm1,\pm2,\dots,\pm\frac{p-1}2\}$，</p>
$$n=\#\Big\{1\le i\le\frac{p-1}2:\ 2i\ (\mathrm{mod}\ p)>\frac{p-1}2\Big\},\qquad\left(\frac2p\right)=(-1)^n.$$
<p>设 $1\le i\le\frac{p-1}2$，此时 $2i\le p-1$ 就是自己的余数，条件即 $2i>\frac{p-1}2$，$i>\frac{p-1}4$。</p>
<p>① 设 $\frac{p-1}4\in\mathbb{Z}$，则 $p\equiv1\pmod4$，</p>$$n=\#\Big\{1\le i\le\frac{p-1}2:\ i>\frac{p-1}4\Big\}=\frac{p-1}2-\frac{p-1}4=\frac{p-1}4,$$
$$\left(\frac2p\right)=(-1)^{\frac{p-1}4}=\begin{cases}1, & p\equiv1\pmod8,\\ -1, & p\equiv5\pmod8.\end{cases}$$
<p>② 设 $\frac{p-1}4\notin\mathbb{Z}$，则 $p\equiv3\pmod4$，$\frac{p-3}4\in\mathbb{Z}$，$\frac{p-1}4=\frac{p-3}4+\frac12$。对整数 $i$，$i>\frac{p-1}4\iff i>\frac{p-3}4$。</p>
$$n=\#\Big\{1\le i\le\frac{p-1}2:\ i>\frac{p-3}4\Big\}=\frac{p-1}2-\frac{p-3}4=\frac{2p-2}4-\frac{p-3}4=\frac{p+1}4,$$
$$\left(\frac2p\right)=(-1)^{\frac{p+1}4}=\begin{cases}-1, & p\equiv3\pmod8,\\ 1, & p\equiv7\pmod8.\end{cases}$$
<p>综上即得。</p>`
    }]
  },
  qr_law: {
    type: 'thm', imp: 3, title: '二次互反律', alias: ['quadratic reciprocity', '高斯二次互反律'],
    body: R`<p>设 $p,q$ 是两个不相等的奇素数，则</p>$$\left(\frac pq\right)\left(\frac qp\right)=(-1)^{\frac{(p-1)(q-1)}4}=(-1)^{\frac{p-1}2\cdot\frac{q-1}2}.$$
<p>即：若 $p\equiv1$ 或 $q\equiv1\pmod4$，则 $\left(\frac pq\right)=\left(\frac qp\right)$；若 $p,q\equiv3\pmod4$，则 $\left(\frac pq\right)=-\left(\frac qp\right)$。</p>`,
    proofs: [{
      name: 'G. Rousseau（1989）', deps: ['crt_map', 'wilson', 'euler_crit', 'units_group'],
      body: R`<p>$\gcd(p,q)=1$，因此（中国剩余定理）存在双射 $f:(\mathbb{Z}/p\mathbb{Z})^\times\times(\mathbb{Z}/q\mathbb{Z})^\times\to(\mathbb{Z}/pq\mathbb{Z})^\times$，$f^{-1}(\overline c)=(\overline c,\overline c)$，保持乘法 $(a,b)\cdot(c,d)=(ac,bd)$，且 $f(-a,-b)=-f(a,b)$。</p>
<p><strong>思路.</strong> 在两边各取「一半」：每对 $\{x,-x\}$ 恰取一个。左边取 $H_1=\{(a,b):1\le a\le p-1,\ 1\le b\le\frac{q-1}2\}$（矩形的下半）；右边取 $S=\{1\le k\le\frac{pq-1}2:\ p\nmid k,\ q\nmid k\}$（前半），把它搬到左边看成 $f^{-1}(S)$。两个「半边」逐对只差符号，所以两边乘积只差一个整体符号 $\pm$。</p>
<p><strong>① 左边的乘积.</strong></p>
$$\begin{aligned}&(1,1)(1,2)\cdots\big(1,\tfrac{q-1}2\big)\cdots(p-1,1)\cdots\big(p-1,\tfrac{q-1}2\big)\\
&=\Big(1^{\frac{q-1}2}\cdots(p-1)^{\frac{q-1}2},\ 1^{p-1}\cdots\big(\tfrac{q-1}2\big)^{p-1}\Big)
=\Big(\big((p-1)!\big)^{\frac{q-1}2},\ \Big(\big(\tfrac{q-1}2\big)!\Big)^{p-1}\Big)\\
&=\Big((-1)^{\frac{q-1}2},\ \Big(\Big(\big(\tfrac{q-1}2\big)!\Big)^2\Big)^{\frac{p-1}2}\Big)
=\Big((-1)^{\frac{q-1}2},\ \big(-(-1)^{\frac{q-1}2}\big)^{\frac{p-1}2}\Big)\\
&=\Big((-1)^{\frac{q-1}2},\ (-1)^{\frac{p-1}2}(-1)^{\frac{(p-1)(q-1)}4}\Big).\end{aligned}$$
<p>这里用了 Wilson 定理，以及（同 [[sqrt_minus_one]] 的配对）$\big(\big(\frac{q-1}2\big)!\big)^2(-1)^{\frac{q-1}2}\equiv(q-1)!\equiv-1\pmod q$。</p>
<p><strong>② 右边的乘积.</strong> $\operatorname{lcm}(p,q)=pq$。计算 $\prod_{s\in S}s\pmod p$：</p>
$$\frac{pq-1}2=\frac{q-1}2\,p+\frac{p-1}2,$$
<p>$1,\dots,\frac{pq-1}2$ 中去掉 $p$ 的倍数后，是 $\frac{q-1}2$ 段完整的 $1,\dots,p-1$（模 $p$），再加上 $\frac{q-1}2p+1,\dots,\frac{q-1}2p+\frac{p-1}2$（模 $p$ 是 $1,\dots,\frac{p-1}2$）。还要再去掉 $q,2q,\dots,\frac{p-1}2q$（它们 $\le\frac{pq-1}2$ 且不被 $p$ 整除）。于是</p>
$$\prod_{s\in S}s\equiv\frac{\big((p-1)!\big)^{\frac{q-1}2}\cdot\big(\frac{p-1}2\big)!}{q^{\frac{p-1}2}\cdot\big(\frac{p-1}2\big)!}\equiv(-1)^{\frac{q-1}2}\left(\frac qp\right)\pmod p,$$
<p>（Wilson 定理和 Euler 判别法 $q^{\frac{p-1}2}\equiv\left(\frac qp\right)=\left(\frac qp\right)^{-1}$）。对称地计算模 $q$：</p>
$$\Big(\prod_{s\in S}s\ (\mathrm{mod}\ p),\ \prod_{s\in S}s\ (\mathrm{mod}\ q)\Big)=\Big((-1)^{\frac{q-1}2}\left(\frac qp\right),\ (-1)^{\frac{p-1}2}\left(\frac pq\right)\Big).$$
<p><strong>③ 比较.</strong> 所以</p>
$$\Big((-1)^{\frac{q-1}2},\ (-1)^{\frac{p-1}2}(-1)^{\frac{(p-1)(q-1)}4}\Big)=\pm\Big((-1)^{\frac{q-1}2}\left(\frac qp\right),\ (-1)^{\frac{p-1}2}\left(\frac pq\right)\Big),$$
<p>两个分量用的是同一个符号。由第一分量，这个符号就是 $\left(\frac qp\right)$；代入第二分量得 $(-1)^{\frac{(p-1)(q-1)}4}=\left(\frac qp\right)\left(\frac pq\right)$。因此</p>
$$\left(\frac pq\right)\left(\frac qp\right)=(-1)^{\frac{(p-1)(q-1)}4}.$$`
    }]
  },

  /* ===== 第 7 章 原根 ===== */
  ord_def: {
    type: 'def', imp: 3, title: '元素的阶 ord_p(a)', alias: ['阶', 'order', '(Z/pZ)ˣ 中元素的阶'],
    deps: ['fermat'],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$。定义最小的使得 $a^k\equiv1\pmod p$ 的正整数 $k$ 为 $a$ 的（模 $p$）<strong>阶</strong>，记为 $\operatorname{ord}_p(a)$ 或 $\operatorname{ord}(a)$。</p><p>（由 Fermat 小定理 $a^{p-1}\equiv1$，这样的 $k$ 存在。）</p>`
  },
  ord_div: {
    type: 'prop', imp: 3, title: 'aᵏ ≡ 1 ⇒ ord(a) | k', alias: [],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$，$k\in\mathbb{N}$。若 $a^k\equiv1\pmod p$，则 $\operatorname{ord}(a)\mid k$。</p>`,
    proofs: [{
      name: '带余除法', deps: ['ord_def', 'divalg', 'cong_arith'],
      body: R`<p>设 $k=q\operatorname{ord}(a)+r$，$0\le r\le\operatorname{ord}(a)-1$。</p>$$1\equiv a^k=a^{q\operatorname{ord}(a)}\cdot a^r=\big(a^{\operatorname{ord}(a)}\big)^q\cdot a^r\equiv a^r\pmod p.$$<p>由 $\operatorname{ord}(a)$ 的最小性可知 $r=0$。因此 $\operatorname{ord}(a)\mid k$。</p>`
    }]
  },
  ord_distinct: {
    type: 'prop', imp: 2, title: '1, a, …, a^{m−1} 两两不同余', alias: [],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$，$m=\operatorname{ord}(a)$。则 $1=a^0,a^1,\dots,a^{m-1}\pmod p$ 两两不同余。</p>`,
    proofs: [{
      name: '约去', deps: ['ord_def', 'cong_cancel'],
      body: R`<p>设 $a^i\equiv a^j\pmod p$（$0\le i\le j\le m-1$）。$a^j\equiv a^ia^{j-i}$，约去 $a^i$ 得 $a^{j-i}\equiv1\pmod p$，$0\le j-i\le m-1$。由 $\operatorname{ord}(a)$ 的最小性可知 $j-i=0$，即 $i=j$。</p>`
    }]
  },
  ord_power: {
    type: 'prop', imp: 2, title: 'ord(aᵏ) = d / gcd(d, k)', alias: ['幂的阶'],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$，$\operatorname{ord}(a)=d$，$k\in\mathbb{Z}_{\ge0}$。则</p>$$\operatorname{ord}(a^k)=\frac{d}{\gcd(d,k)}.$$<p>特别地，$\operatorname{ord}(a^k)=d\iff\gcd(k,d)=1$。</p>`,
    proofs: [{
      name: '求最小的 l', deps: ['ord_div', 'euclid_cor'],
      body: R`<p>求出最小的正整数 $l$，使得 $(a^k)^l=a^{kl}\equiv1\pmod p$：</p>$$a^{kl}\equiv1\iff d\mid kl\iff\frac d{\gcd(d,k)}\ \Big|\ l.$$
<p>（第一个 $\iff$：$\Rightarrow$ 由 [[ord_div]]，$\Leftarrow$ 显然。第二个：$\Rightarrow$ 由 [[euclid_cor]]；$\Leftarrow$：$kl=\frac{k}{\gcd(d,k)}\cdot\gcd(d,k)\,l$，而 $\frac d{\gcd(d,k)}\cdot\gcd(d,k)=d$。）</p>
<p>所以 $\operatorname{ord}(a^k)=\dfrac d{\gcd(d,k)}$。</p>`
    }]
  },
  primroot_def: {
    type: 'def', imp: 3, title: '原根', alias: ['primitive root', '生成元'],
    deps: ['ord_def', 'ord_distinct'],
    body: R`<p>设 $p$ 是奇素数，$p\nmid a$。若 $\operatorname{ord}(a)=p-1$，则称 $a$ 是模 $p$ 的一个<strong>原根</strong>。</p>
<p>这意味着 $\underbrace{1=a^0,a^1,\dots,a^{p-2}}_{p-1\text{ 个数}}\pmod p$ 两两不同余，取遍了 $(\mathbb{Z}/p\mathbb{Z})^\times$。</p>`
  },
  phi_sum: {
    type: 'prop', imp: 2, title: 'Euler φ 函数的求和公式：Σ_{d|n} φ(d) = n', alias: ['Gauss 恒等式'],
    body: R`<p>设 $n\in\mathbb{N}$，$n\ge2$，则</p>$$\sum_{d\mid n}\varphi(d)=n.$$`,
    proofs: [{
      name: '按 gcd 分类', deps: ['phi_def', 'gcd_scale'],
      body: R`$$\begin{aligned}n&=\sum_{1\le k\le n}1=\sum_{d\mid n}\ \sum_{\substack{1\le k\le n\\ \gcd(k,n)=d}}1
\ \overset{k=ld}{=}\ \sum_{d\mid n}\ \sum_{\substack{1\le l\le n/d\\ \gcd(l,n/d)=1}}1\\&=\sum_{d\mid n}\varphi\Big(\frac nd\Big)=\sum_{d\mid n}\varphi(d).\end{aligned}$$
<p>第二个等号：$\gcd(k,n)=d$ 时 $d\mid k$，写 $k=ld$，由 [[gcd_scale]]，$\gcd(ld,\frac nd d)=d\gcd(l,\frac nd)$，所以 $\gcd(k,n)=d\iff\gcd(l,\frac nd)=1$。最后一步：$d\mapsto\frac nd$ 是 $\{d:d\mid n\}$ 到自身的双射（逆映射还是它自己）。</p>`
    }]
  },
  primroot_exist: {
    type: 'thm', imp: 3, title: '模 p 原根的存在性', alias: ['原根存在定理'],
    body: R`<p>设 $p$ 是奇素数，则存在 $a\in\mathbb{N}$，$p\nmid a$，使得 $a$ 是模 $p$ 的原根，即 $\operatorname{ord}(a)=p-1$。</p>`,
    proofs: [{
      name: '按阶计数', deps: ['fermat', 'ord_div', 'ord_distinct', 'ord_power', 'lagrange', 'phi_sum'],
      body: R`<p>设 $\overline a\in(\mathbb{Z}/p\mathbb{Z})^\times$，$p\nmid a$。由 Fermat 小定理可知 $a^{p-1}\equiv1\pmod p$，因此 $\operatorname{ord}(a)\mid(p-1)$。对于 $d\mid(p-1)$，定义</p>$$\psi(d)=\#\{1\le a\le p-1:\ \operatorname{ord}(a)=d\}.$$
<p>每个 $a$ 的阶都是 $p-1$ 的某个因数，因此 $\sum_{d\mid(p-1)}\psi(d)=p-1$。注意到 $\sum_{d\mid(p-1)}\varphi(d)=p-1$。只需证：对任意 $d\mid(p-1)$，都有 $\psi(d)\le\varphi(d)$。</p>
<p>任取 $d\mid(p-1)$。</p>
<p>1° 设不存在阶为 $d$ 的元素，则 $\psi(d)=0\le\varphi(d)$。</p>
<p>2° 设存在阶为 $d$ 的元素 $a$，$p\nmid a$，$\operatorname{ord}(a)=d$，$a^d\equiv1\pmod p$。考察 $x^d\equiv1\pmod p$：$a^0,a^1,\dots,a^{d-1}$ 都是根（$(a^k)^d=(a^d)^k\equiv1$），共 $d$ 个且两两不同余；由 Lagrange 定理，这就是全部的根。阶为 $d$ 的元素都满足 $x^d\equiv1$，所以一定形如 $b=a^k$，$0\le k\le d-1$。</p>
<p>希望 $\operatorname{ord}(b)=d$。由 [[ord_power]]，$\operatorname{ord}(a^k)=\frac d{\gcd(d,k)}$，因此 $\operatorname{ord}(a^k)=d\iff\gcd(k,d)=1$。于是</p>$$\psi(d)=\#\{0\le k\le d-1:\ \gcd(k,d)=1\}=\varphi(d).$$
<p>因此总有 $\psi(d)\le\varphi(d)$。可是 $\sum_{d\mid(p-1)}\psi(d)=\sum_{d\mid(p-1)}\varphi(d)=p-1$，所以对任意 $d\mid(p-1)$，都有 $\psi(d)=\varphi(d)$。因此 $\psi(p-1)=\varphi(p-1)\ge1$。</p>`
    }]
  },
  primroot_count: {
    type: 'prop', imp: 2, title: '推论：模 p 的原根恰有 φ(p−1) 个', alias: ['原根个数'],
    body: R`<p>若 $p$ 是奇素数，则模 $p$ 的原根（在 $1,\dots,p-1$ 中）个数就是 $\varphi(p-1)$。</p>`,
    proofs: [{
      name: '由存在性的证明', deps: ['primroot_exist', 'ord_power'],
      body: R`<p>上面的证明其实得到了 $\psi(d)=\varphi(d)$ 对每个 $d\mid(p-1)$ 成立，取 $d=p-1$ 即得。</p>
<p>也可以直接看：取一个原根 $g$，$(\mathbb{Z}/p\mathbb{Z})^\times=\{g^0,\dots,g^{p-2}\}$，而 $\operatorname{ord}(g^k)=p-1\iff\gcd(k,p-1)=1$，这样的 $k$ 恰有 $\varphi(p-1)$ 个。</p>`
    }]
  }
};

/* ---------- 章节关系图 ---------- */
const CH_EDGES = [['c1', 'c2'], ['c2', 'c3'], ['c2', 'c4'], ['c3', 'c5'], ['c4', 'c5'], ['c5', 'c6'], ['c5', 'c7']];
const CH_POS = { c1: [100, 18], c2: [100, 58], c3: [56, 100], c4: [144, 100], c5: [100, 142], c6: [56, 186], c7: [144, 186] };
