/* 非数学系线性代数（续）：第 4–9 章 */
Object.assign(N, {
  /* ===== 第 4 章 矩阵 ===== */
  mat_def: {
    type: 'def', imp: 3, title: 'm×n 实矩阵', alias: ['矩阵', 'matrix', 'R^{m×n}', '列向量', '行向量'],
    body: R`<p>$\mathbb{R}^{m\times n}=\{m\times n\ \text{实矩阵}\}$。形如</p>
$$A=\begin{pmatrix}a_{11}&\cdots&a_{1n}\\ \vdots&&\vdots\\ a_{m1}&\cdots&a_{mn}\end{pmatrix}=(a_{ij})_{\substack{1\le i\le m\\1\le j\le n}}=(a_{ij}),\qquad a_{ij}\in\mathbb{R}$$
<p>的矩阵叫做一个 $m\times n$ 实矩阵。$a_{ij}$（也记作 $A_{ij}$）是第 $i$ 行第 $j$ 列的元素。</p>
<p>我们可以用 $\mathbb{R}^{n\times1}$ 或 $\mathbb{R}^{1\times n}$ 来理解 $\mathbb{R}^n$：$n\times1$ 矩阵 $\longleftrightarrow$ 列向量（本课默认用这一种）；$1\times n$ 矩阵 $\longleftrightarrow$ 行向量。</p>`
  },
  mat_add: {
    type: 'def', imp: 3, title: '矩阵的加法与标量乘法', alias: ['矩阵加法', '矩阵数乘'],
    deps: ['mat_def'],
    body: R`<p>设 $A=(a_{ij}),\ B=(b_{ij})\in\mathbb{R}^{m\times n}$，$a\in\mathbb{R}$，定义</p>$$A+B=(a_{ij}+b_{ij}),\qquad aA=(a\,a_{ij}).$$
<p><strong>例.</strong></p>$$\begin{pmatrix}3&-4\\6&\pi\\e&\sqrt2\end{pmatrix}+\begin{pmatrix}1&2\\3&4\\5&6\end{pmatrix}=\begin{pmatrix}4&-2\\9&\pi+4\\e+5&\sqrt2+6\end{pmatrix}.$$`
  },
  mat_cols: {
    type: 'note', imp: 2, title: '矩阵的其它表示方法：按列、按行', alias: ['分块'],
    deps: ['mat_def'],
    body: R`<p>设 $A=\begin{pmatrix}3&-4\\6&\pi\\e&\sqrt2\end{pmatrix}$。则 $A=(v_1\ v_2)$，其中 $v_1=\begin{pmatrix}3\\6\\e\end{pmatrix}$，$v_2=\begin{pmatrix}-4\\ \pi\\ \sqrt2\end{pmatrix}$；</p>
<p>且 $A=\begin{pmatrix}w_1\\w_2\\w_3\end{pmatrix}$，其中 $w_1=(3\ \ -4)$，$w_2=(6\ \ \pi)$，$w_3=(e\ \ \sqrt2)$。</p>`
  },
  mat_lincomb: {
    type: 'prop', imp: 2, title: '矩阵的线性组合（按列计算）', alias: [],
    body: R`<p>① 若 $A=(v_1\ \cdots\ v_n)$，$B=(w_1\ \cdots\ w_n)$，则 $A+B=(v_1+w_1\ \cdots\ v_n+w_n)$。</p>
<p>② 若 $A=(v_1\ \cdots\ v_n)$，$a\in\mathbb{R}$，则 $aA=(av_1\ \cdots\ av_n)$。</p>
<p>③ 设 $A=(a_{ij}),\ B=(b_{ij})\in\mathbb{R}^{m\times n}$，$a,b\in\mathbb{R}$，则 $aA+bB=(a\,a_{ij}+b\,b_{ij})$。</p>`,
    proofs: [{
      name: '逐个元素', deps: ['mat_add', 'mat_cols'],
      body: R`<p>设 $1\le i\le m$，$1\le j\le n$，则</p>$$(aA+bB)_{ij}=(aA)_{ij}+(bB)_{ij}=aA_{ij}+bB_{ij}=a\,a_{ij}+b\,b_{ij}.$$<p>①② 就是逐列看这个式子。</p>`
    }]
  },
  rowcol_mult: {
    type: 'def', imp: 3, title: '行向量乘列向量', alias: ['(1×n)(n×1)'],
    deps: ['mat_def'],
    body: R`<p>设 $A=(a_1\ \cdots\ a_n)\in\mathbb{R}^{1\times n}$，$B=\begin{pmatrix}b_1\\ \vdots\\ b_n\end{pmatrix}\in\mathbb{R}^{n\times1}$（都是 $n$ 维），定义</p>
$$A\cdot B=AB=(a_1\ \cdots\ a_n)\begin{pmatrix}b_1\\ \vdots\\ b_n\end{pmatrix}=(a_1b_1+\cdots+a_nb_n)\in\mathbb{R}^{1\times1}.$$
<p>$(1\times n)\cdot(n\times1)=(1\times1)$。很快会知道，矩阵的乘法就是 $(m\times n)\cdot(n\times p)=(m\times p)$。条件：前一个矩阵的列数 $=$ 后一个矩阵的行数。</p>
<p><strong>例.</strong> $(1\ 2\ 3)\begin{pmatrix}4\\5\\6\end{pmatrix}=(4+10+18)=(32)$。</p>`
  },
  transpose_def: {
    type: 'def', imp: 3, title: '矩阵的转置', alias: ['transpose', 'A^T'],
    deps: ['mat_def'],
    body: R`<p>设 $A=(a_{ij})\in\mathbb{R}^{m\times n}$，定义</p>
$$A^T=\begin{pmatrix}a_{11}&\cdots&a_{m1}\\ \vdots&&\vdots\\ a_{1n}&\cdots&a_{mn}\end{pmatrix}\in\mathbb{R}^{n\times m},\qquad(A^T)_{ij}=A_{ji}=a_{ji}\quad(1\le i\le n,\ 1\le j\le m).$$
<p><strong>例.</strong> $(1\ 2\ 3)=\begin{pmatrix}1\\2\\3\end{pmatrix}^T$，$\begin{pmatrix}1\\2\\3\end{pmatrix}^T=(1\ 2\ 3)$。</p>`
  },
  rowcol_dot: {
    type: 'prop', imp: 3, title: '点乘与矩阵乘法：v·w = vᵀw', alias: [],
    body: R`<p>若 $A\in\mathbb{R}^{1\times n}$，$B\in\mathbb{R}^{n\times1}$，则 $AB=A^T\cdot B$（左边是矩阵乘法；右边 $A^T$、$B$ 都是列向量，$\cdot$ 是点乘）。</p>
<p>反之，若 $v,w\in\mathbb{R}^{n\times1}$，则 $v\cdot w=v^Tw$（左边点乘，右边是 $1\times n$ 乘 $n\times1$ 的矩阵乘法）。</p>
<p><strong>例.</strong> $(1\ 2\ 3)\begin{pmatrix}4\\5\\6\end{pmatrix}=\begin{pmatrix}1\\2\\3\end{pmatrix}\cdot\begin{pmatrix}4\\5\\6\end{pmatrix}$。</p>`,
    proofs: [{ name: '两边都是 Σ aᵢbᵢ（补全）', deps: ['rowcol_mult', 'transpose_def', 'dot_def'], body: R`<p>两边都等于 $a_1b_1+\cdots+a_nb_n$（把 $1\times1$ 矩阵和实数等同）。</p>` }]
  },
  transpose_props: {
    type: 'prop', imp: 2, title: '转置的性质', alias: [],
    body: R`<p>设 $A,B\in\mathbb{R}^{m\times n}$，$a,b\in\mathbb{R}$，则</p>
$$\begin{cases}(A^T)^T=A & ①\\ (A+B)^T=A^T+B^T & ②\\ (aA)^T=aA^T & ③\\ (aA+bB)^T=aA^T+bB^T & ④\end{cases}$$
<p><strong>注.</strong> 之后会知道 $(AB)^T=B^TA^T$，见 [[matmul_props]]。</p>`,
    proofs: [{
      name: '逐个元素', deps: ['transpose_def', 'mat_add'],
      body: R`<p>① 显然。④ 由 ②③ 可以得到。</p>
<p>② 设 $1\le i\le n$，$1\le j\le m$，则 $\big((A+B)^T\big)_{ij}=(A+B)_{ji}=A_{ji}+B_{ji}=(A^T)_{ij}+(B^T)_{ij}=(A^T+B^T)_{ij}$。</p>
<p>③ 设 $1\le i\le n$，$1\le j\le m$，则 $\big((aA)^T\big)_{ij}=(aA)_{ji}=aA_{ji}=a(A^T)_{ij}=(aA^T)_{ij}$。</p>`
    }]
  },
  matmul_def: {
    type: 'def', imp: 3, title: '矩阵的乘法', alias: ['matrix multiplication', 'AB'],
    deps: ['rowcol_mult'],
    body: R`<p>设 $A=(a_{ij})\in\mathbb{R}^{m\times n}$，$B=(b_{ij})\in\mathbb{R}^{n\times p}$，定义</p>$$AB=(a_{i1}b_{1j}+\cdots+a_{in}b_{nj})_{\substack{1\le i\le m\\1\le j\le p}}\in\mathbb{R}^{m\times p}.$$
<p>即对任意 $1\le i\le m$，$1\le j\le p$，</p>$$(AB)_{ij}=(A\ \text{的第}\ i\ \text{行})(B\ \text{的第}\ j\ \text{列})=a_{i1}b_{1j}+\cdots+a_{in}b_{nj}=\sum_{k=1}^na_{ik}b_{kj}.$$
<p>$A$ 有 $m$ 个（$n$ 维的）行向量，$B$ 有 $p$ 个（$n$ 维的）列向量，两两相乘排成 $m\times p$ 的表。</p>`
  },
  ex_matmul: {
    type: 'example', imp: 2, title: '例：计算一个 2×3 乘 3×4 的矩阵乘积', alias: [], attach: ['matmul_def'],
    body: R`$$\begin{pmatrix}1&2&3\\0&-1&2\end{pmatrix}\begin{pmatrix}-1&1&2&3\\0&1&-1&1\\2&0&1&-2\end{pmatrix}=\ ?$$`,
    sols: [{
      name: '行乘列', deps: ['matmul_def'],
      body: R`<p>$(2\times3)\cdot(3\times4)=(2\times4)$。第一行 $(1,2,3)$ 依次乘四列：$-1+0+6=5$，$1+2+0=3$，$2-2+3=3$，$3+2-6=-1$；第二行 $(0,-1,2)$：$0+0+4=4$，$0-1+0=-1$，$0+1+2=3$，$0-1-4=-5$。</p>$$=\begin{pmatrix}5&3&3&-1\\4&-1&3&-5\end{pmatrix}.$$`
    }]
  },
  ex_outer: {
    type: 'example', imp: 1, title: '例：列向量乘行向量得到方阵', alias: [], attach: ['matmul_def'],
    body: R`$$\begin{pmatrix}4\\5\\6\end{pmatrix}(1\ 2\ 3)=\ ?$$`,
    sols: [{ name: '行乘列', deps: ['matmul_def'], body: R`<p>$(3\times1)(1\times3)=(3\times3)$，得到一个方阵：</p>$$\begin{pmatrix}4&8&12\\5&10&15\\6&12&18\end{pmatrix}.$$` }]
  },
  matmul_props: {
    type: 'prop', imp: 3, title: '矩阵乘法的性质：结合律、不交换、转置反序', alias: ['结合律', '(AB)^T=B^TA^T'],
    body: R`<p>设 $A\in\mathbb{R}^{m\times n}$，$B\in\mathbb{R}^{n\times p}$，$C\in\mathbb{R}^{p\times q}$。</p>
$$\begin{cases}A(BC)=(AB)C & ①\\ \text{一般来说，}AB\ne BA & ②\\ (AB)^T=B^TA^T & ③\\ (ABC)^T=C^TB^TA^T & ④\\ (A_1\cdots A_k)^T=A_k^T\cdots A_1^T & ⑤\end{cases}$$`,
    proofs: [{
      name: '逐个元素', deps: ['matmul_def', 'transpose_def', 'shuxue-jichu:induction'],
      body: R`<p>① 要证明 $A(BC)=(AB)C$：两边都是 $m\times q$ 矩阵。设 $1\le i\le m$，$1\le j\le q$，则</p>
$$\big(A(BC)\big)_{ij}=\sum_{k=1}^nA_{ik}(BC)_{kj}=\sum_{k=1}^nA_{ik}\Big(\sum_{l=1}^pB_{kl}C_{lj}\Big)=\sum_{k=1}^n\sum_{l=1}^pA_{ik}B_{kl}C_{lj}.$$
$$\big((AB)C\big)_{ij}=\sum_{l=1}^p(AB)_{il}C_{lj}=\sum_{l=1}^p\Big(\sum_{k=1}^nA_{ik}B_{kl}\Big)C_{lj}=\sum_{l=1}^p\sum_{k=1}^nA_{ik}B_{kl}C_{lj}.$$<p>有限和可以交换求和顺序，两者相等。</p>
<p>② $(1\ 2\ 3)\begin{pmatrix}4\\5\\6\end{pmatrix}\ne\begin{pmatrix}4\\5\\6\end{pmatrix}(1\ 2\ 3)$：左边是 $1\times1$，右边是 $3\times3$。</p>
<p>③ 两边都是 $p\times m$ 矩阵。设 $1\le i\le p$，$1\le j\le m$，则</p>
$$\big((AB)^T\big)_{ij}=(AB)_{ji}=\sum_{k=1}^nA_{jk}B_{ki}=\sum_{k=1}^n(A^T)_{kj}(B^T)_{ik}=\sum_{k=1}^n(B^T)_{ik}(A^T)_{kj}=(B^TA^T)_{ij}.$$
<p>④ $(ABC)^T=\big(A(BC)\big)^T=(BC)^TA^T=C^TB^TA^T$。</p>
<p>⑤ 笔记不证；对 $k$ 归纳，同 ④ 的做法（补全）。</p>`
    }]
  },
  sym_def: {
    type: 'def', imp: 3, title: '对称矩阵', alias: ['symmetric matrix'],
    deps: ['transpose_def'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$。称 $A$ 是一个<strong>对称矩阵</strong> $\iff A=A^T$，即对于任意的 $1\le i,j\le n$，都有 $a_{ij}=a_{ji}$。</p>
<p><strong>例.</strong> $\begin{pmatrix}1&2\\3&4\end{pmatrix}$ 不是对称矩阵；而 $\begin{pmatrix}1&2\\2&3\end{pmatrix}$ 是对称矩阵；$\begin{pmatrix}1&4&-5\\4&7&0\\-5&0&-2\end{pmatrix}$ 是对称矩阵。</p>`
  },
  ata_sym: {
    type: 'prop', imp: 2, title: 'AᵀA 与 AAᵀ 一定是对称矩阵', alias: [],
    body: R`<p>设 $A\in\mathbb{R}^{m\times n}$，则 $A^TA$（$n\times n$）一定是对称矩阵，$AA^T$（$m\times m$）也一定是对称矩阵。</p>`,
    proofs: [{ name: '转置反序', deps: ['matmul_props', 'transpose_props', 'sym_def'], body: R`$$(A^TA)^T=A^T(A^T)^T=A^TA,\qquad(AA^T)^T=(A^T)^TA^T=AA^T.$$` }]
  },
  ex_abat: {
    type: 'example', imp: 1, title: '例：B 对称 ⇒ ABAᵀ 对称', alias: [], attach: ['matmul_props', 'sym_def'],
    body: R`<p>求 $(ABA^T)^T$。由此说明：如果 $B$ 是对称矩阵，那么 $ABA^T$ 也是对称矩阵。</p>`,
    sols: [{ name: '转置反序', deps: ['matmul_props', 'transpose_props'], body: R`$$(ABA^T)^T=(A^T)^TB^TA^T=AB^TA^T.$$<p>因此，如果 $B=B^T$，那么 $(ABA^T)^T=ABA^T$，$ABA^T$ 也是对称矩阵。</p>` }]
  },
  comp_matmul: {
    type: 'thm', imp: 3, title: '线性映射的复合对应矩阵的乘法', alias: ['f(x)=Bx', '复合与乘法'],
    body: R`<p>设 $f:\mathbb{R}^n\to\mathbb{R}^m$，$g:\mathbb{R}^m\to\mathbb{R}^p$ 是线性映射，设 $B$ 和 $A$ 分别是 $f,g$ 对应的矩阵。则</p>
<ul><li>对于任意列向量 $x\in\mathbb{R}^n$，$f(x)=Bx$；对于任意列向量 $y\in\mathbb{R}^m$，$g(y)=Ay$（右边都是矩阵乘法）；</li>
<li>线性映射 $g\circ f:\mathbb{R}^n\to\mathbb{R}^p$ 对应的矩阵就是 $AB$，即对于任意列向量 $x\in\mathbb{R}^n$，$(g\circ f)(x)=(AB)x$。</li></ul>
<p>这就是矩阵乘法要这样定义的原因。</p>`,
    proofs: [{
      name: '先证 f(x) = Bx，再用结合律', deps: ['linmap_matrix', 'matmul_def', 'matmul_props', 'linmap_comp'],
      body: R`<p>设 $f(e_1)=\begin{pmatrix}b_{11}\\ \vdots\\ b_{m1}\end{pmatrix},\ \dots,\ f(e_n)=\begin{pmatrix}b_{1n}\\ \vdots\\ b_{mn}\end{pmatrix}$，则 $f\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}=\begin{pmatrix}b_{11}x_1+\cdots+b_{1n}x_n\\ \vdots\\ b_{m1}x_1+\cdots+b_{mn}x_n\end{pmatrix}$。</p>
<p>设 $B=(b_{ij})$，$x=\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}$，则由矩阵乘法的定义</p>$$Bx=\begin{pmatrix}b_{11}x_1+\cdots+b_{1n}x_n\\ \vdots\\ b_{m1}x_1+\cdots+b_{mn}x_n\end{pmatrix}=f(x),$$<p>故 $f(x)=Bx$。同理 $g(y)=Ay$。</p>
<p>接下来，</p>$$(g\circ f)(x)=g(f(x))=g(Bx)=A(Bx)=(AB)x\quad(\text{矩阵乘法的结合律}).$$`
    }]
  },
  ex_comp_1n: {
    type: 'example', imp: 1, title: '例：行向量与列向量对应的映射的复合', alias: [], attach: ['comp_matmul'],
    body: R`<p>设 $A=(a_1\ \cdots\ a_n)\in\mathbb{R}^{1\times n}$，$B=\begin{pmatrix}b_1\\ \vdots\\ b_n\end{pmatrix}\in\mathbb{R}^{n\times1}$。设线性映射 $f:\mathbb{R}^n\to\mathbb{R}^1$ 与 $A$ 对应，$g:\mathbb{R}^1\to\mathbb{R}^n$ 与 $B$ 对应。验证 $f\circ g$ 对应 $AB$。</p>`,
    sols: [{
      name: '两边都算出来', deps: ['comp_matmul'],
      body: R`<p>此时 $AB=(a_1b_1+\cdots+a_nb_n)\in\mathbb{R}^{1\times1}$。设 $x\in\mathbb{R}^{1\times1}$，$(AB)x=(a_1b_1+\cdots+a_nb_n)x=a_1b_1x+\cdots+a_nb_nx$。</p>
<p>另一方面 $f\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}=(a_1\ \cdots\ a_n)\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}=a_1x_1+\cdots+a_nx_n$，$g(x)=\begin{pmatrix}b_1x\\ \vdots\\ b_nx\end{pmatrix}$，</p>$$(f\circ g)(x)=f(g(x))=f\begin{pmatrix}b_1x\\ \vdots\\ b_nx\end{pmatrix}=a_1b_1x+\cdots+a_nb_nx.$$`
    }]
  },
  trace_def: {
    type: 'def', imp: 3, title: '迹', alias: ['trace', 'tr'],
    deps: ['mat_def'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$，定义</p>$$\operatorname{tr}(A)=\sum_{i=1}^na_{ii}=a_{11}+\cdots+a_{nn},$$<p>称为 $A$ 的<strong>迹</strong>（对角线元素之和）。</p>
<p><strong>例.</strong> 设 $A=\begin{pmatrix}1&2&3\\4&5&6\\7&8&9\end{pmatrix}$，则 $\operatorname{tr}(A)=1+5+9=15$。</p>`
  },
  trace_props: {
    type: 'prop', imp: 3, title: '迹的性质：线性、tr(AB) = tr(BA)、轮换', alias: ['循环不变'],
    body: R`<p>设 $A,B,C\in\mathbb{R}^{n\times n}$，$k,l\in\mathbb{R}$，则</p>
$$\begin{cases}\operatorname{tr}(A+B)=\operatorname{tr}(A)+\operatorname{tr}(B) & ①\\ \operatorname{tr}(kA)=k\operatorname{tr}(A) & ②\\ \operatorname{tr}(kA+lB)=k\operatorname{tr}(A)+l\operatorname{tr}(B) & ③\\ \operatorname{tr}(AB)=\operatorname{tr}(BA) & ④\\ \operatorname{tr}(ABC)=\operatorname{tr}(BCA)=\operatorname{tr}(CAB) & ⑤\end{cases}$$
<p><strong>注（练习）.</strong> 一般 $\operatorname{tr}(AB)\ne\operatorname{tr}(A)\operatorname{tr}(B)$，$\operatorname{tr}(ABC)\ne\operatorname{tr}(ACB)$。</p>`,
    proofs: [{
      name: '交换求和顺序', deps: ['trace_def', 'matmul_def', 'matmul_props', 'mat_add'],
      body: R`<p>①②③ 由定义直接得到（补全：对角线元素逐个相加、相乘）。</p>
<p>④ 要证明 $\operatorname{tr}(AB)=\operatorname{tr}(BA)$。</p>$$\text{左}=\sum_{i=1}^n(AB)_{ii}=\sum_{i=1}^n\sum_{j=1}^nA_{ij}B_{ji}=\sum_{j=1}^n\sum_{i=1}^nB_{ji}A_{ij}=\sum_{j=1}^n(BA)_{jj}=\text{右}.$$
<p>⑤ $\operatorname{tr}(ABC)=\operatorname{tr}\big(A(BC)\big)\overset{④}{=}\operatorname{tr}\big((BC)A\big)=\operatorname{tr}(BCA)=\operatorname{tr}\big(B(CA)\big)\overset{④}{=}\operatorname{tr}(CAB)$。</p>`
    }]
  },
  trace_formula: {
    type: 'prop', imp: 1, title: '乘积的迹的展开式', alias: [],
    body: R`<p>设 $A,B,C\in\mathbb{R}^{n\times n}$，则</p>$$\operatorname{tr}(ABC)=\sum_{i=1}^n\sum_{j=1}^n\sum_{k=1}^na_{ij}b_{jk}c_{ki}=\sum_{i,j,k=1}^na_{ij}b_{jk}c_{ki}.$$
<p>更一般地，设 $A_1,\dots,A_m\in\mathbb{R}^{n\times n}$，则</p>$$\operatorname{tr}(A_1\cdots A_m)=\sum_{i_1,\dots,i_m=1}^n(A_1)_{i_1i_2}(A_2)_{i_2i_3}\cdots(A_m)_{i_mi_1}.$$`,
    proofs: [{
      name: '展开 + 归纳', deps: ['trace_def', 'matmul_def', 'shuxue-jichu:induction'],
      body: R`$$\operatorname{tr}\big(A(BC)\big)=\sum_{i=1}^n\big(A(BC)\big)_{ii}=\sum_{i=1}^n\sum_{j=1}^nA_{ij}(BC)_{ji}=\sum_{i=1}^n\sum_{j=1}^nA_{ij}\sum_{k=1}^nB_{jk}C_{ki}=\sum_{i,j,k=1}^nA_{ij}B_{jk}C_{ki}.$$<p>一般情形用数学归纳法：$(A_1\cdots A_m)_{i_1j}=\sum_{i_2,\dots,i_m}(A_1)_{i_1i_2}\cdots(A_m)_{i_mj}$（对 $m$ 归纳，每次用矩阵乘法的定义展开一层），再令 $j=i_1$ 并对 $i_1$ 求和（补全）。</p>`
    }]
  },

  /* ===== 第 5 章 行列式 ===== */
  det_def: {
    type: 'def', imp: 3, title: '行列式（按第一行展开）', alias: ['determinant', 'det', '|A|'],
    deps: ['mat_def'],
    body: R`<p>若 $A=(a)\in\mathbb{R}^{1\times1}$，定义 $\det(A)=a$。</p>
<p>若 $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}\in\mathbb{R}^{2\times2}$，定义 $\det(A)=ad-bc$。</p>
<p>设 $A=\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}$，定义</p>
$$\begin{aligned}\det(A)&=a\det\begin{pmatrix}e&f\\h&i\end{pmatrix}-b\det\begin{pmatrix}d&f\\g&i\end{pmatrix}+c\det\begin{pmatrix}d&e\\g&h\end{pmatrix}\\&=a(ei-fh)-b(di-fg)+c(dh-eg)=aei-afh-bdi+bfg+cdh-ceg.\end{aligned}$$
<p>一般地，设 $A=(a_{ij})\in\mathbb{R}^{n\times n}$（$n\ge2$），定义</p>
$$\det(A)=a_{11}\det\begin{pmatrix}a_{22}&\cdots&a_{2n}\\ \vdots&&\vdots\\ a_{n2}&\cdots&a_{nn}\end{pmatrix}-a_{12}\det\begin{pmatrix}a_{21}&a_{23}&\cdots&a_{2n}\\ \vdots&&&\vdots\\ a_{n1}&a_{n3}&\cdots&a_{nn}\end{pmatrix}+\cdots+(-1)^{n+1}a_{1n}\det\begin{pmatrix}a_{21}&\cdots&a_{2(n-1)}\\ \vdots&&\vdots\\ a_{n1}&\cdots&a_{n(n-1)}\end{pmatrix},$$
<p>第 $j$ 项是 $(-1)^{1+j}a_{1j}$ 乘以去掉第 $1$ 行、第 $j$ 列后剩下的 $(n-1)\times(n-1)$ 矩阵的行列式。</p>
<p><strong>例.</strong> $n=2$ 时，$\det(A)=a\det((d))-b\det((c))=ad-bc$，与上面一致。</p>
<p><strong>注.</strong> $\det(A)$ 可以记为 $|A|$。</p>`
  },
  det2_mult: {
    type: 'prop', imp: 2, title: '2×2 矩阵：det(AB) = det(A)det(B)', alias: [],
    body: R`<p>若 $A,B\in\mathbb{R}^{2\times2}$，则 $\det(AB)=\det(A)\det(B)$。</p>`,
    proofs: [{
      name: '直接展开', deps: ['det_def', 'matmul_def'],
      body: R`<p>设 $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$，$B=\begin{pmatrix}e&f\\g&h\end{pmatrix}$，则 $\det(A)=ad-bc$，$\det(B)=eh-fg$，$AB=\begin{pmatrix}ae+bg&af+bh\\ce+dg&cf+dh\end{pmatrix}$。</p>
$$\begin{aligned}\det(AB)&=(ae+bg)(cf+dh)-(af+bh)(ce+dg)\\&=\underbrace{aecf}_{\text{消}}+aedh+bgcf+\underbrace{bgdh}_{\text{消}}-\underbrace{afce}_{\text{消}}-afdg-bhce-\underbrace{bhdg}_{\text{消}}\\&=adeh-adfg-bceh+bcfg,\\ \det(A)\det(B)&=(ad-bc)(eh-fg)=adeh-adfg-bceh+bcfg.\end{aligned}$$`
    }]
  },
  ex_det4: {
    type: 'example', imp: 2, title: '例：计算 4×4 行列式', alias: [], attach: ['det_def'],
    body: R`<p>设 $A=\begin{pmatrix}1&0&2&-1\\0&-1&2&0\\3&1&0&-1\\4&-2&1&0\end{pmatrix}$，求 $\det(A)$。</p>`,
    sols: [{
      name: '按第一行展开', deps: ['det_def'],
      body: R`<p>第一行的第 $2$ 个元素是 $0$，只剩三项：</p>
$$\begin{aligned}\det(A)&=\det\begin{pmatrix}-1&2&0\\1&0&-1\\-2&1&0\end{pmatrix}+2\det\begin{pmatrix}0&-1&0\\3&1&-1\\4&-2&0\end{pmatrix}+\det\begin{pmatrix}0&-1&2\\3&1&0\\4&-2&1\end{pmatrix}\\&=(4-1)+2\cdot4+\big(-12-8-(-3)\big)=3+8-17=-6.\end{aligned}$$
<p>（第四项的系数是 $(-1)^{1+4}\cdot(-1)=+1$。）</p>`
    }, {
      name: '按第三列展开', deps: ['det_def'],
      body: R`<p>也可以选含 $0$ 多的行或列展开（按其他行、列展开的结果相同，本课不证）：</p>$$\det(A)=-\det\begin{pmatrix}1&2&-1\\3&0&-1\\4&1&0\end{pmatrix}-2\det\begin{pmatrix}1&0&-1\\3&1&-1\\4&-2&0\end{pmatrix}=\cdots=-6.$$<p>（笔记只写了结果；这里展开的是第 $2$ 列：$-(-1)\cdot$ 余子式 $\ldots$ 两种写法最后都是 $-6$。）</p>`
    }]
  },
  det_mult: {
    type: 'thm', imp: 3, title: 'det(AB) = det(A)det(B)', alias: ['行列式乘法公式'],
    deps: ['det_def', 'det2_mult'],
    body: R`<p>设 $A,B\in\mathbb{R}^{n\times n}$，则</p>$$\det(AB)=\det(A)\det(B).$$
<p>$n=2$ 的情形见 [[det2_mult]]。一般情形的证明需要行列式的完整理论（多重线性与交错性），本课不证。</p>`
  },
  det_rowops: {
    type: 'prop', imp: 3, title: '初等行变换对行列式的影响', alias: ['行列式的性质', '换行变号'],
    deps: ['det_def'],
    body: R`<p>探究行列式更快的求法：</p>
<ul><li>$\det\begin{pmatrix}1&2\\3&4\end{pmatrix}=1\cdot4-2\cdot3=-2$，而 $\det\begin{pmatrix}3&4\\1&2\end{pmatrix}=3\cdot2-4\cdot1=2$。<strong>规律：如果两行互换，则行列式变为相反数。</strong>（笔记这里算成了 $-2$，应为 $2$，正好体现了这条规律。）</li>
<li>$\begin{pmatrix}1&2\\3&4\end{pmatrix}\xrightarrow{R_2\to R_2-5R_1}\begin{pmatrix}1&2\\-2&-6\end{pmatrix}$，$\det=(-6)-(-4)=-2$。<strong>规律：如果 $R_i\to R_i+cR_j$（$j\ne i$），则行列式不变。</strong></li>
<li>$\begin{pmatrix}1&2\\3&4\end{pmatrix}\xrightarrow{R_1\to7R_1}\begin{pmatrix}7&14\\3&4\end{pmatrix}$，$\det=28-42=-14$。<strong>规律：如果 $R_i\to cR_i$（$c\ne0$），则行列式也扩大 $c$ 倍。</strong></li></ul>
<p>另外，上三角矩阵的行列式等于对角线元素的乘积（按第一列反复展开即得）。这三条规律对一般 $n$ 都成立，证明需要行列式的完整理论，本课不证（$n=2$ 时可以直接验证）。</p>`
  },
  ex_det3: {
    type: 'example', imp: 2, title: '例：用行变换计算 3×3 行列式', alias: [], attach: ['det_rowops'],
    body: R`<p>求 $\det\begin{pmatrix}1&2&3\\0&-1&2\\2&1&3\end{pmatrix}$。</p>`,
    sols: [{
      name: '化成上三角', deps: ['det_rowops'],
      body: R`$$\begin{aligned}\det\begin{pmatrix}1&2&3\\0&-1&2\\2&1&3\end{pmatrix}&\overset{R_3\to R_3-2R_1}{=\!=\!=}\det\begin{pmatrix}1&2&3\\0&-1&2\\0&-3&-3\end{pmatrix}\overset{R_2\to-R_2}{=\!=\!=}-\det\begin{pmatrix}1&2&3\\0&1&-2\\0&-3&-3\end{pmatrix}\\&\overset{R_3\to(-\frac13)R_3}{=\!=\!=}-(-3)\det\begin{pmatrix}1&2&3\\0&1&-2\\0&1&1\end{pmatrix}\overset{R_3\to R_3-R_2}{=\!=\!=}3\det\begin{pmatrix}1&2&3\\0&1&-2\\0&0&3\end{pmatrix}=3\cdot1\cdot1\cdot3=9.\end{aligned}$$`
    }]
  },
  det_kA: {
    type: 'prop', imp: 2, title: 'det(kA) = kⁿ det(A)', alias: [],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$，$k\in\mathbb{R}$，则 $\det(kA)=k^n\det(A)$。</p>`,
    proofs: [{
      name: '每一行都乘了 k', deps: ['det_rowops'],
      body: R`<p>设 $A=\begin{pmatrix}v_1\\ \vdots\\ v_n\end{pmatrix}$（按行），则 $kA=\begin{pmatrix}kv_1\\ \vdots\\ kv_n\end{pmatrix}$。每把一行乘以 $k$，行列式就乘以 $k$（$k=0$ 时两边都是 $0$：有一行全是 $0$ 的矩阵行列式为 $0$，按这一行展开即可），一共 $n$ 行，因此 $\det(kA)=k^n\det(A)$。</p>`
    }]
  },
  elem_mat: {
    type: 'prop', imp: 2, title: '初等行变换对应的矩阵', alias: ['初等矩阵', 'elementary matrix'],
    body: R`<p>设 $A=\begin{pmatrix}v_1\\ \vdots\\ v_m\end{pmatrix}\in\mathbb{R}^{m\times n}$。三种初等行变换都可以写成左乘一个矩阵：</p>
<ol class="plain"><li>① 把单位矩阵第 $i$ 个对角元换成 $c$：左乘它，第 $i$ 行变为 $cv_i$。例：$\begin{pmatrix}1&&\\&2&\\&&1\end{pmatrix}\begin{pmatrix}1&2&3\\4&5&6\\7&8&9\end{pmatrix}=\begin{pmatrix}1&2&3\\8&10&12\\7&8&9\end{pmatrix}$。</li>
<li>② 把单位矩阵的第 $i,j$ 行互换：左乘它，$v_i,v_j$ 互换。例：$\begin{pmatrix}1&&\\&&1\\&1&\end{pmatrix}\begin{pmatrix}1&2&3\\4&5&6\\7&8&9\end{pmatrix}=\begin{pmatrix}1&2&3\\7&8&9\\4&5&6\end{pmatrix}$。</li>
<li>③ 在单位矩阵的 $(i,j)$ 位置放 $c$：左乘它，第 $i$ 行变为 $v_i+cv_j$。例（$R_2\to R_2-2R_1$）：$\begin{pmatrix}1&&\\-2&1&\\&&1\end{pmatrix}\begin{pmatrix}1&2&3\\4&5&6\\7&8&9\end{pmatrix}=\begin{pmatrix}1&2&3\\2&1&0\\7&8&9\end{pmatrix}$。</li></ol>
<p>（空白处为 $0$。）一般用 $E_1,\dots,E_k$ 表示初等行变换对应的矩阵。</p>`,
    proofs: [{ name: '按矩阵乘法逐行计算（补全）', deps: ['matmul_def'], body: R`<p>左乘矩阵 $E$ 后，结果的第 $i$ 行 $=\sum_jE_{ij}v_j$。三种 $E$ 的第 $i$ 行分别只有 $c$ 在第 $i$ 位、$1$ 在第 $j$ 位、$1$ 在第 $i$ 位与 $c$ 在第 $j$ 位，其余行与单位矩阵相同，代入即得。</p>` }]
  },
  rref_product: {
    type: 'note', imp: 1, title: 'REF、RREF 都是 A 左乘初等矩阵', alias: [],
    deps: ['elem_mat'],
    body: R`$$A\rightsquigarrow\operatorname{REF}(A)\rightsquigarrow\operatorname{RREF}(A),$$$$\operatorname{REF}(A)=E_k\cdots E_1A,\qquad\operatorname{RREF}(A)=E_l\cdots E_k\cdots E_1A.$$<p>REF、RREF 的定义见第 7 章 [[rref_def]]。</p>`
  },

  /* ===== 第 6 章 线性代数基本定理 ===== */
  vecspace_note: {
    type: 'note', imp: 2, title: '线性空间与线性子空间（一般化）', alias: ['向量空间', 'vector space'],
    deps: ['subspace_def', 'linmap_ops'],
    body: R`<p>设 $V$ 是个<strong>线性空间</strong>（向量空间）：可以理解为 $\mathbb{R}^n$，或 $\mathbb{R}^n$ 的线性子空间，或 $\mathbb{R}^{m\times n}$，或 $\{$所有从 $\mathbb{R}^n$ 到 $\mathbb{R}^m$ 的线性映射$\}$——总之是可以做加法和标量乘法、并且满足通常运算律的集合。</p>
<p>设 $U\subset V$ 是 $V$ 的<strong>线性子空间</strong>：包含 $0$，对加法和标量乘法封闭。基、维数的概念与 $\mathbb{R}^n$ 中相同。</p>
<p>为举例方便，取 $V=\mathbb{R}^2$，$U$ 是 $\mathbb{R}^2$ 中过原点的一条直线。和 $U$ 平行的直线形如 $\begin{pmatrix}a\\0\end{pmatrix}+U$，这样的直线叫<strong>仿射空间</strong>；它的表示方法不唯一，例如 $\begin{pmatrix}a\\0\end{pmatrix}+U=\begin{pmatrix}b\\c\end{pmatrix}+U$，只要 $\begin{pmatrix}b\\c\end{pmatrix}$ 也在这条直线上。</p>`
  },
  affine_def: {
    type: 'def', imp: 3, title: '仿射空间 v + U', alias: ['陪集', 'coset', 'affine space'],
    deps: ['vecspace_note'],
    body: R`<p>设 $V$ 是线性空间，$U\subset V$ 是线性子空间，设 $v\in V$，则定义仿射空间</p>$$v+U=\{v+u:\ u\in U\}.$$`
  },
  coset_eq: {
    type: 'prop', imp: 3, title: '判别法则：v + U = v′ + U ⟺ v − v′ ∈ U', alias: [],
    body: R`<p>设 $V$ 是线性空间，$U\subset V$ 是线性子空间，设 $v,v'\in V$，则</p>$$v+U=v'+U\iff v-v'\in U.$$`,
    proofs: [{
      name: '两边互相包含', deps: ['affine_def', 'subspace_def'],
      body: R`<p>「$\Rightarrow$」设 $v+U=v'+U$，则 $v=v+0\in v+U=v'+U=\{v'+u:u\in U\}$。因此存在 $u\in U$，$v=v'+u$，故 $v-v'=u\in U$。</p>
<p>「$\Leftarrow$」设 $u_0=v-v'\in U$。</p>
<p>① 证 $v+U\subset v'+U$：设 $u\in U$，则 $v+u=v'+(v-v')+u=v'+\underbrace{(u_0+u)}_{\in U}\in v'+U$。</p>
<p>② 证 $v'+U\subset v+U$：由对称性，只需证明 $v'-v\in U$：$v'-v=-(v-v')=-u_0\in U$。</p>`
    }]
  },
  quotient_def: {
    type: 'def', imp: 3, title: '商空间 V/U', alias: ['quotient space'],
    deps: ['affine_def'],
    body: R`<p>设 $V$ 是线性空间，$U\subset V$ 是线性子空间，则定义 $V$ 对 $U$ 的商空间</p>$$V/U=\{v+U:\ v\in V\},$$<p>它的元素是一个个仿射空间（在 $V=\mathbb{R}^2$、$U$ 是直线的例子里，就是所有与 $U$ 平行的直线）。</p>`
  },
  quotient_ops: {
    type: 'prop', imp: 3, title: 'V/U 上的线性结构（良定义）', alias: ['商空间的加法', '良定义性'],
    body: R`<p>探究如何计算仿射空间的加法和标量乘法：希望定义</p>
$$\begin{cases}(v+U)+(w+U)=(v+w)+U & ①\\ a(v+U)=av+U & ②\end{cases}\qquad(v,w\in V,\ a\in\mathbb{R}).$$
<p>由于同一个仿射空间有不同的写法，需要验证结果不依赖于写法（良定义性）。验证之后，$V/U$ 就成为一个线性空间，零元是 $0+U=U$。</p>`,
    proofs: [{
      name: '验证良定义性', deps: ['coset_eq', 'shuxue-jichu:welldef'],
      body: R`<p>① 设 $v+U=v'+U$，$w+U=w'+U$，需要验证 $(v+w)+U=(v'+w')+U$。由判别法则 $v-v'\in U$，$w-w'\in U$，故</p>$$(v-v')+(w-w')=(v+w)-(v'+w')\in U.$$
<p>② 设 $v+U=v'+U$，需要验证 $av+U=av'+U$。$v-v'\in U$，故 $a(v-v')=av-av'\in U$。</p>`
    }]
  },
  ex_quotient: {
    type: 'example', imp: 2, title: '例：商空间的维数', alias: [], attach: ['quotient_ops'],
    body: R`<p>(1) $V=\mathbb{R}^2$，$U\subset V$ 是过原点的一条直线；(2) $V=\mathbb{R}^3$，$U$ 是过原点的平面；(3) $V=\mathbb{R}^3$，$U$ 是过原点的一条直线。$V/U$ 各是几维的？</p>`,
    sols: [{
      name: '画图', deps: ['quotient_ops'],
      body: R`<p>(1) $V$ 是 2 维的，$U$ 是 1 维的，$V/U$ 是 1 维的：设 $U$ 不是 $x$ 轴，则每条与 $U$ 平行的直线都和 $x$ 轴交于唯一一点 $(a,0)$，$\begin{pmatrix}a\\0\end{pmatrix}+U=a\Big(\begin{pmatrix}1\\0\end{pmatrix}+U\Big)$，所以 $\begin{pmatrix}1\\0\end{pmatrix}+U$ 构成了 $V/U$ 的一组基。</p>
<p>(2) $V$ 是 3 维的，$U$ 是 2 维的，$V/U$ 是 1 维的：$V/U$ 的元素是与 $U$ 平行的平面 $v+U$。</p>
<p>(3) $V$ 是 3 维的，$U$ 是 1 维的，$V/U$ 是 2 维的。</p>`
    }]
  },
  quotient_dim: {
    type: 'thm', imp: 3, title: 'dim(V/U) = dim V − dim U', alias: [],
    body: R`<p>设 $V$ 是 $n$ 维线性空间，$U\subset V$ 是 $m$ 维线性子空间，则</p>$$\dim(V/U)=\dim V-\dim U.$$`,
    proofs: [{
      name: '把 U 的基扩充成 V 的基', deps: ['quotient_ops', 'coset_eq', 'basis_def'],
      body: R`<p><strong>证明概要（笔记）.</strong> 设 $v_1,\dots,v_m$ 是 $U$ 的一组基，找到 $v_{m+1},\dots,v_n\in V$（笔记写成 $\in U$，应为 $\in V$），使得 $v_1,\dots,v_m,\dots,v_n$ 是 $V$ 的一组基。于是 $v_1+U,\dots,v_m+U$ 都等于 $U$（即 $V/U$ 的零元），而 $v_{m+1}+U,\dots,v_n+U$ 是 $V/U$ 的一组基。</p>
<p><strong>补全.</strong> 张成：任取 $v+U$，写 $v=a_1v_1+\cdots+a_nv_n$，则 $v+U=a_{m+1}(v_{m+1}+U)+\cdots+a_n(v_n+U)$（前 $m$ 项落在 $U$ 里）。线性无关：若 $a_{m+1}(v_{m+1}+U)+\cdots+a_n(v_n+U)=0+U$，则由判别法则 $a_{m+1}v_{m+1}+\cdots+a_nv_n\in U=\operatorname{span}(v_1,\dots,v_m)$，写成 $b_1v_1+\cdots+b_mv_m$ 后移项，由 $v_1,\dots,v_n$ 线性无关得 $a_{m+1}=\cdots=a_n=0$。所以 $\dim(V/U)=n-m$。</p>
<p>（「扩充成 $V$ 的基」这一步：只要 $\operatorname{span}(v_1,\dots,v_k)\ne V$，就取一个不在其中的向量添进去，由 [[indep_test]] 仍线性无关；由 [[basis_props]]，至多 $n$ 步就张成 $V$。）</p>`
    }]
  },
  ker_im_def: {
    type: 'def', imp: 3, title: '核与像', alias: ['kernel', 'image', 'ker', 'im', '零空间'],
    deps: ['img_preimg_sub', 'vecspace_note'],
    body: R`<p>设 $f:V\to W$ 是线性映射。定义</p>
$$\ker(f)=\{v\in V:\ f(v)=0\}=f^{-1}(\{0\})\subset V,\qquad \operatorname{im}(f)=\{f(v):\ v\in V\}\subset W.$$
<p>$\ker(f)$ 叫做 $f$ 的<strong>核</strong>（kernel，也叫零空间 null），$\operatorname{im}(f)$ 叫做 $f$ 的<strong>像</strong>（image，也叫像空间 range）。由 [[img_preimg_sub]]（$\{0\}$ 和 $V$ 都是子空间），它们分别是 $V$ 和 $W$ 的线性子空间。</p>`
  },
  fund_thm: {
    type: 'thm', imp: 3, title: '线性代数基本定理', alias: ['第一同构定理', 'dim ker + dim im = dim V', '维数公式'],
    body: R`<p>设 $f:V\to W$ 是线性映射，则 $V/\ker(f)$ 与 $\operatorname{im}(f)$ 之间存在一一对应（并且保持加法和标量乘法）：</p>$$\widetilde f:\ V/\ker(f)\ \xrightarrow{\ \sim\ }\ \operatorname{im}(f),\qquad v+\ker(f)\longmapsto f(v).$$
<p>因此 $\dim V-\dim(\ker f)=\dim(\operatorname{im}f)$，即</p>$$\dim(\ker f)+\dim(\operatorname{im}f)=\dim V.$$`,
    proofs: [{
      name: '构造 f̃ 并验证双射', deps: ['ker_im_def', 'coset_eq', 'quotient_ops', 'quotient_dim', 'linmap_props'],
      body: R`<p>设 $\widetilde f:V/\ker(f)\to\operatorname{im}(f)$，若 $v\in V$，定义 $\widetilde f(v+\ker(f))=f(v)$。</p>
<p><strong>良定义性.</strong> 设 $v+\ker(f)=v'+\ker(f)$，则 $v-v'\in\ker(f)$，即 $f(v-v')=f(v)-f(v')=0$，故 $f(v)=f(v')$。</p>
<p><strong>满射.</strong> 设 $y\in\operatorname{im}(f)$，则存在 $x\in V$，使得 $y=f(x)$，则 $\widetilde f(x+\ker(f))=f(x)=y$。</p>
<p><strong>单射.</strong> 设 $v,v'\in V$，使得 $\widetilde f(v+\ker(f))=\widetilde f(v'+\ker(f))$，即 $f(v)=f(v')$。要证明 $v+\ker(f)=v'+\ker(f)$：$f(v-v')=f(v)-f(v')=0$，$v-v'\in\ker(f)$，因此 $v+\ker(f)=v'+\ker(f)$。</p>
<p><strong>线性（补全）.</strong> $\widetilde f\big((v+\ker f)+(w+\ker f)\big)=\widetilde f\big((v+w)+\ker f\big)=f(v+w)=f(v)+f(w)$，数乘同理。一个保持运算的双射把一组基送到一组基，所以两边维数相同：$\dim(V/\ker f)=\dim(\operatorname{im}f)$。再由 $\dim(V/\ker f)=\dim V-\dim(\ker f)$ 即得。</p>`
    }]
  },
  ex_fund_proj: {
    type: 'example', imp: 1, title: '例：投影到直线上，检验基本定理', alias: [], attach: ['fund_thm'],
    body: R`<p>设 $f:\mathbb{R}^2\to\mathbb{R}^2$ 是一个把所有向量投影到某条过原点的直线 $l$ 的映射。检验 $\dim(\mathbb{R}^2)=\dim(\ker f)+\dim(\operatorname{im}f)$。</p>`,
    sols: [{ name: '画图', deps: ['fund_thm', 'proj_def'], body: R`<p>① $\dim(\mathbb{R}^2)=2$。② $\ker f$ 是过原点、与 $l$ 垂直的直线，$\dim(\ker f)=1$。③ $\operatorname{im}f=l$，$\dim(\operatorname{im}f)=1$。$2=1+1$。</p>` }]
  },

  /* ===== 第 7 章 线性方程组 ===== */
  ex_sys2: {
    type: 'example', imp: 2, title: '例：用增广矩阵解二元一次方程组', alias: ['增广矩阵', '消元'], attach: ['elem_mat'],
    body: R`<p>解 $\begin{cases}x+y=4 & ①\\ x-y=2 & ②\end{cases}$</p>`,
    sols: [{
      name: '消元 vs 增广矩阵', deps: ['elem_mat'],
      body: R`<p><strong>消元.</strong> ② $-$ ①：$-2y=-2$ ③；③ $\div(-2)$：$y=1$ ④；① $-$ ④：$x=3$ ⑤。所以 $x=3$，$y=1$。</p>
<p><strong>矩阵写法.</strong> $\begin{pmatrix}1&1\\1&-1\end{pmatrix}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}4\\2\end{pmatrix}$。对增广矩阵做同样的操作：</p>
$$\left(\begin{array}{cc|c}1&1&4\\1&-1&2\end{array}\right)\xrightarrow{R_2\to R_2-R_1}\left(\begin{array}{cc|c}1&1&4\\0&-2&-2\end{array}\right)\xrightarrow{R_2\to(-\frac12)R_2}\left(\begin{array}{cc|c}1&1&4\\0&1&1\end{array}\right)\xrightarrow{R_1\to R_1-R_2}\left(\begin{array}{cc|c}1&0&3\\0&1&1\end{array}\right),$$<p>$x=3$，$y=1$。</p>`
    }]
  },
  rref_def: {
    type: 'def', imp: 3, title: '行阶梯形 REF 与行最简形 RREF', alias: ['REF', 'RREF', '简化行阶梯形', '主元', '主变量', '自由变量', 'pivot'],
    deps: ['elem_mat'],
    body: R`<p>用初等行变换把矩阵化成「阶梯」：每一行第一个非零元（<strong>主元</strong>）都在上一行主元的右边，全零行在最下面——这叫<strong>行阶梯形</strong>（REF）。再把每个主元化成 $1$，并把主元所在列的其余元素都消成 $0$——这叫<strong>简化行阶梯形</strong>（行最简形，RREF）。</p>
<p>解方程组时，主元所在列对应的变量叫<strong>主变量</strong>，其余的叫<strong>自由变量</strong>。</p>`
  },
  ex_sys_rref: {
    type: 'example', imp: 3, title: '例：有无穷多解的方程组', alias: ['参数解'], attach: ['rref_def'],
    body: R`<p>解 $\begin{cases}2x-y+z=2\\ 4x+2y-z=5\end{cases}$</p>`,
    sols: [{
      name: '化成 RREF', deps: ['rref_def', 'affine_def'],
      body: R`$$\left(\begin{array}{ccc|c}2&-1&1&2\\4&2&-1&5\end{array}\right)\xrightarrow{R_2\to R_2-2R_1}\left(\begin{array}{ccc|c}2&-1&1&2\\0&4&-3&1\end{array}\right)\xrightarrow[R_2\to\frac14R_2]{R_1\to\frac12R_1}\left(\begin{array}{ccc|c}1&-\frac12&\frac12&1\\0&1&-\frac34&\frac14\end{array}\right)\xrightarrow{R_1\to R_1+\frac12R_2}\left(\begin{array}{ccc|c}1&0&\frac18&\frac98\\0&1&-\frac34&\frac14\end{array}\right).$$
<p>第二个矩阵是行阶梯形（REF），主元 $2,4$ 对应 $x,y$（主变量），$z$ 是自由变量；最后一个是行最简形（RREF）。</p>
<p>设 $z=t\in\mathbb{R}$：$\begin{cases}x+\frac18t=\frac98\\ y-\frac34t=\frac14\end{cases}$，即 $\begin{cases}x=\frac98-\frac18t\\ y=\frac14+\frac34t\\ z=t\end{cases}$</p>
$$\begin{pmatrix}x\\y\\z\end{pmatrix}=\begin{pmatrix}\frac98-\frac18t\\ \frac14+\frac34t\\ t\end{pmatrix}=\begin{pmatrix}\frac98\\ \frac14\\ 0\end{pmatrix}+t\begin{pmatrix}-\frac18\\ \frac34\\ 1\end{pmatrix},\qquad t\in\mathbb{R}.$$
<p><strong>注.</strong> 该方程组的解空间是一个仿射空间（一条不过原点的直线）。</p>`
    }]
  },
  axb_cols: {
    type: 'prop', imp: 3, title: 'Ax = b：用 A 的列做线性组合', alias: ['解方程组的原理'],
    body: R`<p>探究解方程组的原理。方程组</p>$$\begin{cases}a_{11}x_1+\cdots+a_{1n}x_n=b_1\\ \quad\vdots\\ a_{m1}x_1+\cdots+a_{mn}x_n=b_m\end{cases}$$
<p>（笔记最后一行写成 $b_n$，应为 $b_m$）。定义 $A=(a_{ij})\in\mathbb{R}^{m\times n}$，$x=\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}$，$b=\begin{pmatrix}b_1\\ \vdots\\ b_m\end{pmatrix}$，即求 $Ax=b$。设 $A$ 的列为 $v_1,\dots,v_n$，则</p>
$$Ax=(v_1\ \cdots\ v_n)\begin{pmatrix}x_1\\ \vdots\\ x_n\end{pmatrix}=x_1v_1+\cdots+x_nv_n=b.$$<p>所以解 $Ax=b$ 就是问：$b$ 能不能写成 $v_1,\dots,v_n$ 的线性组合，系数是什么。</p>`,
    proofs: [{ name: '矩阵乘法的定义', deps: ['matmul_def', 'lincomb_def'], body: R`<p>$Ax$ 的第 $i$ 个坐标是 $a_{i1}x_1+\cdots+a_{in}x_n$，正是 $x_1v_1+\cdots+x_nv_n$ 的第 $i$ 个坐标（补全）。</p>` }]
  },
  colrow_def: {
    type: 'def', imp: 3, title: '列空间与行空间', alias: ['col(A)', 'row(A)', 'column space', 'row space'],
    deps: ['axb_cols', 'span_def'],
    body: R`<p><strong>列空间.</strong> 设 $A=(v_1\ \cdots\ v_n)\in\mathbb{R}^{m\times n}$，定义</p>$$\operatorname{col}(A)=\operatorname{span}(v_1,\dots,v_n)=\{x_1v_1+\cdots+x_nv_n:\ x_1,\dots,x_n\in\mathbb{R}\}.$$<p><strong>注.</strong> 由 [[axb_cols]]，$\operatorname{col}(A)$ 就是使 $Ax=b$ 有解的 $b$ 的全体。（笔记写成「$Ax=b$ 的解空间」，不准确。）</p>
<p><strong>行空间.</strong> 设 $A=\begin{pmatrix}w_1\\ \vdots\\ w_m\end{pmatrix}\in\mathbb{R}^{m\times n}$，定义</p>$$\operatorname{row}(A)=\operatorname{span}(w_1,\dots,w_m)=\{x_1w_1+\cdots+x_mw_m:\ x_1,\dots,x_m\in\mathbb{R}\}.$$`
  },
  ex_colrow: {
    type: 'example', imp: 3, title: '例：求行空间与列空间的一组基', alias: [], attach: ['colrow_def'],
    body: R`<p>设 $A=\begin{pmatrix}2&-1&1\\4&2&-1\end{pmatrix}\in\mathbb{R}^{2\times3}$（笔记写成 $\mathbb{R}^{3\times2}$）。分别求出 $\operatorname{row}(A)$ 以及 $\operatorname{col}(A)$ 的一组基。</p>`,
    sols: [{
      name: '化成 RREF', deps: ['rref_def', 'colrow_def'],
      body: R`$$\begin{pmatrix}2&-1&1\\4&2&-1\end{pmatrix}\sim\begin{pmatrix}2&-1&1\\0&4&-3\end{pmatrix}\sim\begin{pmatrix}1&0&\frac18\\0&1&-\frac34\end{pmatrix}.$$
<p>行变换不改变行空间（每一步得到的行都是原来行的线性组合，反之亦然），所以</p>$$\operatorname{span}\big((2\ -1\ 1),(4\ 2\ -1)\big)=\operatorname{span}\big((1\ 0\ \tfrac18),(0\ 1\ -\tfrac34)\big),$$<p>因此 $(1\ 0\ \frac18)$，$(0\ 1\ -\frac34)$ 构成 $\operatorname{row}(A)$ 的一组基。</p>
<p>因为主元出现在第 1、2 列，所以 $A$ 的第 1、2 列 $\begin{pmatrix}2\\4\end{pmatrix}$，$\begin{pmatrix}-1\\2\end{pmatrix}$ 构成 $\operatorname{col}(A)$ 的一组基。（注意取的是<strong>原矩阵</strong>的列；行变换会改变列空间，但不改变列之间的线性关系。）</p>`
    }]
  },
  ex_dependent: {
    type: 'example', imp: 2, title: '例：判断一组向量线性相关', alias: [], attach: ['rref_def', 'indep_def'],
    body: R`<p>求证 $\begin{pmatrix}1\\0\\-1\\4\end{pmatrix},\ \begin{pmatrix}0\\2\\1\\1\end{pmatrix},\ \begin{pmatrix}2\\-2\\-3\\7\end{pmatrix}$ 是线性相关的。</p>`,
    sols: [{
      name: '排成矩阵化 RREF', deps: ['rref_def', 'axb_cols'],
      body: R`$$\begin{pmatrix}1&0&2\\0&2&-2\\-1&1&-3\\4&1&7\end{pmatrix}\xrightarrow[R_2\to\frac12R_2]{R_3\to R_3+R_1,\ R_4\to R_4-4R_1}\begin{pmatrix}1&0&2\\0&1&-1\\0&1&-1\\0&1&-1\end{pmatrix}\xrightarrow{R_3\to R_3-R_2,\ R_4\to R_4-R_2}\begin{pmatrix}1&0&2\\0&1&-1\\0&0&0\\0&0&0\end{pmatrix}.$$
<p>只有两个主元，第 3 列没有主元，所以 $Ax=0$ 有非零解（取 $x_3=1$ 得 $x_1=-2$，$x_2=1$）：第三个向量 $=2\times$ 第一个 $-$ 第二个。因此三个向量线性相关。（补全最后一步。）</p>`
    }]
  },
  rank_def: {
    type: 'def', imp: 3, title: '矩阵的秩', alias: ['rank', '秩'],
    deps: ['rref_def'],
    body: R`<p>设 $A\in\mathbb{R}^{m\times n}$，定义 $\operatorname{rank}(A)$ 为 $A$ 的行阶梯形或行最简形中的主元个数，称为 $A$ 的<strong>秩</strong>。</p>
<p><strong>注.</strong> $\dim(\operatorname{col}(A))=\operatorname{rank}(A)$：主元所在的列构成 $\operatorname{col}(A)$ 的一组基（见 [[ex_colrow]] 的做法）。</p>`
  },
  null_def: {
    type: 'def', imp: 3, title: '零空间与零化度', alias: ['null(A)', 'nullity', '零化度'],
    deps: ['axb_cols'],
    body: R`<p>设 $A\in\mathbb{R}^{m\times n}$，定义</p>$$\operatorname{null}(A)=\{x\in\mathbb{R}^n:\ Ax=0\}$$<p>（笔记写成 $\{Ax=0:x\in\mathbb{R}^n\}$），称为 $A$ 的<strong>零空间</strong>；定义 $\operatorname{nullity}(A)=\dim(\operatorname{null}(A))$，称为 $A$ 的<strong>零化度</strong>。</p>`
  },
  ex_null: {
    type: 'example', imp: 2, title: '例：求零空间的一组基', alias: [], attach: ['null_def'],
    body: R`<p>设 $A=\begin{pmatrix}1&0&2\\0&2&-2\\-1&1&-3\\4&1&7\end{pmatrix}$，求 $\operatorname{null}(A)$ 的一组基。</p>`,
    sols: [{
      name: '化成 RREF，自由变量设参数', deps: ['rref_def', 'null_def'],
      body: R`$$\begin{pmatrix}1&0&2\\0&2&-2\\-1&1&-3\\4&1&7\end{pmatrix}\xrightarrow{\text{RREF}}\begin{pmatrix}1&0&2\\0&1&-1\\0&0&0\\0&0&0\end{pmatrix}.$$
<p>求所有 $\begin{pmatrix}x\\y\\z\end{pmatrix}$ 使得上式乘它等于 $0$。设 $z=t\in\mathbb{R}$：$\begin{cases}x+2t=0\\ y-t=0\end{cases}$，$\begin{cases}x=-2t\\ y=t\\ z=t\end{cases}$</p>
$$\begin{pmatrix}x\\y\\z\end{pmatrix}=\begin{pmatrix}-2t\\t\\t\end{pmatrix}=t\begin{pmatrix}-2\\1\\1\end{pmatrix},\qquad t\in\mathbb{R}.$$<p>故 $\begin{pmatrix}-2\\1\\1\end{pmatrix}$ 构成 $\operatorname{null}(A)$ 的一组基。</p>`
    }]
  },
  null_dim: {
    type: 'prop', imp: 2, title: 'dim null(A) = 自由变量的个数', alias: [],
    body: R`$$\dim(\operatorname{null}(A))=\text{自由变量的个数}=A\ \text{的列数}-\operatorname{rank}(A).$$`,
    proofs: [{
      name: '每个自由变量给一个基向量（补全）', deps: ['ex_null', 'rank_def', 'null_def'],
      body: R`<p>行变换不改变 $Ax=0$ 的解集。在 RREF 中，每个主变量都能用自由变量表示，所以解由自由变量的取值唯一决定。令第 $k$ 个自由变量为 $1$、其余为 $0$，得到一个解 $s_k$；全体解就是 $s_k$ 的线性组合，并且 $s_k$ 在第 $k$ 个自由变量的位置为 $1$、在其他自由变量的位置为 $0$，所以线性无关。因此基向量个数 $=$ 自由变量个数 $=$ 列数 $-$ 主元个数。</p>`
    }]
  },
  rank_nullity: {
    type: 'thm', imp: 3, title: '秩–零化度定理', alias: ['rank-nullity', '秩零化度定理'],
    body: R`<p>设 $A\in\mathbb{R}^{m\times n}$，则</p>$$\operatorname{rank}(A)+\operatorname{nullity}(A)=n.$$`,
    proofs: [{ name: '由上面的注立刻得到', deps: ['null_dim'], body: R`<p>$\operatorname{nullity}(A)=\dim(\operatorname{null}(A))=n-\operatorname{rank}(A)$。</p>` }]
  },
  fund_matrix: {
    type: 'note', imp: 2, title: '复习：基本定理的矩阵版本就是秩–零化度定理', alias: [],
    deps: ['fund_thm', 'rank_nullity', 'comp_matmul', 'colrow_def'],
    body: R`<p>线性代数基本定理：若 $f:V\to W$ 是线性映射，则 $\dim(\ker f)+\dim(\operatorname{im}f)=\dim V$。</p>
<p>特别地，若 $V=\mathbb{R}^n$，$W=\mathbb{R}^m$，设矩阵 $A\in\mathbb{R}^{m\times n}$ 是与 $f$ 对应的矩阵，则</p>
$$\begin{aligned}\ker(f)&=\{x\in\mathbb{R}^n:\ f(x)=0\}=\{x\in\mathbb{R}^n:\ Ax=0\}=\operatorname{null}(A),\\ \operatorname{im}(f)&=\{f(x):\ x\in\mathbb{R}^n\}=\{Ax:\ x\in\mathbb{R}^n\}=\operatorname{col}(A),\\ \dim(V)&=n=A\ \text{的列数}.\end{aligned}$$
<p>于是基本定理就是 $\operatorname{nullity}(A)+\operatorname{rank}(A)=n$。</p>`
  },
  basis_props_pf: {
    type: 'prop', imp: 2, title: '用秩证明基的性质（m ≤ n、m ≥ n）', alias: [],
    body: R`<p>回到第 1 章的 [[basis_props]]：设 $x_1,\dots,x_m\in\mathbb{R}^n$，排成 $n\times m$ 矩阵 $A=(x_1\ \cdots\ x_m)$。</p>
<ol class="plain"><li>(3) 线性无关 $\Rightarrow m\le n$；</li><li>(2) 张成 $\mathbb{R}^n\Rightarrow m\ge n$；</li><li>(1) 是基 $\Rightarrow m=n$。</li></ol>`,
    proofs: [{
      name: '数主元（补全）', deps: ['rank_def', 'null_dim', 'axb_cols', 'colrow_def'],
      body: R`<p>主元个数 $\operatorname{rank}(A)$ 既不超过行数 $n$（每行至多一个主元），也不超过列数 $m$（每列至多一个主元）。</p>
<p>(3) 线性无关 $\iff Ax=0$ 只有零解 $\iff$ 没有自由变量 $\iff\operatorname{rank}(A)=m$。于是 $m=\operatorname{rank}(A)\le n$。</p>
<p>(2) 设 $x_1,\dots,x_m$ 张成 $\mathbb{R}^n$，即对任意 $b\in\mathbb{R}^n$，$Ax=b$ 都有解。假设 $\operatorname{rank}(A)<n$，则 $A$ 的 RREF $R$ 的最后一行全是 $0$。考虑增广矩阵 $(R\,|\,e_n)$：最后一行是 $(0\ \cdots\ 0\,|\,1)$，即方程 $0=1$，无解。初等行变换都可以反过来做，把 $(R\,|\,e_n)$ 逆向变回 $(A\,|\,b)$，得到某个 $b$；方程组 $Ax=b$ 与 $Rx=e_n$ 同解，所以也无解，矛盾。因此 $n=\operatorname{rank}(A)\le m$。</p>
<p>(1) 由 (2)(3) 得 $m=n$。</p>`
    }]
  },

  /* ===== 第 8 章 复数（复习） ===== */
  complex_review: {
    type: 'note', imp: 2, title: '复数速览', alias: ['复数', 'i', '共轭', '模长', '欧拉公式', '单位根'],
    deps: ['shuxue-jichu:c_def', 'shuxue-jichu:c_mul', 'shuxue-jichu:conj_def', 'shuxue-jichu:mod_def', 'shuxue-jichu:c_div', 'shuxue-jichu:polar_def', 'shuxue-jichu:euler', 'shuxue-jichu:roots_unity', 'shuxue-jichu:quad_c'],
    body: R`<p>求特征值时需要解多项式方程，会出现复数根。这部分与「数学基础」的复数一章内容相同，这里只列要点，详细定义与证明点进去看：</p>
<ul><li>$i=\sqrt{-1}$，$i^2=-1$；$\mathbb{C}=\{z=a+bi:\ a,b\in\mathbb{R}\}$，$\operatorname{Re}(z)=a$，$\operatorname{Im}(z)=b$。[[shuxue-jichu:c_def]]</li>
<li>乘法 $(a+bi)(c+di)=(ac-bd)+(ad+bc)i$；平方和公式 $(a+bi)(a-bi)=a^2+b^2$。[[shuxue-jichu:c_mul]]</li>
<li>共轭 $\overline z=a-bi$，$\overline{zw}=\overline z\,\overline w$。[[shuxue-jichu:conj_def]]</li>
<li>模长 $|z|=\sqrt{a^2+b^2}$，$z\overline z=|z|^2$，$|zw|=|z||w|$。[[shuxue-jichu:mod_def]]</li>
<li>倒数与除法：$\dfrac1{a+bi}=\dfrac{a-bi}{a^2+b^2}$，$\dfrac{a+bi}{c+di}=\dfrac{(ac+bd)+(bc-ad)i}{c^2+d^2}$。[[shuxue-jichu:c_div]]</li>
<li>极坐标 $z=r(\cos\theta+i\sin\theta)$，相乘时长度相乘、角度相加。[[shuxue-jichu:polar_def]]</li>
<li>欧拉公式 $e^{i\theta}=\cos\theta+i\sin\theta$，$e^{i\pi}+1=0$。[[shuxue-jichu:euler]]</li>
<li>$z^n=1$ 的解为 $z=e^{\frac{2k\pi i}n}$（$0\le k\le n-1$）。[[shuxue-jichu:roots_unity]]</li>
<li>实系数二次方程 $az^2+bz+c=0$：$b^2-4ac<0$ 时 $z=-\dfrac b{2a}\pm\dfrac{\sqrt{4ac-b^2}}{2a}i$，两复根互为共轭。[[shuxue-jichu:quad_c]]</li></ul>`
  },

  /* ===== 第 9 章 特征值与对角化 ===== */
  identity_def: {
    type: 'def', imp: 3, title: '单位矩阵（恒等矩阵）', alias: ['I', 'identity matrix'],
    deps: ['matmul_def'],
    body: R`$$I=\begin{pmatrix}1&&0\\&\ddots&\\0&&1\end{pmatrix}\in\mathbb{R}^{n\times n}.$$<p>若 $A\in\mathbb{R}^{n\times n}$，则 $IA=AI=A$。</p>`
  },
  diag_mult: {
    type: 'prop', imp: 2, title: '对角矩阵的乘法与乘方', alias: ['对角矩阵', 'diagonal matrix'],
    body: R`$$\begin{pmatrix}a_{11}&&0\\&\ddots&\\0&&a_{nn}\end{pmatrix}\begin{pmatrix}b_{11}&&0\\&\ddots&\\0&&b_{nn}\end{pmatrix}=\begin{pmatrix}a_{11}b_{11}&&0\\&\ddots&\\0&&a_{nn}b_{nn}\end{pmatrix},\qquad\begin{pmatrix}a_{11}&&0\\&\ddots&\\0&&a_{nn}\end{pmatrix}^k=\begin{pmatrix}a_{11}^k&&0\\&\ddots&\\0&&a_{nn}^k\end{pmatrix}.$$`,
    proofs: [{ name: '按定义（补全）', deps: ['matmul_def', 'shuxue-jichu:induction'], body: R`<p>$(AB)_{ij}=\sum_ka_{ik}b_{kj}$，只有 $k=i=j$ 的项可能非零，所以乘积仍是对角矩阵，对角元为 $a_{ii}b_{ii}$。乘方对 $k$ 归纳。</p>` }]
  },
  eig_def: {
    type: 'def', imp: 3, title: '特征值与特征向量', alias: ['eigenvalue', 'eigenvector', 'Av=λv'],
    deps: ['identity_def', 'complex_review'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$，$\lambda\in\mathbb{C}$。假设 $Av=\lambda v$ 存在非平凡解，即存在 $v\ne0$ 使得 $Av=\lambda v$，那么我们就说 $\lambda$ 是 $A$ 的一个<strong>特征值</strong>，而 $v$ 是与 $\lambda$ 对应的一个<strong>特征向量</strong>。</p>`
  },
  char_poly: {
    type: 'prop', imp: 3, title: '特征值是 det(A − λI) = 0 的根', alias: ['特征多项式', 'characteristic polynomial'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$，则 $\lambda$ 是 $A$ 的特征值 $\iff\det(A-\lambda I)=0$。左边是关于 $\lambda$ 的一个 $n$ 次多项式，叫做<strong>特征多项式</strong>。</p>`,
    proofs: [{
      name: '化成齐次方程组', deps: ['eig_def', 'inv_det'],
      body: R`<p>探究 $Av=\lambda v$：$Av=(\lambda I)v$，希望 $(A-\lambda I)v=0$ 存在非平凡解，即 $A-\lambda I$ 不可逆，即 $\det(A-\lambda I)=0$（[[inv_det]]）。</p>
<p>（补全：$(A-\lambda I)v=0$ 有非零解 $\iff$ 有自由变量 $\iff\operatorname{rank}<n\iff$ 不可逆。）</p>`
    }]
  },
  ex_eig2: {
    type: 'example', imp: 3, title: '例：求 2×2 矩阵的特征值与特征向量', alias: [], attach: ['char_poly'],
    body: R`<p>设 $A=\begin{pmatrix}6&-1\\2&3\end{pmatrix}$，求 $A$ 的特征值与特征向量。</p>`,
    sols: [{
      name: '解特征多项式，再解零空间', deps: ['char_poly', 'ex_null'],
      body: R`<p>求 $\det(A-\lambda I)=0$ 的解集。</p>$$\det(A-\lambda I)=\det\begin{pmatrix}6-\lambda&-1\\2&3-\lambda\end{pmatrix}=(\lambda-6)(\lambda-3)+2=\lambda^2-9\lambda+20=(\lambda-4)(\lambda-5).$$<p>因此 $\lambda_1=4$，$\lambda_2=5$。</p>
<p>① 当 $\lambda_1=4$ 时，$A-\lambda_1I=\begin{pmatrix}2&-1\\2&-1\end{pmatrix}\sim\begin{pmatrix}2&-1\\0&0\end{pmatrix}$。设 $v_1=\begin{pmatrix}1\\2\end{pmatrix}$，则 $Av_1=\lambda_1v_1$，$v_1$ 是 $\lambda_1$ 对应的一个特征向量。</p>
<p>② 当 $\lambda_2=5$ 时，$A-\lambda_2I=\begin{pmatrix}1&-1\\2&-2\end{pmatrix}\sim\begin{pmatrix}1&-1\\0&0\end{pmatrix}$。设 $v_2=\begin{pmatrix}1\\1\end{pmatrix}$，则 $Av_2=\lambda_2v_2$。</p>
<p><strong>检验.</strong> $Av_1=\begin{pmatrix}6&-1\\2&3\end{pmatrix}\begin{pmatrix}1\\2\end{pmatrix}=\begin{pmatrix}4\\8\end{pmatrix}=4\begin{pmatrix}1\\2\end{pmatrix}$，$Av_2=\begin{pmatrix}5\\5\end{pmatrix}=5\begin{pmatrix}1\\1\end{pmatrix}$。</p>`
    }]
  },
  inverse_def: {
    type: 'def', imp: 3, title: '矩阵的逆', alias: ['逆矩阵', '可逆矩阵', 'A^{-1}', 'inverse'],
    deps: ['identity_def'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$。若存在 $B\in\mathbb{R}^{n\times n}$，使得 $AB=BA=I$，则称 $B$ 是 $A$ 的逆，记作 $B=A^{-1}$；称 $A$ 是<strong>可逆矩阵</strong>。</p>`
  },
  inv_det: {
    type: 'thm', imp: 3, title: 'A 可逆 ⟺ det(A) ≠ 0', alias: [],
    deps: ['inverse_def', 'det_mult'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$，则 $A$ 可逆 $\iff\det(A)\ne0$。</p>
<p>「$\Rightarrow$」可以直接看出：$1=\det(I)=\det(AA^{-1})=\det(A)\det(A^{-1})$，所以 $\det(A)\ne0$。「$\Leftarrow$」需要行列式的完整理论，本课不证；$2\times2$ 的情形见 [[inv_2x2]]，那里直接写出了逆矩阵。</p>`
  },
  inv_2x2: {
    type: 'prop', imp: 3, title: '2×2 矩阵的逆', alias: [],
    body: R`<p>设 $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}\in\mathbb{R}^{2\times2}$，设 $\det(A)=ad-bc\ne0$，则</p>$$A^{-1}=\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}.$$`,
    proofs: [{
      name: '直接检验', deps: ['inverse_def', 'matmul_def'],
      body: R`$$\begin{pmatrix}a&b\\c&d\end{pmatrix}\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}=\frac1{ad-bc}\begin{pmatrix}ad-bc&0\\0&ad-bc\end{pmatrix}=\begin{pmatrix}1&0\\0&1\end{pmatrix},$$$$\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}\begin{pmatrix}a&b\\c&d\end{pmatrix}=\frac1{ad-bc}\begin{pmatrix}ad-bc&0\\0&ad-bc\end{pmatrix}=\begin{pmatrix}1&0\\0&1\end{pmatrix}.$$`
    }]
  },
  inv_method: {
    type: 'method', imp: 3, title: '求矩阵的逆：(A | I) ~ (I | A⁻¹)', alias: ['高斯-约当', '增广求逆'],
    deps: ['inverse_def', 'rref_product'],
    body: R`<p>把 $A$ 和 $I$ 并排写成 $(A\,|\,I)$，对它做初等行变换，把左半边化成 $I$，右半边就是 $A^{-1}$：</p>$$(A\,|\,I)\sim(I\,|\,A^{-1}).$$
<p>原因（补全）：若 $E_k\cdots E_1A=I$，则 $E_k\cdots E_1=A^{-1}$，而右半边正是 $E_k\cdots E_1I=E_k\cdots E_1$。（严格说还要验证 $A(E_k\cdots E_1)=I$，本课略。）</p>`
  },
  ex_inv2: {
    type: 'example', imp: 2, title: '例：求 (1 2; 3 4) 的逆', alias: [], attach: ['inv_method'],
    body: R`<p>求 $\begin{pmatrix}1&2\\3&4\end{pmatrix}^{-1}$。</p>`,
    sols: [{
      name: '(A | I) ~ (I | A⁻¹)', deps: ['inv_method', 'inv_2x2'],
      body: R`$$\left(\begin{array}{cc|cc}1&2&1&0\\3&4&0&1\end{array}\right)\sim\left(\begin{array}{cc|cc}1&2&1&0\\0&-2&-3&1\end{array}\right)\sim\left(\begin{array}{cc|cc}1&2&1&0\\0&1&\frac32&-\frac12\end{array}\right)\sim\left(\begin{array}{cc|cc}1&0&-2&1\\0&1&\frac32&-\frac12\end{array}\right).$$
<p>因此 $\begin{pmatrix}1&2\\3&4\end{pmatrix}^{-1}=\begin{pmatrix}-2&1\\ \frac32&-\frac12\end{pmatrix}$。</p>
<p><strong>检验.</strong> $\begin{pmatrix}1&2\\3&4\end{pmatrix}^{-1}=\dfrac1{-2}\begin{pmatrix}4&-2\\-3&1\end{pmatrix}=\begin{pmatrix}-2&1\\ \frac32&-\frac12\end{pmatrix}$ ✓。</p>`
    }]
  },
  diagonalizable_def: {
    type: 'def', imp: 3, title: '可对角化矩阵', alias: ['对角化', 'A=PDP⁻¹', 'diagonalizable'],
    deps: ['inverse_def', 'diag_mult'],
    body: R`<p>设 $A\in\mathbb{R}^{n\times n}$。若存在对角矩阵 $D$ 与可逆矩阵 $P$，使得 $A=PDP^{-1}$，则称 $A$ 是<strong>可对角化矩阵</strong>。</p>
<p>做法：若 $v_1,\dots,v_n$ 分别是特征值 $\lambda_1,\dots,\lambda_n$ 对应的特征向量，令 $P=(v_1\ \cdots\ v_n)$，$D=\begin{pmatrix}\lambda_1&&\\&\ddots&\\&&\lambda_n\end{pmatrix}$，则</p>
$$AP=(Av_1\ \cdots\ Av_n)=(\lambda_1v_1\ \cdots\ \lambda_nv_n),\qquad PD=(v_1\ \cdots\ v_n)\begin{pmatrix}\lambda_1&&\\&\ddots&\\&&\lambda_n\end{pmatrix}=(\lambda_1v_1\ \cdots\ \lambda_nv_n),$$<p>因此 $AP=PD$。若 $P$ 可逆（即特征向量线性无关），两边右乘 $P^{-1}$ 得 $A=PDP^{-1}$。</p>`
  },
  diag_power: {
    type: 'prop', imp: 3, title: 'A = PDP⁻¹ ⇒ Aᵏ = PDᵏP⁻¹', alias: [],
    body: R`<p>若 $A=PDP^{-1}$，$D$ 对角，$P$ 可逆，则 $A^k=PD^kP^{-1}$。</p>`,
    proofs: [{
      name: '中间的 P⁻¹P 相消', deps: ['diagonalizable_def', 'matmul_props', 'shuxue-jichu:induction'],
      body: R`$$A^2=PD\underbrace{P^{-1}P}_{=I}DP^{-1}=PD^2P^{-1},\qquad A^3=A^2A=PD^2\underbrace{P^{-1}P}_{=I}DP^{-1}=PD^3P^{-1},$$<p>……由归纳法 $A^k=PD^kP^{-1}=P\begin{pmatrix}\lambda_1^k&&\\&\ddots&\\&&\lambda_n^k\end{pmatrix}P^{-1}$。</p>`
    }]
  },
  ex_power100: {
    type: 'example', imp: 3, title: '例：计算 (6 −1; 2 3)¹⁰⁰', alias: ['矩阵的高次幂'], attach: ['diag_power'],
    body: R`<p>求 $\begin{pmatrix}6&-1\\2&3\end{pmatrix}^{100}$。</p>`,
    sols: [{
      name: '对角化', deps: ['ex_eig2', 'diag_power', 'inv_2x2'],
      body: R`<p>由前面的例子，$\lambda_1=4$，$\lambda_2=5$，$v_1=\begin{pmatrix}1\\2\end{pmatrix}$，$v_2=\begin{pmatrix}1\\1\end{pmatrix}$。设 $P=(v_1\ v_2)=\begin{pmatrix}1&1\\2&1\end{pmatrix}$，$D=\begin{pmatrix}4&0\\0&5\end{pmatrix}$，则 $AP=PD$。</p>
<p>$P^{-1}=\dfrac1{-1}\begin{pmatrix}1&-1\\-2&1\end{pmatrix}=\begin{pmatrix}-1&1\\2&-1\end{pmatrix}$。于是 $A=PDP^{-1}$，$A^{100}=PD^{100}P^{-1}$，因此</p>
$$\begin{pmatrix}6&-1\\2&3\end{pmatrix}^{100}=\begin{pmatrix}1&1\\2&1\end{pmatrix}\begin{pmatrix}4^{100}&0\\0&5^{100}\end{pmatrix}\begin{pmatrix}-1&1\\2&-1\end{pmatrix}=\begin{pmatrix}2\cdot5^{100}-4^{100}&4^{100}-5^{100}\\2\cdot5^{100}-2\cdot4^{100}&2\cdot4^{100}-5^{100}\end{pmatrix}.$$<p>（最后一步乘开是补全的。）</p>`
    }]
  },
  ex_diag3: {
    type: 'example', imp: 3, title: '例：对角化一个 3×3 矩阵', alias: [], attach: ['diagonalizable_def', 'inv_method'],
    body: R`<p>设 $A=\begin{pmatrix}1&2&0\\2&1&0\\0&0&-3\end{pmatrix}$，对角化 $A$。</p>`,
    sols: [{
      name: '特征值 → 特征向量 → P⁻¹', deps: ['char_poly', 'ex_null', 'inv_method'],
      body: R`$$\det(A-\lambda I)=\det\begin{pmatrix}1-\lambda&2&0\\2&1-\lambda&0\\0&0&-3-\lambda\end{pmatrix}=(-3-\lambda)\det\begin{pmatrix}1-\lambda&2\\2&1-\lambda\end{pmatrix}=-(\lambda+3)\big((\lambda-1)^2-4\big)=0,$$<p>即 $(\lambda+3)(\lambda^2-2\lambda-3)=0$，$\lambda_1=-3$，$\lambda_2=3$，$\lambda_3=-1$。</p>
<p>① $A-\lambda_1I=\begin{pmatrix}4&2&0\\2&4&0\\0&0&0\end{pmatrix}\sim\begin{pmatrix}1&0&0\\0&1&0\\0&0&0\end{pmatrix}$，设 $v_1=\begin{pmatrix}0\\0\\1\end{pmatrix}$，则 $Av_1=\lambda_1v_1$。</p>
<p>② $A-\lambda_2I=\begin{pmatrix}-2&2&0\\2&-2&0\\0&0&-6\end{pmatrix}\sim\begin{pmatrix}1&-1&0\\0&0&1\\0&0&0\end{pmatrix}$，设 $v_2=\begin{pmatrix}1\\1\\0\end{pmatrix}$，则 $Av_2=\lambda_2v_2$。</p>
<p>③ $A-\lambda_3I=\begin{pmatrix}2&2&0\\2&2&0\\0&0&-2\end{pmatrix}\sim\begin{pmatrix}1&1&0\\0&0&1\\0&0&0\end{pmatrix}$，设 $v_3=\begin{pmatrix}1\\-1\\0\end{pmatrix}$，则 $Av_3=\lambda_3v_3$。</p>
<p>设 $P=(v_1\ v_2\ v_3)=\begin{pmatrix}0&1&1\\0&1&-1\\1&0&0\end{pmatrix}$，$D=\begin{pmatrix}-3&0&0\\0&3&0\\0&0&-1\end{pmatrix}$，于是 $A=PDP^{-1}$。下面求出 $P^{-1}$：</p>
$$(P\,|\,I)=\left(\begin{array}{ccc|ccc}0&1&1&1&0&0\\0&1&-1&0&1&0\\1&0&0&0&0&1\end{array}\right)\sim\left(\begin{array}{ccc|ccc}1&0&0&0&0&1\\0&1&-1&0&1&0\\0&1&1&1&0&0\end{array}\right)\sim\left(\begin{array}{ccc|ccc}1&0&0&0&0&1\\0&1&-1&0&1&0\\0&0&2&1&-1&0\end{array}\right)$$
$$\sim\left(\begin{array}{ccc|ccc}1&0&0&0&0&1\\0&1&-1&0&1&0\\0&0&1&\frac12&-\frac12&0\end{array}\right)\sim\left(\begin{array}{ccc|ccc}1&0&0&0&0&1\\0&1&0&\frac12&\frac12&0\\0&0&1&\frac12&-\frac12&0\end{array}\right).$$
<p>因此 $P^{-1}=\begin{pmatrix}0&0&1\\ \frac12&\frac12&0\\ \frac12&-\frac12&0\end{pmatrix}$。</p>`
    }]
  }
});

/* ---------- 章节关系图 ---------- */
const CH_EDGES = [['c1', 'c2'], ['c1', 'c3'], ['c3', 'c4'], ['c4', 'c5'], ['c4', 'c6'], ['c5', 'c7'], ['c6', 'c7'], ['c7', 'c9'], ['c8', 'c9']];
const CH_POS = { c1: [70, 18], c2: [150, 40], c3: [70, 62], c4: [70, 104], c5: [36, 146], c6: [110, 146], c7: [70, 186], c8: [160, 186], c9: [110, 220] };
