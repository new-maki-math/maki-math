/* 第 1 章后半：手稿第 24–29 页 */
B.b1f.kids.push('q_vs_conn', 'qdemorgan', 'ex_nat1', 'ex_nat2', 'ex_dense');
B.b1g = { title: '反证法', ordered: true, desc: '假设结论不成立，推出一个假命题。经典例子是 √2 不是有理数。', kids: ['m_contra', 'ex_sqrt2'] };
B.b1h = { title: '量词的运算律', ordered: false, desc: '量词和「与、或、蕴含」怎样交换次序。', kids: ['qdist_and', 'qdist_or', 'qimp_r', 'qimp_l'] };
B.b1.kids.push('b1h');

Object.assign(N, {
  q_vs_conn: { type: 'note', imp: 1, title: '量词与联结词的类比', alias: ['∀ 与 ∧', '∃ 与 ∨'], deps: ['forall', 'exists', 'and', 'or'],
    body: R`<p>$\forall$ 是「全都成立」，对应 $\wedge$（两者都成立）；$\exists$ 是「一堆东西里至少一个成立」，对应 $\vee$（两者至少一个成立）。下一条 De Morgan 律就是这个类比的体现。</p>` },

  qdemorgan: { type: 'thm', imp: 3, title: '量词的 De Morgan 律', alias: ['量词否定', '¬∀', '¬∃', 'de morgan'],
    body: R`$$\neg\big(\forall x\in A,\ p(x)\big)\Leftrightarrow\exists x\in A,\ \neg p(x)$$$$\neg\big(\exists x\in A,\ p(x)\big)\Leftrightarrow\forall x\in A,\ \neg p(x)$$`,
    proofs: [{ name: '按定义', deps: ['forall', 'exists', 'not'],
      body: R`<p>第一式：「并非所有 $x$ 都满足 $p$」恰好是说「至少有一个 $x$ 不满足 $p$」。第二式：「不存在满足 $p$ 的 $x$」恰好是说「每个 $x$ 都不满足 $p$」。</p>` }] },

  ex_nat1: { type: 'example', imp: 2, title: '例：∀x∈ℕ, ∃y∈ℕ, y > x', alias: ['证明或证伪'], attach: ['m_forall', 'm_exists'],
    body: R`<p>证明或证伪：$\forall x\in\mathbb{N},\ \exists y\in\mathbb{N},\ y>x$。</p>`,
    sols: [{ name: '构造', deps: ['m_forall', 'm_exists', 'notation'],
      body: R`<p>成立。设 $x\in\mathbb{N}$，要证 $\exists y\in\mathbb{N},\ y>x$。令 $y_0=x+1\in\mathbb{N}$，则 $y_0=x+1>x$。</p>` }] },

  ex_nat2: { type: 'example', imp: 2, title: '例：∀x∈ℕ, ∃y∈ℕ, y < x', alias: ['证伪', '否定命题'], attach: ['qdemorgan', 'm_exists'],
    body: R`<p>证明或证伪：$\forall x\in\mathbb{N},\ \exists y\in\mathbb{N},\ y<x$。</p>`,
    sols: [{ name: '证明否命题', deps: ['qdemorgan', 'm_exists', 'm_forall', 'notation'],
      body: R`<p>不成立。要证明原命题的否定，由 [[qdemorgan]]，只需证明 $\exists x\in\mathbb{N},\ \forall y\in\mathbb{N},\ y\geq x$。</p><p>令 $x_0=0\in\mathbb{N}$。设 $y\in\mathbb{N}$，则 $y\geq 0=x_0$。</p>` }] },

  ex_dense: { type: 'example', imp: 2, title: '例：两个实数之间还有实数', alias: ['中点', '稠密'], attach: ['m_forall', 'm_exists', 'm_imp'],
    body: R`<p>证明或证伪：</p>$$\forall x,y\in\mathbb{R},\ \Big((x<y)\Rightarrow\big(\exists z\in\mathbb{R},\ x<z<y\big)\Big)$$`,
    sols: [{ name: '取中点', deps: ['m_forall', 'm_imp', 'm_exists', 'notation'],
      body: R`<p>成立。设 $x,y\in\mathbb{R}$，假设 $x<y$。令 $z_0=\dfrac{x+y}{2}\in\mathbb{R}$，则</p>$$x=\frac{x+x}{2}<\frac{x+y}{2}<\frac{y+y}{2}=y.$$` }] },

  m_contra: { type: 'method', imp: 3, title: '反证法', alias: ['proof by contradiction', '归谬'], deps: ['imp', 'not'],
    body: R`$$\big((\neg p)\Rightarrow\mathrm{F}\big)\Rightarrow p$$<p>目的：证明 $p$ 成立。方法：假设 $p$ 不成立，推出一个假命题。</p>`,
    proofs: [
      { name: '分类讨论', deps: ['m_case', 'm_imp'],
        body: R`<p>假设 $(\neg p)\Rightarrow\mathrm{F}$，要证 $p$。分类讨论：</p><p>① 若 $p$ 成立，结论已成立；</p><p>② 若 $p$ 不成立，则 $\neg p$，于是得到 $\mathrm{F}$，这不可能。</p>` },
      { name: '等价变形', deps: ['orimp'],
        body: R`$$\big((\neg p)\Rightarrow\mathrm{F}\big)\Leftrightarrow(p\vee\mathrm{F})\Leftrightarrow p$$<p>第一步用 [[orimp]]；第二步因为 $\mathrm{F}$ 不为真，$p\vee\mathrm{F}$ 的真假与 $p$ 相同。</p>` }] },

  ex_sqrt2: { type: 'example', imp: 3, title: '例：√2 不是有理数', alias: ['根号2', '无理数', 'sqrt 2'], attach: ['m_contra'],
    body: R`<p>证明 $\sqrt{2}\notin\mathbb{Q}$。</p>`,
    sols: [{ name: '反证法', deps: ['m_contra', 'notation'],
      body: R`<p>用反证法，假设 $\sqrt{2}\in\mathbb{Q}$。设 $\sqrt{2}=\dfrac{a}{b}$，其中 $a,b\in\mathbb{Z}$，$b\neq 0$，且 $\gcd(a,b)=1$。</p><p>于是 $2=\dfrac{a^2}{b^2}$，即 $a^2=2b^2$。这说明 $a^2$ 是偶数，故 $a$ 是偶数。设 $a=2c$，其中 $c\in\mathbb{Z}$，则 $(2c)^2=2b^2$，即 $b^2=2c^2$。同理可知 $b$ 也是偶数。</p><p>这与 $\gcd(a,b)=1$ 矛盾。因此 $\sqrt{2}\notin\mathbb{Q}$。</p><p class="small">这里用到「$a^2$ 是偶数 $\Rightarrow$ $a$ 是偶数」，它的严格证明在 P9 数论。</p>` }] },

  qdist_and: { type: 'thm', imp: 2, title: '∀ 对 ∧ 的分配律', alias: ['量词分配'],
    body: R`$$\forall x\in A,\ \big(p(x)\wedge q(x)\big)\ \Leftrightarrow\ \big(\forall x\in A,\ p(x)\big)\wedge\big(\forall x\in A,\ q(x)\big)$$`,
    proofs: [{ name: '推导', deps: ['m_iff', 'm_forall', 'm_and'],
      body: R`<p>「$\Rightarrow$」假设 $\forall x\in A,\ (p(x)\wedge q(x))$。由对称性，只需证明 $\forall x\in A,\ p(x)$：设 $x\in A$，于是 $p(x)\wedge q(x)$，则 $p(x)$。</p><p>「$\Leftarrow$」假设 $\forall x\in A,\ p(x)$ 且 $\forall x\in A,\ q(x)$。设 $x\in A$，要证 $p(x)\wedge q(x)$：由假设，$p(x)$ 与 $q(x)$ 都成立。</p>` }] },

  qdist_or: { type: 'thm', imp: 2, title: '∃ 对 ∨ 的分配律', alias: ['量词分配'],
    body: R`$$\exists x\in A,\ \big(p(x)\vee q(x)\big)\ \Leftrightarrow\ \big(\exists x\in A,\ p(x)\big)\vee\big(\exists x\in A,\ q(x)\big)$$`,
    proofs: [{ name: '推导（补充）', deps: ['m_iff', 'm_exists', 'm_case'],
      body: R`<p>「$\Rightarrow$」设 $x_0\in A$ 满足 $p(x_0)\vee q(x_0)$。不妨设 $p(x_0)$，则 $\exists x\in A,\ p(x)$，于是右边成立。</p><p>「$\Leftarrow$」不妨设 $\exists x\in A,\ p(x)$，取这样的 $x_0$，则 $p(x_0)\vee q(x_0)$，于是左边成立。</p><p class="small">手稿中这一条留作练习，这里的证明是补充的。</p>` }] },

  qimp_r: { type: 'thm', imp: 2, title: '∀ 移入蕴含的后件', alias: ['量词与蕴含'],
    body: R`$$\forall x\in A,\ \big(p\Rightarrow q(x)\big)\ \Leftrightarrow\ \Big(p\Rightarrow\big(\forall x\in A,\ q(x)\big)\Big)$$<p>其中 $p$ 不含 $x$。</p>`,
    proofs: [{ name: '推导', deps: ['m_iff', 'm_forall', 'm_imp'],
      body: R`<p>「$\Rightarrow$」设 $p$，再设 $x\in A$，要证 $q(x)$。由假设 $p\Rightarrow q(x)$，得 $q(x)$。</p><p>「$\Leftarrow$」设 $x\in A$，假设 $p$，要证 $q(x)$。由假设得 $\forall x\in A,\ q(x)$，所以 $q(x)$。</p>` }] },

  qimp_l: { type: 'thm', imp: 2, title: '∀ 移入蕴含的前件变成 ∃', alias: ['量词与蕴含'],
    body: R`$$\forall x\in A,\ \big(p(x)\Rightarrow q\big)\ \Leftrightarrow\ \Big(\big(\exists x\in A,\ p(x)\big)\Rightarrow q\Big)$$<p>其中 $q$ 不含 $x$。</p>`,
    proofs: [
      { name: '推导', deps: ['m_iff', 'm_forall', 'm_imp', 'm_exists'],
        body: R`<p>「$\Rightarrow$」设存在 $x_0\in A$ 满足 $p(x_0)$，要证 $q$。由假设有 $p(x_0)\Rightarrow q$，于是 $q$。</p><p>「$\Leftarrow$」设 $x\in A$，假设 $p(x)$，要证 $q$。此时 $\exists x\in A,\ p(x)$ 成立，于是 $q$。</p>` },
      { name: '等价变形', deps: ['contrapos', 'qimp_r', 'qdemorgan'],
        body: R`$$\begin{aligned}\text{左边}&\Leftrightarrow\forall x\in A,\ \big((\neg q)\Rightarrow(\neg p(x))\big)\\&\Leftrightarrow(\neg q)\Rightarrow\big(\forall x\in A,\ \neg p(x)\big)\\&\Leftrightarrow(\neg q)\Rightarrow\neg\big(\exists x\in A,\ p(x)\big)\Leftrightarrow\text{右边}\end{aligned}$$<p>依次用 [[contrapos]]、[[qimp_r]]、[[qdemorgan]]，最后再用一次逆否命题律。</p>` }] }
});
delete B.b1g.pending;
