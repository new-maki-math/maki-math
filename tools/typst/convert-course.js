/* 把一门课的内容文件（旧写法）转成新写法，并整体编译检查。
   用法：node tools/typst/convert-course.js shuxue-jichu  → 输出 content/<课>/typst.json（源文 + 编译结果）和错误列表 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { toNew } = require('../../server/convert');
const { renderMany } = require('../../server/render');
const slug = process.argv[2];
const seed = fs.readFileSync(path.join(__dirname, '../../server/seed.js'), 'utf8');
const files = JSON.parse(new RegExp(`slug: '${slug}'[\\s\\S]*?files: (\\[[^\\]]*\\])`).exec(seed)[1].replace(/'/g, '"'));
const dir = path.join(__dirname, '../../content', slug);
const code = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') + '\n;({ B, N, CH_EDGES, CH_POS })';
const r = vm.runInNewContext(code, {}, { timeout: 5000 });
const fixes = fs.existsSync(path.join(dir, 'typst-fixes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'typst-fixes.json'), 'utf8')) : {};
const jobs = [];
for (const [id, n] of Object.entries(r.N)) {
  jobs.push([id, 'body', n.body]);
  (n.proofs || n.sols || []).forEach((p, i) => jobs.push([id, 'p' + i, p.body]));
  (n.variants || []).forEach((v, i) => jobs.push([id, 'v' + i, v.body]));
}
(async () => {
  const srcs = jobs.map(([id, w, h]) => fixes[`${id}/${w}`] ?? toNew(h));
  const t0 = Date.now();
  const out = await renderMany(srcs);
  const errs = [];
  const res = {};
  jobs.forEach(([id, w], k) => { res[`${id}/${w}`] = { src: srcs[k] }; out[k].errors.forEach(e => errs.push({ key: `${id}/${w}`, ...e })); });
  fs.writeFileSync(path.join(dir, 'typst.json'), JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(__dirname, `errors-${slug}.json`), JSON.stringify(errs, null, 1));
  console.log(`${jobs.length} 段，${Date.now() - t0}ms，错误 ${errs.length}`);
})();
