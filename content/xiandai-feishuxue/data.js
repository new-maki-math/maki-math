/* 非数学系线性代数 —— 由 Maki 手写讲义（110 页）录入。
   笔记里略去的证明在证明名里注明「补全」；笔误已改正。
   映射、复数两块与「数学基础」重合，直接跨课程引用。 */
const R = String.raw;

/* ---------- 泡泡树 ---------- */
const B = {
  root: { title: '非数学系线性代数', ordered: true, kids: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'] },

  c1: { title: '向量空间 ℝⁿ', tag: '第1章', ordered: true, desc: 'ℝⁿ 中的加法、标量乘法与长度；线性组合、张成、线性无关、基与线性子空间。', kids: ['c1a', 'c1b', 'c1c', 'c1d'] },
  c1a: { title: 'ℝⁿ 与向量的运算', ordered: true, kids: ['rn_def', 'vec_add', 'scalar_mult', 'vec_len'] },
  c1b: { title: '线性组合与张成', ordered: true, kids: ['lincomb_def', 'ex_lincomb', 'lincomb_closed', 'span_def', 'ex_span'] },
  c1c: { title: '线性无关与基', ordered: true, kids: ['indep_def', 'indep_test', 'basis_def', 'basis_props'] },
  c1d: { title: '线性子空间', ordered: true, kids: ['subspace_def', 'ex_subspace_list', 'span_subspace', 'ex_sub_axis', 'ex_sub_W'] },

  c2: { title: '点乘与投影', tag: '第2章', ordered: true, desc: '实内积、Cauchy–Schwarz 不等式、夹角与正交、向量在另一个方向上的投影。', kids: ['c2a', 'c2b', 'c2c'] },
  c2a: { title: '点乘与 Cauchy–Schwarz 不等式', ordered: true, kids: ['dot_def', 'dot_props', 'cs_ineq', 'ex_cs_check'] },
  c2b: { title: '夹角与正交', ordered: true, kids: ['angle_def', 'ex_cs_sum', 'ex_cs_frac', 'dot_geom', 'ex_perp', 'perp_comb', 'perp_subspace'] },
  c2c: { title: '投影', ordered: true, kids: ['proj_def', 'ex_proj_axis', 'ex_proj_3d', 'ex_proj_parallel'] },

  c3: { title: '线性映射', tag: '第3章', ordered: true, desc: '保持加法和标量乘法的映射；每个线性映射 ℝⁿ→ℝᵐ 都由一个 m×n 矩阵决定。', kids: ['c3a', 'c3b', 'c3c', 'c3d'] },
  c3a: { title: '映射（复习）', ordered: true, kids: ['map_review'] },
  c3b: { title: '线性映射', ordered: true, kids: ['linmap_def', 'linmap_props', 'ex_xy_nonlinear', 'ex_linmap'] },
  c3c: { title: '线性映射的矩阵', ordered: true, kids: ['std_basis', 'linmap_matrix', 'ex_rotation'] },
  c3d: { title: '线性映射的运算', ordered: true, kids: ['linmap_ops', 'linmap_comp', 'img_preimg_sub'] },

  c4: { title: '矩阵', tag: '第4章', ordered: true, desc: '矩阵的加法、数乘、转置与乘法；对称矩阵；线性映射的复合对应矩阵乘法；迹。', kids: ['c4a', 'c4b', 'c4c', 'c4d', 'c4e', 'c4f'] },
  c4a: { title: '矩阵与线性运算', ordered: true, kids: ['mat_def', 'mat_add', 'mat_cols', 'mat_lincomb'] },
  c4b: { title: '转置', ordered: true, kids: ['rowcol_mult', 'transpose_def', 'rowcol_dot', 'transpose_props'] },
  c4c: { title: '矩阵乘法', ordered: true, kids: ['matmul_def', 'ex_matmul', 'ex_outer', 'matmul_props'] },
  c4d: { title: '对称矩阵', ordered: true, kids: ['sym_def', 'ata_sym', 'ex_abat'] },
  c4e: { title: '复合与矩阵乘法', ordered: true, kids: ['comp_matmul', 'ex_comp_1n'] },
  c4f: { title: '迹', ordered: true, kids: ['trace_def', 'trace_props', 'trace_formula'] },

  c5: { title: '行列式', tag: '第5章', ordered: true, desc: '按第一行展开定义行列式；用初等行变换快速计算；初等行变换对应的矩阵。', kids: ['c5a', 'c5b', 'c5c'] },
  c5a: { title: '行列式的定义', ordered: true, kids: ['det_def', 'det2_mult', 'ex_det4', 'det_mult'] },
  c5b: { title: '用行变换计算行列式', ordered: true, kids: ['det_rowops', 'ex_det3', 'det_kA'] },
  c5c: { title: '初等矩阵', ordered: true, kids: ['elem_mat', 'rref_product'] },

  c6: { title: '线性代数基本定理', tag: '第6章', ordered: true, desc: '仿射空间、商空间 V/U；核与像；dim ker f + dim im f = dim V。', kids: ['c6a', 'c6b'] },
  c6a: { title: '仿射空间与商空间', ordered: true, kids: ['vecspace_note', 'affine_def', 'coset_eq', 'quotient_def', 'quotient_ops', 'ex_quotient', 'quotient_dim'] },
  c6b: { title: '核、像与基本定理', ordered: true, kids: ['ker_im_def', 'fund_thm', 'ex_fund_proj'] },

  c7: { title: '线性方程组', tag: '第7章', ordered: true, desc: '高斯消元、行阶梯形与行最简形；列空间、行空间、零空间；秩–零化度定理。', kids: ['c7a', 'c7b', 'c7c'] },
  c7a: { title: '高斯消元', ordered: true, kids: ['ex_sys2', 'rref_def', 'ex_sys_rref', 'axb_cols'] },
  c7b: { title: '列空间、行空间与秩', ordered: true, kids: ['colrow_def', 'ex_colrow', 'ex_dependent', 'rank_def'] },
  c7c: { title: '零空间与秩–零化度定理', ordered: true, kids: ['null_def', 'ex_null', 'null_dim', 'rank_nullity', 'fund_matrix', 'basis_props_pf'] },

  c8: { title: '复数（复习）', tag: '第8章', ordered: true, desc: '求特征值要用到复数。这部分与「数学基础」的复数一章相同，直接引用。', kids: ['c8a'] },
  c8a: { title: '复数', ordered: true, kids: ['complex_review'] },

  c9: { title: '特征值与对角化', tag: '第9章', ordered: true, desc: '特征值与特征向量、矩阵的逆、对角化 A = PDP⁻¹，以及用它计算 Aᵏ。', kids: ['c9a', 'c9c', 'c9b', 'c9d'] },
  c9a: { title: '单位矩阵与对角矩阵', ordered: true, kids: ['identity_def', 'diag_mult'] },
  c9b: { title: '特征值与特征向量', ordered: true, kids: ['eig_def', 'char_poly', 'ex_eig2'] },
  c9c: { title: '矩阵的逆', ordered: true, kids: ['inverse_def', 'inv_det', 'inv_2x2', 'inv_method', 'ex_inv2'] },
  c9d: { title: '对角化', ordered: true, kids: ['diagonalizable_def', 'diag_power', 'ex_power100', 'ex_diag3'] }
};

/* ---------- 节点 ---------- */
const N = {
  /* ===== 第 1 章 向量空间 ℝⁿ ===== */
  rn_def: {
    type: 'def', imp: 3, title: 'ℝⁿ：n 维实向量空间', alias: ['R^n', '向量', '实向量空间'],
    body: R`$$\mathbb{R}^n=\{(x_1,\dots,x_n):\ x_1,\dots,x_n\in\mathbb{R}\},$$
<p>称为 $n$ 维实向量空间，它的元素叫做（实）向量。</p>
<ul><li>$\mathbb{R}^2$ 中的向量：$(1,-2)\in\mathbb{R}^2$；$(x,y)$，其中 $x,y\in\mathbb{R}$。</li>
<li>$\mathbb{R}^3$ 中的向量：$(3,-4,\pi)\in\mathbb{R}^3$；$(x,y,z)$，其中 $x,y,z\in\mathbb{R}$。</li></ul>
<p>向量中的各个坐标是有顺序的：$(1,2)\ne(2,1)$。</p>
<p><strong>标量</strong>：一个实数（或复数）。<strong>向量</strong>：一个实向量（或复向量）。</p>`
  },
  vec_add: {
    type: 'def', imp: 3, title: 'ℝⁿ 中的加法', alias: ['向量加法'],
    deps: ['rn_def'],
    body: R`<p>设 $x=(x_1,\dots,x_n)\in\mathbb{R}^n$，$y=(y_1,\dots,y_n)\in\mathbb{R}^n$，定义</p>$$x+y=(x_1+y_1,\dots,x_n+y_n).$$
<p><strong>例.</strong> $(1,2,3)+(-1,4,7)=(0,6,10)$；$(1,2,3,4,5,6)+(-1,-2,-3,-4,-5,-6)=(0,0,0,0,0,0)$。</p>
<p><strong>注.</strong> 我们只能对同一维数的两个向量做加法运算。</p>`
  },
  scalar_mult: {
    type: 'def', imp: 3, title: 'ℝⁿ 中的标量乘法', alias: ['数乘'],
    deps: ['rn_def'],
    body: R`<p>标量 $\cdot$ 向量 $=$ 向量。设 $x=(x_1,\dots,x_n)\in\mathbb{R}^n$，$a\in\mathbb{R}$，定义</p>$$ax=(ax_1,\dots,ax_n)\in\mathbb{R}^n.$$
<p><strong>例.</strong> $3(-2,1,0)=(-6,3,0)$；$-2(0,1,3)=(0,-2,-6)$；$-(1,2,3,4)=(-1,-2,-3,-4)$。</p>`
  },
  vec_len: {
    type: 'def', imp: 3, title: 'ℝⁿ 中向量的长度', alias: ['模', '范数', '|x|'],
    deps: ['rn_def'],
    body: R`<p>设 $x=(x_1,\dots,x_n)\in\mathbb{R}^n$，定义</p>$$|x|=\sqrt{x_1^2+\cdots+x_n^2}.$$
<p>$\mathbb{R}^2$ 中 $|(a,b)|=\sqrt{a^2+b^2}$（勾股定理），$\mathbb{R}^3$ 中 $|(a,b,c)|=\sqrt{a^2+b^2+c^2}$。</p>
<p><strong>例.</strong> $|(3,4)|=\sqrt{3^2+4^2}=5$；$|(-1,1)|=\sqrt2$；$|(3,4,12)|=\sqrt{9+16+144}=13$；$\mathbb{R}^n$ 中 $|(1,\dots,1)|=\sqrt n$。</p>
<p>由定义直接可得 $|ax|=|a|\,|x|$（$a\in\mathbb{R}$）。</p>`
  },
  lincomb_def: {
    type: 'def', imp: 3, title: '线性组合', alias: ['linear combination'],
    deps: ['vec_add', 'scalar_mult'],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$，$a_1,\dots,a_m\in\mathbb{R}$，则称</p>$$a_1x_1+\cdots+a_mx_m$$<p>是 $x_1,\dots,x_m$ 的一个<strong>线性组合</strong>。$m=2$ 时就是 $ax+by$。</p>
<p><strong>例.</strong> $2x+3y$，$-x+y$，$x=x+0y$，$0=0x+0y$ 都是 $x$ 和 $y$ 的线性组合（这里的 $0$ 是零向量——符号滥用）；$(3x+5y)+(x-3y)=4x+2y$ 也是。$x_1+\cdots+x_m$，$x_1+2x_2+\cdots+mx_m$ 都是 $x_1,\dots,x_m$ 的线性组合。</p>`
  },
  ex_lincomb: {
    type: 'example', imp: 1, title: '例：计算线性组合', alias: [], attach: ['lincomb_def'],
    body: R`<p>计算 $2(1,2,0)-3(4,2,6)$ 与 $2(1,2)-(2,4)$。</p>`,
    sols: [{ name: '逐个坐标计算', deps: ['lincomb_def'], body: R`$$2(1,2,0)-3(4,2,6)=(2\cdot1-3\cdot4,\ 2\cdot2-3\cdot2,\ 2\cdot0-3\cdot6)=(-10,-2,-18).$$$$2(1,2)-(2,4)=(2\cdot1-2,\ 2\cdot2-4)=(0,0).$$` }]
  },
  lincomb_closed: {
    type: 'prop', imp: 2, title: '线性组合的线性组合仍是线性组合', alias: [],
    body: R`<p>假如 $u,v$ 都是 $x_1,\dots,x_m$ 的线性组合，那么 $u+v$ 是 $x_1,\dots,x_m$ 的一个线性组合；更一般地，$u,v$ 的任何线性组合仍是 $x_1,\dots,x_m$ 的一个线性组合。</p>`,
    proofs: [{
      name: '合并系数', deps: ['lincomb_def'],
      body: R`<p>若 $u=a_1x_1+\cdots+a_mx_m$，$v=b_1x_1+\cdots+b_mx_m$（$a_i,b_i\in\mathbb{R}$），则</p>$$u+v=(a_1+b_1)x_1+\cdots+(a_m+b_m)x_m.$$<p>同理 $cu+dv=(ca_1+db_1)x_1+\cdots+(ca_m+db_m)x_m$（补全）。</p>`
    }]
  },
  span_def: {
    type: 'def', imp: 3, title: '张成 span', alias: ['span', '生成'],
    deps: ['lincomb_def'],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$，定义</p>$$\operatorname{span}(x_1,\dots,x_m)=\{x_1,\dots,x_m\ \text{的所有线性组合}\}=\{a_1x_1+\cdots+a_mx_m:\ a_1,\dots,a_m\in\mathbb{R}\}.$$
<p>若 $\operatorname{span}(x_1,\dots,x_m)=\mathbb{R}^n$，则称 $x_1,\dots,x_m$ <strong>张成</strong>了 $\mathbb{R}^n$。</p>`
  },
  ex_span: {
    type: 'example', imp: 2, title: '例：哪些向量张成了 ℝ²', alias: [], attach: ['span_def'],
    body: R`<p>判断：(1) $(1,0),(0,1)$；(2) $(2,4),(3,7)$；(3) $(2,4),(3,6)$ 是否张成 $\mathbb{R}^2$。（以及 $(1,0,0),(0,1,0),(0,0,1)$ 张成 $\mathbb{R}^3$。）</p>`,
    sols: [{
      name: '画图与解方程', deps: ['span_def'],
      body: R`<p>(1) 张成。对任意 $(a,b)$，$(a,b)=a(1,0)+b(0,1)$。同理 $(1,0,0),(0,1,0),(0,0,1)$ 张成 $\mathbb{R}^3$。</p>
<p>(2) 张成。两个向量不在同一条直线上，任意向量都可以沿这两个方向分解成平行四边形的两边。（补全：解 $a(2,4)+b(3,7)=(p,q)$，得 $b=q-2p$，$a=\frac{7p-3q}{2}$，总有解。）</p>
<p>(3) 不张成。$(3,6)=\frac32(2,4)$，两个向量在同一条过原点的直线上，$\operatorname{span}((2,4),(3,6))$ 就是这条直线，直线外的点（例如 $(1,0)$）不在其中。</p>`
    }]
  },
  indep_def: {
    type: 'def', imp: 3, title: '线性无关与线性相关', alias: ['linear independence', '线性相关'],
    deps: ['lincomb_def'],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$。称 $x_1,\dots,x_m$ 是<strong>线性无关</strong>的 $\iff$ 对任意 $a_1,\dots,a_m\in\mathbb{R}$，</p>$$a_1x_1+\cdots+a_mx_m=0\ \Longrightarrow\ a_1=\cdots=a_m=0.$$
<p>即：不存在不平凡的线性组合等于零向量（平凡的线性组合：$0x_1+\cdots+0x_m$）。</p>
<p>反之，若存在一组不全为零的 $a_1,\dots,a_m$ 使 $a_1x_1+\cdots+a_mx_m=0$，则称它们是<strong>线性相关</strong>的。</p>
<p><strong>例.</strong> $(1,2),(2,4)$ 是线性相关的，因为 $2(1,2)-(2,4)=(0,0)$。</p>`
  },
  indep_test: {
    type: 'prop', imp: 3, title: '线性无关的判别法则', alias: ['逐个不在前面的张成里'],
    body: R`<p>要证明 $x_1,\dots,x_m\in\mathbb{R}^n$ 是线性无关的，只需要证明</p>
$$\begin{cases}x_1\ne(0,\dots,0),\\ x_2\notin\operatorname{span}(x_1),\\ x_3\notin\operatorname{span}(x_1,x_2),\\ \quad\vdots\\ x_m\notin\operatorname{span}(x_1,\dots,x_{m-1}).\end{cases}$$`,
    proofs: [{
      name: '看最后一个非零系数（补全）', deps: ['indep_def', 'span_def'],
      body: R`<p>笔记只给了结论，这里补上证明。用反证法：假设 $a_1x_1+\cdots+a_mx_m=0$，而 $a_1,\dots,a_m$ 不全为零。设 $k$ 是使 $a_k\ne0$ 的最大下标，则 $a_1x_1+\cdots+a_kx_k=0$。</p>
<p>若 $k=1$，则 $a_1x_1=0$，$a_1\ne0$，所以 $x_1=0$，矛盾。</p>
<p>若 $k\ge2$，则</p>$$x_k=-\frac{a_1}{a_k}x_1-\cdots-\frac{a_{k-1}}{a_k}x_{k-1}\in\operatorname{span}(x_1,\dots,x_{k-1}),$$<p>矛盾。所以 $a_1=\cdots=a_m=0$。</p>`
    }]
  },
  basis_def: {
    type: 'def', imp: 3, title: 'ℝⁿ 的基', alias: ['basis'],
    deps: ['span_def', 'indep_def'],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$。称 $x_1,\dots,x_m$ 构成 $\mathbb{R}^n$ 的一组<strong>基</strong></p>
$$\iff\begin{cases}x_1,\dots,x_m\ \text{张成了}\ \mathbb{R}^n,\\ x_1,\dots,x_m\ \text{是线性无关的}.\end{cases}$$
<p>同样可以定义一个线性子空间 $V$ 的基（张成 $V$ 且线性无关），基中向量的个数叫做 $V$ 的<strong>维数</strong> $\dim V$。</p>`
  },
  basis_props: {
    type: 'prop', imp: 3, title: '基的性质：向量个数', alias: ['m=n', '维数'],
    deps: ['basis_def'],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$。</p>
<ol class="plain"><li>(1) 若 $x_1,\dots,x_m$ 构成 $\mathbb{R}^n$ 的一组基，则 $m=n$；</li>
<li>(2) 若 $x_1,\dots,x_m$ 张成了 $\mathbb{R}^n$，则 $m\ge n$；</li>
<li>(3) 若 $x_1,\dots,x_m$ 是线性无关的，则 $m\le n$。</li></ol>
<p><strong>注.</strong> (2)(3) 需要证明，(1) 是 (2)(3) 的结论。证明要用到行阶梯形，放在第 7 章：[[basis_props_pf]]。</p>`
  },
  subspace_def: {
    type: 'def', imp: 3, title: 'ℝⁿ 的线性子空间', alias: ['子空间', 'subspace', '直线', '平面', '超平面'],
    deps: ['vec_add', 'scalar_mult'],
    body: R`<p>设 $V\subset\mathbb{R}^n$。称 $V$ 是 $\mathbb{R}^n$ 的一个<strong>线性子空间</strong>（简称子空间）</p>
$$\iff\begin{cases}0\in V,\\ \text{若 }v,w\in V,\ \text{则 }v+w\in V,\\ \text{若 }v\in V,\ a\in\mathbb{R},\ \text{则 }av\in V.\end{cases}$$
<p>后两条合起来就是：对线性组合封闭。</p>
<p>称 $\mathbb{R}^n$ 的 $1$ 维子空间为<strong>直线</strong>（line），$2$ 维子空间为<strong>平面</strong>（plane），$(n-1)$ 维子空间为<strong>超平面</strong>（hyperplane）。</p>`
  },
  ex_subspace_list: {
    type: 'example', imp: 1, title: '例：哪些是子空间', alias: [], attach: ['subspace_def'],
    body: R`<p>判断：$\varnothing$；$x$ 轴；$\mathbb{R}^3$ 中过原点的直线；$\mathbb{R}^n$ 中若干向量的张成。</p>`,
    sols: [{
      name: '逐条验证', deps: ['subspace_def'],
      body: R`<ul><li>$\varnothing$ 不是 $\mathbb{R}^n$ 的线性子空间（不含 $0$）。</li><li>$x$ 轴是 $\mathbb{R}^2$ 的线性子空间（见下一个例子）。</li><li>过原点的直线 $\{tv:t\in\mathbb{R}\}$ 是 $\mathbb{R}^3$ 的线性子空间。</li><li>$\mathbb{R}^n$ 中若干向量的张成是 $\mathbb{R}^n$ 的线性子空间，见 [[span_subspace]]。</li></ul>`
    }]
  },
  span_subspace: {
    type: 'prop', imp: 2, title: '张成是线性子空间', alias: [],
    body: R`<p>设 $x_1,\dots,x_m\in\mathbb{R}^n$，则 $\operatorname{span}(x_1,\dots,x_m)$ 是 $\mathbb{R}^n$ 的线性子空间。</p>`,
    proofs: [{
      name: '验证三条（补全）', deps: ['subspace_def', 'span_def', 'lincomb_closed'],
      body: R`<p>$0=0x_1+\cdots+0x_m$ 在其中；两个线性组合的和、线性组合的倍数仍是 $x_1,\dots,x_m$ 的线性组合（[[lincomb_closed]]）。</p>`
    }]
  },
  ex_sub_axis: {
    type: 'example', imp: 1, title: '例：第一个坐标轴是子空间', alias: [], attach: ['subspace_def'],
    body: R`<p>证明 $V=\{(x,0,\dots,0):\ x\in\mathbb{R}\}\subset\mathbb{R}^n$ 是 $\mathbb{R}^n$ 的线性子空间。</p>`,
    sols: [{
      name: '验证三条', deps: ['subspace_def'],
      body: R`<p>① $(0,\dots,0)=(0,0,\dots,0)\in V$。</p><p>② 设 $v=(x,0,\dots,0)$，$w=(y,0,\dots,0)\in V$，则 $v+w=(x+y,0,\dots,0)\in V$。</p><p>③ 设 $v=(x,0,\dots,0)\in V$，$a\in\mathbb{R}$，则 $av=(ax,0,\dots,0)\in V$。</p>`
    }]
  },
  ex_sub_W: {
    type: 'example', imp: 2, title: '例：{(x, y, x+y)} 是 ℝ³ 的子空间', alias: [], attach: ['subspace_def', 'span_subspace'],
    body: R`<p>证明 $W=\{(x,y,x+y):\ x,y\in\mathbb{R}\}\subset\mathbb{R}^3$ 是 $\mathbb{R}^3$ 的线性子空间。</p>`,
    sols: [{
      name: '验证三条', deps: ['subspace_def'],
      body: R`<p>① $(0,0,0)=(0,0,0+0)\in W$。</p><p>② 设 $v_1=(x,y,x+y)$，$v_2=(z,w,z+w)\in W$，则 $v_1+v_2=\big(x+z,\ y+w,\ (x+z)+(y+w)\big)\in W$。</p><p>③ 设 $v=(x,y,x+y)\in W$，$a\in\mathbb{R}$，则 $av=(ax,ay,ax+ay)\in W$。</p>`
    }, {
      name: '写成张成', deps: ['span_subspace'],
      body: R`$$(x,y,x+y)=(x,0,x)+(0,y,y)=x(1,0,1)+y(0,1,1),$$$$W=\{x(1,0,1)+y(0,1,1):\ x,y\in\mathbb{R}\}=\operatorname{span}\big((1,0,1),(0,1,1)\big),$$<p>张成是子空间。</p>`
    }]
  },

  /* ===== 第 2 章 点乘与投影 ===== */
  dot_def: {
    type: 'def', imp: 3, title: '点乘（实内积）', alias: ['内积', 'dot product', 'x·y'],
    deps: ['rn_def'],
    body: R`<p>设 $x=(x_1,\dots,x_n)$，$y=(y_1,\dots,y_n)\in\mathbb{R}^n$，定义</p>$$x\cdot y=x_1y_1+\cdots+x_ny_n\in\mathbb{R}.$$<p>向量 $\cdot$ 向量 $=$ 标量。</p>`
  },
  dot_props: {
    type: 'prop', imp: 3, title: '点乘的性质', alias: ['双线性', '对称性'],
    body: R`<p>设 $x,y,z\in\mathbb{R}^n$，$a\in\mathbb{R}$，则</p>
$$\begin{cases}(x+y)\cdot z=x\cdot z+y\cdot z & ①\\ (ax)\cdot y=x\cdot(ay)=a(x\cdot y) & ②\\ x\cdot y=y\cdot x & ③\\ x\cdot x=|x|^2 & ④\end{cases}$$`,
    proofs: [{
      name: '逐个坐标展开', deps: ['dot_def', 'vec_len'],
      body: R`<p>设 $x=(x_1,\dots,x_n)$，$y=(y_1,\dots,y_n)$，$z=(z_1,\dots,z_n)$。</p>
<p>① 左 $=(x_1+y_1,\dots,x_n+y_n)\cdot(z_1,\dots,z_n)=(x_1+y_1)z_1+\cdots+(x_n+y_n)z_n=x_1z_1+y_1z_1+\cdots+x_nz_n+y_nz_n$；右 $=x_1z_1+\cdots+x_nz_n+y_1z_1+\cdots+y_nz_n$。</p>
<p>② $(ax_1,\dots,ax_n)\cdot(y_1,\dots,y_n)=ax_1y_1+\cdots+ax_ny_n$；$(x_1,\dots,x_n)\cdot(ay_1,\dots,ay_n)=ax_1y_1+\cdots+ax_ny_n$；$a(x_1y_1+\cdots+x_ny_n)=ax_1y_1+\cdots+ax_ny_n$。</p>
<p>③ 左 $=x_1y_1+\cdots+x_ny_n$，右 $=y_1x_1+\cdots+y_nx_n$。</p>
<p>④ 左 $=x_1^2+\cdots+x_n^2$，右 $=|x|^2=\big(\sqrt{x_1^2+\cdots+x_n^2}\big)^2=x_1^2+\cdots+x_n^2$。</p>`
    }]
  },
  cs_ineq: {
    type: 'thm', imp: 3, title: 'Cauchy–Schwarz 不等式', alias: ['柯西不等式', 'C-S', '柯西-施瓦茨'],
    body: R`<p>设 $x,y\in\mathbb{R}^n$，则</p>$$-|x||y|\le x\cdot y\le|x||y|,\qquad\text{即}\qquad|x\cdot y|\le|x|\,|y|.$$
<p>注意各个符号的含义：$x\cdot y$ 是向量点乘，结果是实数，$|x\cdot y|$ 是它的绝对值；$|x|,|y|$ 是 $\mathbb{R}^n$ 中的长度，$|x||y|$ 是实数乘法。</p>`,
    proofs: [{
      name: '先化成单位向量', deps: ['dot_props', 'vec_len'],
      body: R`<p>1° 若 $x=0$ 或 $y=0$，则原不等式显然成立（两边都是 $0$）。</p>
<p>2° 假设 $x\ne0$ 且 $y\ne0$。只需证明</p>$$\left|\frac{x}{|x|}\cdot\frac{y}{|y|}\right|=\left|\frac{x\cdot y}{|x||y|}\right|=\frac{|x\cdot y|}{|x||y|}\le1.$$
<p>设 $u=\frac{x}{|x|}$，$v=\frac{y}{|y|}$，则 $|u|=\big|\frac{x}{|x|}\big|=\frac{1}{|x|}|x|=1$（用了 $|ax|=|a||x|$），同理 $|v|=1$。</p>
<p>因此我们只需证明：若 $u,v\in\mathbb{R}^n$ 且 $|u|=|v|=1$，则 $|u\cdot v|\le1$，或等价地 $-1\le u\cdot v\le1$。</p>
<p>考虑</p>$$0\le(u+v)\cdot(u+v)=u\cdot u+u\cdot v+v\cdot u+v\cdot v=|u|^2+2(u\cdot v)+|v|^2=2+2(u\cdot v),$$<p>故 $2(u\cdot v)\ge-2$，即 $u\cdot v\ge-1$。另一方面</p>$$0\le(u-v)\cdot(u-v)=|u|^2-2(u\cdot v)+|v|^2=2-2(u\cdot v),$$<p>故 $2(u\cdot v)\le2$，即 $u\cdot v\le1$。</p>`
    }]
  },
  ex_cs_check: {
    type: 'example', imp: 1, title: '例：检验 Cauchy–Schwarz 不等式', alias: [], attach: ['cs_ineq'],
    body: R`<p>设 $v=(1,-2,0)$，$w=(3,4,5)$，检验 $|v\cdot w|\le|v|\cdot|w|$。</p>`,
    sols: [{
      name: '直接计算', deps: ['dot_def', 'vec_len'],
      body: R`<p>$v\cdot w=3-8=-5$，$|v\cdot w|=|-5|=5$。$|v|=\sqrt{1^2+2^2}=\sqrt5$，$|w|=\sqrt{3^2+4^2+5^2}=\sqrt{50}=5\sqrt2$。</p>$$|v|\cdot|w|=\sqrt5\cdot5\sqrt2=5\sqrt{10}\approx15.81.$$<p>经检验，$|v\cdot w|\le|v|\cdot|w|$。</p>`
    }]
  },
  angle_def: {
    type: 'def', imp: 3, title: '两个向量的夹角', alias: ['夹角', 'arccos'],
    deps: ['cs_ineq'],
    body: R`<p>回顾：中学阶段我们有 $\vec u\cdot\vec v=|\vec u||\vec v|\cos\theta$，其中 $\cos\theta\in[-1,1]$。</p>
<p>在 $\mathbb{R}^n$ 中，希望定义 $x,y\in\mathbb{R}^n$（$x,y\ne0$）的夹角 $\theta$ 满足 $\cos\theta=\dfrac{x\cdot y}{|x||y|}$，即 $\theta=\arccos\Big(\dfrac{x\cdot y}{|x||y|}\Big)$。这必须要有 $-1\le\dfrac{x\cdot y}{|x||y|}\le1$，而这就是 C-S 不等式。</p>
<p><strong>定义.</strong> 设 $x,y\in\mathbb{R}^n$，$x,y\ne0$，定义 $x,y$ 之间的夹角为</p>$$\arccos\Big(\frac{x\cdot y}{|x||y|}\Big).$$`
  },
  ex_cs_sum: {
    type: 'example', imp: 2, title: '例：(x₁+⋯+xₙ)² ≤ n(x₁²+⋯+xₙ²)', alias: ['均值不等式'], attach: ['cs_ineq'],
    body: R`<p>设 $x_1,\dots,x_n\in\mathbb{R}$，求证 $(x_1+\cdots+x_n)^2\le n(x_1^2+\cdots+x_n^2)$。</p>`,
    sols: [{
      name: '与 (1,…,1) 点乘', deps: ['cs_ineq', 'dot_props'],
      body: R`<p>$x_1^2+\cdots+x_n^2=|(x_1,\dots,x_n)|^2$，$x_1+\cdots+x_n=(1,\dots,1)\cdot(x_1,\dots,x_n)$。设 $x=(x_1,\dots,x_n)$，$y=(1,\dots,1)\in\mathbb{R}^n$，则由 C-S 不等式 $(x\cdot y)^2\le|x|^2|y|^2$，即</p>$$(x_1+\cdots+x_n)^2\le(1^2+\cdots+1^2)(x_1^2+\cdots+x_n^2)=n(x_1^2+\cdots+x_n^2).$$`
    }]
  },
  ex_cs_frac: {
    type: 'example', imp: 2, title: '例：分式形式的 Cauchy–Schwarz', alias: ['权方和不等式'], attach: ['cs_ineq'],
    body: R`<p>设 $a_1,\dots,a_n\ge0$，$b_1,\dots,b_n>0$，求证</p>$$\big(\sqrt{a_1}+\cdots+\sqrt{a_n}\big)^2\le\Big(\frac{a_1}{b_1}+\cdots+\frac{a_n}{b_n}\Big)(b_1+\cdots+b_n).$$<p>（笔记写 $b_i\ge0$；$b_i$ 在分母上，应为 $b_i>0$。）</p>`,
    sols: [{
      name: '凑成 (x·y)² ≤ |x|²|y|²', deps: ['cs_ineq'],
      body: R`<p>通过观察，原式具有 $(x\cdot y)^2\le|x|^2|y|^2$ 的形式。设</p>$$x=\Big(\frac{\sqrt{a_1}}{\sqrt{b_1}},\dots,\frac{\sqrt{a_n}}{\sqrt{b_n}}\Big),\qquad y=(\sqrt{b_1},\dots,\sqrt{b_n}),$$<p>则 $x\cdot y=\sqrt{a_1}+\cdots+\sqrt{a_n}$，$|x|^2=\frac{a_1}{b_1}+\cdots+\frac{a_n}{b_n}$，$|y|^2=b_1+\cdots+b_n$。因此 $(x\cdot y)^2\le|x|^2|y|^2$ 就是原式。</p>
<p><strong>注.</strong> 原式等价于：若 $a_i\ge0$，$b_i>0$，则</p>$$\frac{a_1}{b_1}+\cdots+\frac{a_n}{b_n}\ge\frac{(\sqrt{a_1}+\cdots+\sqrt{a_n})^2}{b_1+\cdots+b_n}.$$`
    }]
  },
  dot_geom: {
    type: 'prop', imp: 3, title: '点乘的几何意义', alias: ['平行', '垂直', '正交', '同向', '反向'],
    deps: ['angle_def'],
    body: R`<p>根据定义 $v\cdot w=|v||w|\cos\theta$，其中 $\theta$ 是 $v,w$ 之间的夹角，$v,w\in\mathbb{R}^n$，$v,w\ne0$。</p>
$$\begin{cases}v\parallel w\iff v\cdot w=\pm|v||w|\iff|v\cdot w|=|v||w|,\\ v,w\ \text{同向}\iff v\cdot w=|v||w|,\\ v,w\ \text{反向}\iff v\cdot w=-|v||w|,\\ v\perp w\iff v\cdot w=0.\end{cases}$$
<p>因此，假设给定了 $|v|$ 和 $|w|$（$v,w\ne0$），那么 $v\cdot w$：取到最大值 $|v||w|\iff v,w$ 同向；取到 $0\iff v\perp w$；取到最小值 $-|v||w|\iff v,w$ 反向。</p>`
  },
  ex_perp: {
    type: 'example', imp: 1, title: '例：验证两组向量垂直', alias: [], attach: ['dot_geom'],
    body: R`<p>求证 $(3,1)\perp(-1,3)$，$(3,1)\perp(-2,6)$。</p>`,
    sols: [{ name: '点乘为零', deps: ['dot_geom'], body: R`<p>$(3,1)\cdot(-1,3)=-3+3=0$，$(3,1)\cdot(-2,6)=-6+6=0$。</p>` }]
  },
  perp_comb: {
    type: 'prop', imp: 2, title: '与 v、w 都垂直，就与它们的线性组合垂直', alias: [],
    body: R`<p>如果 $u\perp v$ 且 $u\perp w$，则对任意 $a,b\in\mathbb{R}$，都有 $u\perp(av+bw)$。</p>`,
    proofs: [{ name: '点乘的线性', deps: ['dot_props', 'dot_geom'], body: R`$$u\cdot(av+bw)=u\cdot(av)+u\cdot(bw)=a(u\cdot v)+b(u\cdot w)=0.$$` }]
  },
  perp_subspace: {
    type: 'prop', imp: 2, title: '与 v 垂直的向量构成子空间', alias: ['正交补'],
    body: R`<p>若 $v\in\mathbb{R}^n$，则 $W=\{w\in\mathbb{R}^n:\ v\cdot w=0\}\subset\mathbb{R}^n$ 是 $\mathbb{R}^n$ 的线性子空间。</p>`,
    proofs: [{
      name: '验证三条', deps: ['subspace_def', 'dot_props'],
      body: R`<p>① $v\cdot0=0$，故 $0\in W$。</p><p>② 设 $w_1,w_2\in W$，即 $v\cdot w_1=v\cdot w_2=0$，则 $v\cdot(w_1+w_2)=v\cdot w_1+v\cdot w_2=0$，故 $w_1+w_2\in W$。</p><p>③ 设 $w\in W$，即 $v\cdot w=0$，设 $a\in\mathbb{R}$，则 $v\cdot(aw)=a(v\cdot w)=0$，故 $aw\in W$。</p><p>②③：对线性组合封闭。</p>`
    }]
  },
  proj_def: {
    type: 'def', imp: 3, title: '投影 proj_w(v)', alias: ['projection', '正交投影'],
    deps: ['dot_props', 'dot_geom'],
    body: R`<p>$\operatorname{proj}_w(v)$：$v$ 在 $w$ 方向上的投影。</p>
<p><strong>推导.</strong> 设 $\operatorname{proj}_w(v)=kw$，其中 $k\in\mathbb{R}$。从 $v$ 的终点向 $w$ 所在直线作垂线，垂足就是 $kw$，所以 $kw-v\perp w$：</p>
$$(kw-v)\cdot w=0\ (w\ne0)\ \Rightarrow\ (kw)\cdot w-v\cdot w=0\ \Rightarrow\ k(w\cdot w)=v\cdot w\ \Rightarrow\ k|w|^2=v\cdot w\ \Rightarrow\ k=\frac{v\cdot w}{|w|^2}.$$
<p><strong>定义.</strong> 设 $w\in\mathbb{R}^n$，$w\ne0$，$v\in\mathbb{R}^n$，定义</p>$$\operatorname{proj}_w(v)=\frac{v\cdot w}{|w|^2}\,w,$$<p>其中 $\dfrac{v\cdot w}{|w|^2}\in\mathbb{R}$，$w\in\mathbb{R}^n$。</p>`
  },
  ex_proj_axis: {
    type: 'example', imp: 1, title: '例：投影到 x 轴', alias: [], attach: ['proj_def'],
    body: R`<p>设 $w=(1,0)$，$v=(a,b)\in\mathbb{R}^2$，检验 $\operatorname{proj}_w(v)=(a,0)$。</p>`,
    sols: [{ name: '代公式', deps: ['proj_def'], body: R`$$\operatorname{proj}_w(v)=\frac{v\cdot w}{|w|^2}w=\frac a1(1,0)=(a,0).$$` }]
  },
  ex_proj_3d: {
    type: 'example', imp: 2, title: '例：计算 ℝ³ 中的投影', alias: [], attach: ['proj_def'],
    body: R`<p>设 $v=(2,4,6)$，$w=(-5,3,2)\in\mathbb{R}^3$，求 $\operatorname{proj}_w(v)$。</p>`,
    sols: [{
      name: '代公式', deps: ['proj_def'],
      body: R`$$\begin{aligned}\operatorname{proj}_w(v)&=\frac{v\cdot w}{|w|^2}w=\frac{-10+12+12}{25+9+4}(-5,3,2)=\frac{14}{38}(-5,3,2)\\&=\frac7{19}(-5,3,2)=\Big(-\frac{35}{19},\ \frac{21}{19},\ \frac{14}{19}\Big).\end{aligned}$$`
    }]
  },
  ex_proj_parallel: {
    type: 'example', imp: 1, title: '例：平行时投影就是自己', alias: [], attach: ['proj_def'],
    body: R`<p>设 $v,w\in\mathbb{R}^n$，$w\ne0$，且 $v\parallel w$，检验 $\operatorname{proj}_w(v)=v$。</p>`,
    sols: [{ name: '设 v = kw', deps: ['proj_def', 'dot_props'], body: R`<p>设 $v=kw$，其中 $k\in\mathbb{R}$。</p>$$\operatorname{proj}_w(v)=\frac{v\cdot w}{|w|^2}w=\frac{(kw)\cdot w}{|w|^2}w=\frac{k|w|^2}{|w|^2}w=kw=v.$$` }]
  },

  /* ===== 第 3 章 线性映射 ===== */
  map_review: {
    type: 'note', imp: 2, title: '映射、单射、满射、双射', alias: ['映射', '定义域', '陪域', '值域', 'range'],
    deps: ['shuxue-jichu:map_def', 'shuxue-jichu:surj_def', 'shuxue-jichu:inj_def', 'shuxue-jichu:bij_def', 'shuxue-jichu:bij_inv'],
    body: R`<p><strong>映射</strong> $f:X\to Y$：对任意 $x\in X$，存在唯一与之对应的 $f(x)\in Y$。$X$ 叫做定义域，$Y$ 叫做陪域，$\operatorname{range}(f)=\{f(x):x\in X\}$ 叫做值域，显然 $\operatorname{range}(f)\subset Y$。</p>
<ul><li><strong>满射</strong>：$\operatorname{range}(f)=Y$，即对任意 $y\in Y$，都存在 $x\in X$ 使得 $y=f(x)$。</li>
<li><strong>单射</strong>：对任意 $x,y\in X$，$x\ne y\Rightarrow f(x)\ne f(y)$；或等价地，$f(x)=f(y)\Rightarrow x=y$。</li>
<li><strong>双射</strong>：既是单射又是满射。此时 $f$ 是 $X$ 与 $Y$ 中元素的一一对应，存在逆映射 $f^{-1}:Y\to X$，满足对任意 $x\in X$，$f^{-1}(f(x))=x$；对任意 $y\in Y$，$f(f^{-1}(y))=y$。</li></ul>
<p>详细内容见「数学基础」：[[shuxue-jichu:map_def]]、[[shuxue-jichu:surj_def]]、[[shuxue-jichu:inj_def]]、[[shuxue-jichu:bij_def]]、[[shuxue-jichu:bij_inv]]。</p>`
  },
  linmap_def: {
    type: 'def', imp: 3, title: '线性映射', alias: ['linear map', '线性变换'],
    deps: ['map_review', 'vec_add', 'scalar_mult'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$ 是一个映射。称 $f$ 是一个<strong>线性映射</strong>（具有线性性的映射）</p>
$$\iff\begin{cases}\text{对任意 }v,w\in\mathbb{R}^n,\ f(v+w)=f(v)+f(w),\\ \text{对任意 }v\in\mathbb{R}^n,\ a\in\mathbb{R},\ f(av)=af(v).\end{cases}$$
<p>第一条：$f$ 保持了加法运算；第二条：$f$ 保持了标量乘法。</p>`
  },
  linmap_props: {
    type: 'prop', imp: 3, title: '线性映射的基本性质', alias: ['f(0)=0', 'f(av+bw)=af(v)+bf(w)'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$ 是线性映射，则</p>
$$\begin{cases}f(0)=0 & ①\\ \text{若 }v,w\in\mathbb{R}^n,\ a,b\in\mathbb{R},\ \text{则 }f(av+bw)=af(v)+bf(w) & ②\end{cases}$$
<p>实际上，只要证明了对任意 $v,w\in\mathbb{R}^n$，$a,b\in\mathbb{R}$ 都有 $f(av+bw)=af(v)+bf(w)$，就能证明 $f:\mathbb{R}^n\to\mathbb{R}^m$ 是一个线性映射（取 $a=b=1$ 得到第一条，取 $b=0$ 得到第二条）。</p>`,
    proofs: [{
      name: '直接验证', deps: ['linmap_def'],
      body: R`<p>① $f(0)=f(0+0)=f(0)+f(0)$，两边减去 $f(0)$，故 $f(0)=0$。</p><p>②（补全）$f(av+bw)=f(av)+f(bw)=af(v)+bf(w)$。</p>`
    }]
  },
  ex_xy_nonlinear: {
    type: 'example', imp: 1, title: '例：f(x, y) = xy 不是线性映射', alias: [], attach: ['linmap_def'],
    body: R`<p>设 $f:\mathbb{R}^2\to\mathbb{R}$，$f(x,y)=xy$。求证 $f$ 不是线性映射。</p>`,
    sols: [{ name: '举反例', deps: ['linmap_def'], body: R`<p>设 $v=(1,2)$，$w=(3,4)$，则 $v+w=(4,6)$，$f(v+w)=4\cdot6=24$。而 $f(v)+f(w)=1\cdot2+3\cdot4=14$。因此 $f$ 不是线性映射。</p>` }]
  },
  ex_linmap: {
    type: 'example', imp: 2, title: '例：证明一个映射是线性映射', alias: [], attach: ['linmap_def', 'linmap_props'],
    body: R`<p>设 $f:\mathbb{R}^2\to\mathbb{R}^3$，$f(x,y)=(3x+2y,\ -y,\ 4x-7y)$。求证 $f$ 是一个线性映射。</p>`,
    sols: [{
      name: '分别验证两条', deps: ['linmap_def'],
      body: R`<p>① 设 $v_1=(x,y)$，$v_2=(z,w)\in\mathbb{R}^2$，要证明 $f(v_1+v_2)=f(v_1)+f(v_2)$。</p>
$$\begin{aligned}\text{左}&=f(x+z,y+w)=\big(3(x+z)+2(y+w),\ -(y+w),\ 4(x+z)-7(y+w)\big)\\&=(3x+3z+2y+2w,\ -y-w,\ 4x+4z-7y-7w),\\ \text{右}&=(3x+2y,-y,4x-7y)+(3z+2w,-w,4z-7w),\end{aligned}$$<p>两者相等。</p>
<p>② 设 $v=(x,y)\in\mathbb{R}^2$，$a\in\mathbb{R}$，要证明 $f(av)=af(v)$。</p>$$\text{左}=f(ax,ay)=(3ax+2ay,\ -ay,\ 4ax-7ay)=a(3x+2y,-y,4x-7y)=af(v)=\text{右}.$$`
    }, {
      name: '一次验证 f(av₁+bv₂)', deps: ['linmap_props'],
      body: R`<p>设 $v_1=(x,y)$，$v_2=(z,w)$，$a,b\in\mathbb{R}$，要证明 $f(av_1+bv_2)=af(v_1)+bf(v_2)$。</p>
$$\begin{aligned}\text{左}&=f(ax+bz,\ ay+bw)=(3ax+3bz+2ay+2bw,\ -ay-bw,\ 4ax+4bz-7ay-7bw)\\&=(3ax+2ay,-ay,4ax-7ay)+(3bz+2bw,-bw,4bz-7bw)\\&=a(3x+2y,-y,4x-7y)+b(3z+2w,-w,4z-7w)=af(v_1)+bf(v_2)=\text{右}.\end{aligned}$$`
    }]
  },
  std_basis: {
    type: 'def', imp: 3, title: 'ℝⁿ 的标准正交基', alias: ['e₁', '标准基', 'standard basis'],
    deps: ['basis_def'],
    body: R`<p>定义 $\mathbb{R}^n$ 中的标准正交基</p>$$\begin{cases}e_1=(1,0,\dots,0),\\ e_2=(0,1,0,\dots,0),\\ \quad\vdots\\ e_n=(0,\dots,0,1).\end{cases}$$<p>对任意 $x=(x_1,\dots,x_n)$，$x=x_1e_1+\cdots+x_ne_n$。</p>`
  },
  linmap_matrix: {
    type: 'thm', imp: 3, title: '线性映射由 f(e₁), …, f(eₙ) 决定：对应的矩阵', alias: ['矩阵表示', '线性映射的表达式'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$ 是一个线性映射。则对任意 $x=(x_1,\dots,x_n)$，</p>$$f(x_1,\dots,x_n)=x_1f(e_1)+\cdots+x_nf(e_n).$$<p>这 $n$ 个 $m$ 维的向量 $f(e_1),\dots,f(e_n)$ 决定了整个映射。设</p>
$$f(e_1)=\begin{pmatrix}a_{11}\\ \vdots\\ a_{m1}\end{pmatrix},\ \dots,\ f(e_n)=\begin{pmatrix}a_{1n}\\ \vdots\\ a_{mn}\end{pmatrix},\qquad\text{则}\qquad f\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}=\begin{pmatrix}a_{11}x_1+\cdots+a_{1n}x_n\\ \vdots\\ a_{m1}x_1+\cdots+a_{mn}x_n\end{pmatrix}$$
<p>（列向量写法；行向量写法：$f(x_1,\dots,x_n)=(a_{11}x_1+\cdots+a_{1n}x_n,\ \dots,\ a_{m1}x_1+\cdots+a_{mn}x_n)$）。矩阵</p>
$$\begin{pmatrix}a_{11}&\cdots&a_{1n}\\ \vdots&&\vdots\\ a_{m1}&\cdots&a_{mn}\end{pmatrix}=\big(f(e_1)\ \cdots\ f(e_n)\big)$$<p>被称为与 $f$ 对应的矩阵：它的第 $j$ 列就是 $f(e_j)$。</p>`,
    proofs: [{
      name: '按标准基展开', deps: ['std_basis', 'linmap_props'],
      body: R`$$\begin{aligned}f(x)&=f\big((x_1,0,\dots,0)+(0,x_2,0,\dots,0)+\cdots+(0,\dots,0,x_n)\big)\\&=f\big(x_1(1,0,\dots,0)+x_2(0,1,0,\dots,0)+\cdots+x_n(0,\dots,0,1)\big)\\&=f(x_1e_1+\cdots+x_ne_n)=x_1f(e_1)+\cdots+x_nf(e_n),\end{aligned}$$<p>其中 $f(e_j)\in\mathbb{R}^m$。再把每个 $f(e_j)$ 写成列向量、逐个坐标相加即得。</p>`
    }]
  },
  ex_rotation: {
    type: 'example', imp: 3, title: '例：ℝ² 中的旋转矩阵', alias: ['二维旋转矩阵', 'rotation'], attach: ['linmap_matrix'],
    body: R`<p>$\mathbb{R}^2$ 中绕原点逆时针旋转 $\theta$，这是一个从 $\mathbb{R}^2$ 到 $\mathbb{R}^2$ 的线性映射。求它对应的矩阵。</p>`,
    sols: [{
      name: '只看 e₁、e₂ 去哪了', deps: ['linmap_matrix'],
      body: R`<p>只需求出列向量 $f\begin{pmatrix}1\\0\end{pmatrix}$ 和 $f\begin{pmatrix}0\\1\end{pmatrix}$。画图：$\begin{pmatrix}1\\0\end{pmatrix}$ 转到 $\begin{pmatrix}\cos\theta\\ \sin\theta\end{pmatrix}$，$\begin{pmatrix}0\\1\end{pmatrix}$ 转到 $\begin{pmatrix}-\sin\theta\\ \cos\theta\end{pmatrix}$。这意味着与之对应的矩阵是</p>
$$\Big(f\begin{pmatrix}1\\0\end{pmatrix}\ \ f\begin{pmatrix}0\\1\end{pmatrix}\Big)=\begin{pmatrix}\cos\theta&-\sin\theta\\ \sin\theta&\cos\theta\end{pmatrix}\quad(\text{二维旋转矩阵}).$$
<p>因此</p>$$f\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}x\cos\theta-y\sin\theta\\ x\sin\theta+y\cos\theta\end{pmatrix}.\qquad\text{例：}f\begin{pmatrix}3\\4\end{pmatrix}=\begin{pmatrix}3\cos\theta-4\sin\theta\\ 3\sin\theta+4\cos\theta\end{pmatrix}.$$`
    }]
  },
  linmap_ops: {
    type: 'prop', imp: 2, title: '线性映射的加法、数乘与线性组合', alias: ['f+g', 'af'],
    body: R`<p>设 $f,g:\mathbb{R}^n\to\mathbb{R}^m$ 是线性映射，$a,b\in\mathbb{R}$。定义</p>
$$(f+g)(x)=f(x)+g(x),\qquad(af)(x)=af(x),\qquad(af+bg)(x)=af(x)+bg(x).$$<p>那么 $f+g$、$af$、$af+bg:\mathbb{R}^n\to\mathbb{R}^m$ 都是线性映射。</p>`,
    proofs: [{
      name: '验证 af + bg', deps: ['linmap_props'],
      body: R`<p>（$f+g$ 与 $af$ 是 $af+bg$ 的特例。）设 $x,y\in\mathbb{R}^n$，$c,d\in\mathbb{R}$，只需证明 $(af+bg)(cx+dy)=c(af+bg)(x)+d(af+bg)(y)$。</p>
$$\begin{aligned}\text{左}&=af(cx+dy)+bg(cx+dy)=a\big(cf(x)+df(y)\big)+b\big(cg(x)+dg(y)\big)\\&=acf(x)+adf(y)+bcg(x)+bdg(y)=c\big(af(x)+bg(x)\big)+d\big(af(y)+bg(y)\big)\\&=c(af+bg)(x)+d(af+bg)(y)=\text{右}.\end{aligned}$$`
    }]
  },
  linmap_comp: {
    type: 'prop', imp: 3, title: '线性映射的复合仍是线性映射', alias: ['g∘f'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$，$g:\mathbb{R}^m\to\mathbb{R}^p$ 是线性映射，则</p>$$g\circ f:\mathbb{R}^n\to\mathbb{R}^p,\qquad(g\circ f)(x)=g(f(x))$$<p>也是线性映射。</p>`,
    proofs: [{
      name: '两次用线性', deps: ['linmap_props'],
      body: R`<p>设 $x,y\in\mathbb{R}^n$，$a,b\in\mathbb{R}$，只需证明 $(g\circ f)(ax+by)=a(g\circ f)(x)+b(g\circ f)(y)$。</p>
$$\text{左}=g(f(ax+by))=g\big(af(x)+bf(y)\big)\ (f\text{ 是线性的})=ag(f(x))+bg(f(y))\ (g\text{ 是线性的})=\text{右}.$$`
    }]
  },
  img_preimg_sub: {
    type: 'prop', imp: 2, title: '子空间的像与原像仍是子空间', alias: ['f(V)', 'f⁻¹(W)'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$ 是线性映射，则</p>
<ol class="plain"><li>① 若 $V\subset\mathbb{R}^n$ 是 $\mathbb{R}^n$ 的线性子空间，则 $f(V)=\{f(v):v\in V\}$（$V$ 在 $f$ 下的像）是 $\mathbb{R}^m$ 的线性子空间；</li>
<li>② 若 $W\subset\mathbb{R}^m$ 是 $\mathbb{R}^m$ 的线性子空间，则 $f^{-1}(W)=\{v\in\mathbb{R}^n:f(v)\in W\}$（$W$ 在 $f$ 下的原像）是 $\mathbb{R}^n$ 的线性子空间。</li></ol>`,
    proofs: [{
      name: '验证包含 0、对线性组合封闭', deps: ['linmap_props', 'subspace_def'],
      body: R`<p><strong>①</strong> 1° $f(0)=0\in f(V)$。2° 设 $f(v_1),f(v_2)\in f(V)$，其中 $v_1,v_2\in V$，设 $a,b\in\mathbb{R}$。只需证明 $af(v_1)+bf(v_2)\in f(V)$：</p>$$af(v_1)+bf(v_2)=f(\underbrace{av_1+bv_2}_{\in V\ (V\text{ 是线性子空间})})\in f(V).$$
<p><strong>②</strong> 1° $f(0)=0\in W$，故 $0\in f^{-1}(W)$。2° 设 $v_1,v_2\in f^{-1}(W)$，即 $f(v_1),f(v_2)\in W$，设 $a,b\in\mathbb{R}$。只需证明 $av_1+bv_2\in f^{-1}(W)$，即 $f(av_1+bv_2)\in W$：</p>$$f(av_1+bv_2)=a\underbrace{f(v_1)}_{\in W}+b\underbrace{f(v_2)}_{\in W}\in W\quad(W\text{ 是线性子空间}).$$`
    }]
  }
};
