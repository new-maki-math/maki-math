'use strict';
/* 新写法（Markdown + Typst）：渲染器的基本行为，以及已转换课程的全部公式都能编译 */
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { render, renderMany } = require('../server/render');

test('Markdown + Typst 渲染', async () => {
  const r = await render('**粗** *斜* $x^2 + 1/2$\n\n$$ sum_(k=1)^n k = (n(n+1))/2 $$\n\n| $p$ | $q$ |\n| --- | --- |\n| T | F |\n\n> **思路** 提示框\n\n-# 小字');
  assert.deepEqual(r.errors, []);
  assert.match(r.html, /<strong>粗<\/strong>/);
  assert.match(r.html, /<math display="block">/);
  assert.match(r.html, /<td class="vt">T<\/td>/);
  assert.match(r.html, /<div class="tip">/);
  assert.match(r.html, /<p class="small">小字<\/p>/);
});
test('LaTeX 命令和 # 代码被拒绝', async () => {
  const r = await render('$\\frac{1}{2}$ 和 $#read("/etc/passwd")$ 和 $ab$');
  assert.equal(r.errors.length, 3);
  assert.match(r.errors[0].msg, /LaTeX/);
});
test('已转换课程的全部内容都能编译', async () => {
  const dir = path.join(__dirname, '..', 'content');
  for (const c of fs.readdirSync(dir)) {
    const f = path.join(dir, c, 'typst.json');
    if (!fs.existsSync(f)) continue;
    const src = Object.values(JSON.parse(fs.readFileSync(f, 'utf8'))).map(x => x.src);
    const out = await renderMany(src);
    const bad = out.flatMap(o => o.errors);
    assert.equal(bad.length, 0, `${c}：${bad.slice(0, 5).map(e => e.formula + ' → ' + e.msg).join('；')}`);
  }
});
