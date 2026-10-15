#!/bin/bash
# 从 GitHub 拉取代码并部署。用法（root）：maki-update            部署 main 分支最新版本
#                                         maki-update 1e72d1a    部署某个版本（提交号或标签）
# 仓库是公开的，不需要任何密钥。
set -euo pipefail
export PATH=/opt/node/bin:/usr/local/bin:/usr/bin:/bin
REPO_URL=https://github.com/new-maki-math/maki-math.git
DIR=/srv/maki-math/repo
REF="${1:-origin/main}"

command -v git >/dev/null || { echo "安装 git……"; (dnf -y install git || yum -y install git) >/dev/null; }

if [ ! -d "$DIR/.git" ]; then
  echo "第一次下载代码……"
  git clone --quiet "$REPO_URL" "$DIR"
fi
cd "$DIR"
git remote set-url origin "$REPO_URL"
for i in 1 2 3; do git fetch --quiet --tags origin && break; echo "连接 GitHub 失败，重试（$i/3）……"; sleep 5; done
git checkout --quiet --force "$REF" 2>/dev/null || git checkout --quiet --force "origin/$REF"
echo "== 部署版本：$(git log -1 --format='%h %s（%ci）')"
bash "$DIR/deploy/update.sh"
