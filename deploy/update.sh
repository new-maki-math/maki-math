#!/bin/bash
# 更新程序。用法（root）：把新的 maki-math 文件夹传到服务器，进入它运行 bash deploy/update.sh
# 数据库、生成的 PDF、/etc/maki-math.env 都不会动。
set -euo pipefail
export PATH=/opt/node/bin:/usr/local/bin:/usr/bin:/bin
SRC="$(cd "$(dirname "$0")/.." && pwd)"; APP=/srv/maki-math/app
/usr/local/bin/maki-backup
# bin/typst（Typst 编译器）只在第一次随包上传，之后的小更新包不带它：同步时保护它不被删掉
rsync -a --delete --filter='P bin/typst' --exclude node_modules --exclude data --exclude test --exclude '.git' "$SRC/" $APP/
chown -R mathweb:mathweb $APP
[ -x $APP/bin/typst ] || bash $APP/deploy/get-typst.sh || { echo "缺少 Typst 编译器，部署停止"; exit 1; }
chmod 755 $APP/bin/typst && echo "Typst：$($APP/bin/typst --version)"
su -s /bin/bash mathweb -c "export PATH=/opt/node/bin:/usr/bin:/bin; cd $APP && npm ci --omit=dev --registry=https://registry.npmmirror.com --no-audit --no-fund" >/dev/null
find $APP/node_modules/mathjax/es5 -name '*.js' ! -name '*.gz' -exec gzip -9kf {} \;
cp $APP/deploy/maki-math.service /etc/systemd/system/ && systemctl daemon-reload
install -m 755 $APP/deploy/pull.sh /usr/local/bin/maki-update && ln -sf /usr/local/bin/maki-update /usr/bin/maki-update   # 以后用 maki-update 从 GitHub 更新（sudo -i 的命令路径里没有 /usr/local/bin）
systemctl restart maki-math
for i in $(seq 1 90); do curl -sf http://127.0.0.1:3000/healthz >/dev/null && { echo "== 更新完成"; exit 0; }; sleep 1; done
echo "启动失败，请运行 journalctl -u maki-math -n 50 查看"; exit 1
