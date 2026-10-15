#!/bin/bash
# 从 GitHub 拉取代码并部署。用法（root）：maki-update            部署 main 分支最新版本
#                                         maki-update v1.2       部署某个版本（标签或提交号）
# 第一次运行会生成一把只读的「部署密钥」，按提示加到 GitHub 仓库里，再运行一次即可。
set -euo pipefail
export PATH=/opt/node/bin:/usr/local/bin:/usr/bin:/bin
REPO_URL=git@github-maki:new-maki-math/maki-math.git
DIR=/srv/maki-math/repo
KEY=/root/.ssh/maki_deploy
REF="${1:-origin/main}"

command -v git >/dev/null || { echo "安装 git……"; (dnf -y install git || yum -y install git) >/dev/null; }
command -v ssh-keygen >/dev/null || (dnf -y install openssh-clients || yum -y install openssh-clients) >/dev/null

mkdir -p /root/.ssh && chmod 700 /root/.ssh
if [ ! -f "$KEY" ]; then
  ssh-keygen -t ed25519 -N '' -C "maki-math-server" -f "$KEY" >/dev/null
  NEWKEY=1
fi
grep -q "Host github-maki" /root/.ssh/config 2>/dev/null || cat >> /root/.ssh/config <<CFG
Host github-maki
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile $KEY
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
CFG
chmod 600 /root/.ssh/config

if ! ssh -T -o ConnectTimeout=20 github-maki 2>&1 | grep -q "successfully authenticated"; then
  echo
  echo "服务器还没有权限读取仓库。请把下面这一行加到 GitHub："
  echo "  仓库页面 → Settings → Deploy keys → Add deploy key，标题随便写，不要勾选 Allow write access"
  echo
  cat "$KEY.pub"
  echo
  echo "加好以后再运行一次：maki-update"
  [ "${NEWKEY:-}" ] || echo "（如果已经加过还是不行，可能是服务器连不上 GitHub，过几分钟再试，或者继续用上传压缩包的方式更新）"
  exit 1
fi

if [ ! -d "$DIR/.git" ]; then
  echo "第一次下载代码……"
  git clone --quiet "$REPO_URL" "$DIR"
fi
cd "$DIR"
git fetch --quiet --tags origin
git checkout --quiet --force "$REF" 2>/dev/null || git checkout --quiet --force "origin/$REF"
echo "== 部署版本：$(git log -1 --format='%h %s（%ci）')"
bash "$DIR/deploy/update.sh"
