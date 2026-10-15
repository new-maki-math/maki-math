/* ---------- 小节简介（卡片未选中节点时显示） ---------- */
Object.assign(B.b1a, { desc: '命题是什么，以及「非、与、或」三个联结词的真值表。' });
Object.assign(B.b1b, { desc: '联结词满足的运算律。后面的等价变形基本都靠它们。' });
Object.assign(B.b1c, { desc: '蕴含的含义、蕴含律与逆否命题律，以及等价和三段论。' });
Object.assign(B.b1d, { desc: '直接证明、分类讨论，以及证明「或」和「当且仅当」的标准写法。' });
Object.assign(B.b1e, { desc: '五条把蕴含和「与、或」混在一起的等价式，手稿里标了三颗星。每条都有等价变形和推导两套证明。' });
Object.assign(B.b1f, { desc: '全称量词、存在量词，以及怎样证明这两类命题。' });

/* ---------- 章节关系（手稿第 1 页的结构图） ---------- */
const CH_EDGES = [['b1', 'b2'], ['b2', 'b3'], ['b2', 'b6'], ['b6', 'b7'], ['b3', 'b4'], ['b4', 'b5'], ['b5', 'b8'], ['b5', 'b9']];
const CH_POS = { b1: [100, 18], b2: [100, 56], b3: [62, 96], b6: [146, 96], b4: [62, 136], b7: [146, 136], b5: [62, 176], b8: [36, 214], b9: [88, 214] };

/* ---------- 课程目录 ---------- */
const CATS = [
  { name: '逻辑与基础', courses: [{ id: 'root', title: '数学基础', desc: '高中到大学的衔接：命题、集合、映射、实数、复数、组合与初等数论。', live: true }] },
  { name: '代数', courses: [
    { title: '非数学系线性代数', desc: '只在 ℝ 和 ℂ 上讨论，以「数学基础」为前置课。', live: false },
    { title: '数学系线性代数', desc: '一般域 F 上的线性代数，可以引用非数学系版的节点。', live: false }] },
  { name: '分析', courses: [] },
  { name: '几何与拓扑', courses: [] }
];

/* ---------- 讲义推荐（公开路线需审核后才出现） ---------- */
const ROUTES = [
  { title: '命题逻辑速通', author: 'Maki', teacher: true, desc: '一节课讲完命题逻辑最常用的结论，适合开学第一周。',
    items: ['prop', 'not', 'and', 'or', 'imp', 'implaw', 'contrapos', 'demorgan', 'syllog'] },
  { title: '证明方法入门', author: '示例用户', teacher: false, desc: '只看「怎么证」：每种方法配一道例题。',
    items: ['m_imp', 'ex_x2', 'm_or', 'm_case', 'ex_or', 'm_iff', 'm_forall', 'ex_sq'] }
];
