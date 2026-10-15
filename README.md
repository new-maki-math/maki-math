# Maki 开源数学平台

[maki-math.com](https://maki-math.com) 的全部代码。

一门课被拆成一个个**节点**（定义、定理、证明、例题……），节点之间有前置关系。读者可以按自己的顺序挑节点，拼成讲义并导出 PDF；编辑在网站上修改内容，经审核后上线，每次修改都有版本记录，可以回滚。

- 正文写法：**Markdown + Typst 公式**（不用 LaTeX）。服务器用 [Typst](https://typst.app) 把公式编译成 MathML，浏览器用 MathJax 显示；讲义 PDF 也由 Typst 排版。
- 后端：Node.js 22 + Fastify + PostgreSQL；前端：原生 JavaScript，没有构建步骤。

## 在自己电脑上跑起来

需要：Node.js 22、PostgreSQL（13 及以上）、Typst 0.15.1、中文字体（Noto Serif/Sans CJK SC，生成 PDF 时用）。

```bash
# 1. 依赖
npm ci

# 2. Typst：Linux x86_64 直接运行下面的脚本（装到 bin/typst）；
#    macOS 可以 brew install typst，或者设置环境变量 TYPST_BIN=Typst 的路径
bash deploy/get-typst.sh

# 3. 数据库（默认连接 postgres://maki:maki-dev@127.0.0.1:5432/maki_dev，可用 DATABASE_URL 改）
createuser -s maki && psql -c "ALTER USER maki PASSWORD 'maki-dev'" && createdb -O maki maki_dev

# 4. 启动（第一次启动会自动导入课程）
npm start
```

打开 http://localhost:3000 。第一次启动时终端里会打印「设置超级管理员」的链接（也写在 `data/admin-setup-link.txt`），打开它设置昵称和密码。

运行测试（需要一个可以随意清空的数据库 `maki_test`，或用 `TEST_DATABASE_URL` 指定）：

```bash
createdb -O maki maki_test
npm test
```

## 目录

| 目录 | 内容 |
| --- | --- |
| `server/` | 后端：接口、审核流程（`workflow.js`）、课程结构检查（`course.js`）、Markdown + Typst 渲染（`render.js`）、讲义 PDF（`typpdf.js`）、旧写法转换（`convert.js`） |
| `public/` | 前端：`core.js`（阅读、知识库、讲义）、`online.js`（登录、编辑器、审核台）、`atlas.js`（学习地图） |
| `content/` | 各门课的**初始内容**。线上修改保存在数据库里，以网站为准 |
| `deploy/` | 服务器安装、更新、备份脚本（阿里云 Linux），说明见 `deploy/README.md` |
| `tools/` | 内容转换工具 |
| `test/` | 自动测试 |

## 参与

- **改课程内容**（定义、证明、例题、错别字）：请在网站上申请成为编辑，直接在网站里修改，审核通过后上线。不需要会用 Git。
- **改代码**（功能、界面、渲染、bug）：见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

- 代码：[AGPL-3.0](LICENSE)。用这份代码搭建对外服务的网站，也需要公开你修改后的源代码。
- 课程内容（`content/`）：[CC BY-SA 4.0](content/LICENSE.md)。
