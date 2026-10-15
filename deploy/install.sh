#!/bin/bash
# Maki 开源数学平台 —— 一键安装（阿里云 Alibaba Cloud Linux 3，2G 内存）
# 用法（root）：bash deploy/install.sh 域名
#   例：bash deploy/install.sh maki-math.com
# 装完会打印一个「设置超级管理员」的链接，用浏览器打开它设置你的账号。
# 可以重复运行：已经装好的部分会跳过。
set -euo pipefail
# sudo -i 的 PATH 里没有 /usr/local/bin
export PATH=/usr/local/bin:/usr/local/sbin:$PATH

DOMAIN="${1:?请写域名，例如 maki-math.com}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
BASE=/srv/maki-math
APP=$BASE/app
ENVF=/etc/maki-math.env
NODE_VER=v22.22.0
TL_MIRROR=https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/tlnet
NPM_REGISTRY=https://registry.npmmirror.com

say() { printf '\n\033[1;34m== %s\033[0m\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "请用 root 运行（sudo -i 之后再运行）"; exit 1; }

ARCH=$(uname -m)
case "$ARCH" in x86_64) NARCH=x64 ;; aarch64) NARCH=arm64 ;; *) echo "不支持的架构 $ARCH"; exit 1 ;; esac

# ---------- 1. 交换分区：2G 内存编译 PDF 时留点余量 ----------
if ! swapon --show | grep -q .; then
  say "创建 2G 交换分区"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10 >/dev/null; echo 'vm.swappiness=10' > /etc/sysctl.d/90-maki.conf
fi

# ---------- 2. 系统软件 ----------
say "安装系统软件（nginx、PostgreSQL、中文字体）"
dnf -y install nginx tar xz perl wget fontconfig rsync >/dev/null
dnf -y install google-noto-serif-cjk-ttc-fonts google-noto-sans-cjk-ttc-fonts >/dev/null 2>&1 || echo "（系统源里没有 Noto CJK 字体，稍后改用 TeX Live 自带的 Fandol 字体）"

if ! command -v postgres >/dev/null && ! [ -x /usr/bin/postgresql-setup ]; then
  for v in 16 15 14 13 12; do
    if dnf -y module enable postgresql:$v >/dev/null 2>&1; then echo "PostgreSQL $v"; break; fi
  done
  dnf -y install postgresql-server postgresql-contrib >/dev/null
fi

# ---------- 3. Node.js ----------
if ! /opt/node/bin/node -v 2>/dev/null | grep -q "$NODE_VER"; then
  say "安装 Node.js $NODE_VER"
  T=$(mktemp -d)
  wget -q -O "$T/node.tar.xz" "https://registry.npmmirror.com/-/binary/node/$NODE_VER/node-$NODE_VER-linux-$NARCH.tar.xz"
  rm -rf /opt/node && mkdir -p /opt/node && tar -xJf "$T/node.tar.xz" -C /opt/node --strip-components=1
  ln -sf /opt/node/bin/node /usr/local/bin/node; ln -sf /opt/node/bin/npm /usr/local/bin/npm
  rm -rf "$T"
fi

# ---------- 4. TeX Live（只装生成讲义需要的部分，约 400MB） ----------
TLROOT=/usr/local/texlive/maki
if ! ls $TLROOT/bin/*/tlmgr >/dev/null 2>&1; then
  say "安装 TeX Live（清华镜像，大约 5–15 分钟）"
  rm -rf $TLROOT
  T=$(mktemp -d); cd "$T"
  wget -q "$TL_MIRROR/install-tl-unx.tar.gz" && tar -xzf install-tl-unx.tar.gz && cd install-tl-*/
  cat > maki.profile <<EOF
selected_scheme scheme-basic
TEXDIR $TLROOT
TEXMFLOCAL /usr/local/texlive/texmf-local
TEXMFSYSVAR $TLROOT/texmf-var
TEXMFSYSCONFIG $TLROOT/texmf-config
instopt_adjustpath 1
instopt_letter 0
tlpdbopt_install_docfiles 0
tlpdbopt_install_srcfiles 0
tlpdbopt_autobackup 0
EOF
  if ! ./install-tl -profile maki.profile -repository "$TL_MIRROR" >/var/log/maki-texlive.log 2>&1; then
    echo "TeX Live 安装失败，日志最后几行："; tail -20 /var/log/maki-texlive.log; exit 1
  fi
  cd /; rm -rf "$T"
fi
TLBIN=$(ls -d $TLROOT/bin/*/ | head -1)
export PATH="$TLBIN:$PATH"
for b in "$TLBIN"*; do ln -sf "$b" /usr/local/bin/; done
if ! kpsewhich xeCJK.sty >/dev/null 2>&1 || ! kpsewhich mathtools.sty >/dev/null 2>&1; then
  say "安装 TeX 宏包"
  tlmgr option repository "$TL_MIRROR" >/dev/null
  tlmgr install collection-xetex xecjk fandol mathtools amsmath amsfonts tools xcolor hyperref geometry etoolbox l3packages fontspec >>/var/log/maki-texlive.log 2>&1 \
    || { echo "宏包安装失败，日志最后几行："; tail -20 /var/log/maki-texlive.log; exit 1; }
fi
# 中文字体：没有 Noto CJK 就用 Fandol
CJK_ENV=""
if ! fc-list | grep -q "Noto Serif CJK SC"; then
  FD=$(kpsewhich -var-value TEXMFDIST)/fonts/opentype/public/fandol
  mkdir -p /usr/share/fonts/fandol && cp -n "$FD"/*.otf /usr/share/fonts/fandol/ && fc-cache -f >/dev/null
  CJK_ENV=$'TEX_CJK_FONT=FandolSong\nTEX_CJK_SANS=FandolHei'
fi

# ---------- 5. PostgreSQL（低内存配置） ----------
say "配置 PostgreSQL"
PGDATA=/var/lib/pgsql/data
if [ ! -f "$PGDATA/PG_VERSION" ]; then postgresql-setup --initdb >/dev/null; fi
cat > "$PGDATA/conf.d.maki.conf" <<'EOF'
# Maki：2G 内存的保守配置
max_connections = 30
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_wal_size = 512MB
min_wal_size = 64MB
listen_addresses = 'localhost'
timezone = 'Asia/Shanghai'
log_min_duration_statement = 1000
EOF
grep -q "conf.d.maki.conf" "$PGDATA/postgresql.conf" || echo "include = 'conf.d.maki.conf'" >> "$PGDATA/postgresql.conf"
chown postgres:postgres "$PGDATA/conf.d.maki.conf"
systemctl enable --now postgresql >/dev/null 2>&1; systemctl restart postgresql

id mathweb >/dev/null 2>&1 || useradd --system --create-home --home-dir $BASE --shell /sbin/nologin mathweb
chmod 755 $BASE
su - postgres -s /bin/bash -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='mathweb'\" | grep -q 1 || createuser mathweb"
su - postgres -s /bin/bash -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='maki_math'\" | grep -q 1 || createdb -O mathweb -E UTF8 -T template0 maki_math"

# ---------- 6. 程序 ----------
say "部署程序到 $APP"
mkdir -p $APP/data/pdf /var/backups/maki-math
rsync -a --delete --exclude node_modules --exclude data --exclude test --exclude '.git' "$SRC/" $APP/
chown -R mathweb:mathweb $BASE
bash $APP/deploy/get-typst.sh && chown -R mathweb:mathweb $APP/bin
su -s /bin/bash mathweb -c "export PATH=/opt/node/bin:/usr/bin:/bin; cd $APP && npm ci --omit=dev --registry=$NPM_REGISTRY --no-audit --no-fund" >/dev/null
# MathJax 由 nginx 直接发预压缩文件
find $APP/node_modules/mathjax/es5 -name '*.js' ! -name '*.gz' -exec gzip -9kf {} \;

if [ ! -f $ENVF ]; then
  cat > $ENVF <<EOF
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
DATABASE_URL=postgres://mathweb@/maki_math?host=/var/run/postgresql
PG_POOL=8
PUBLIC_URL=http://$DOMAIN
POW_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
# 配好 HTTPS 之后由 https.sh 改成 1
COOKIE_SECURE=0
# 访客反馈每天的总上限（防刷屏）
ANON_FEEDBACK_DAILY_MAX=200
$CJK_ENV
EOF
  chmod 640 $ENVF; chown root:mathweb $ENVF
fi

cp $APP/deploy/maki-math.service /etc/systemd/system/
cp $APP/deploy/maki-backup.service $APP/deploy/maki-backup.timer /etc/systemd/system/
install -m 755 $APP/deploy/backup.sh /usr/local/bin/maki-backup
systemctl daemon-reload
systemctl enable maki-math >/dev/null 2>&1; systemctl restart maki-math
systemctl enable --now maki-backup.timer >/dev/null 2>&1

# ---------- 7. nginx ----------
say "配置 nginx"
mkdir -p /var/www/acme
cp $APP/deploy/maki-proxy.inc /etc/nginx/maki-proxy.inc
TPL=nginx-http.conf; [ -f /etc/maki-math.https ] && TPL=nginx-https.conf
sed "s/__DOMAIN__/$DOMAIN/g; s#__APP__#$APP#g" $APP/deploy/$TPL > /etc/nginx/conf.d/maki-math.conf
if command -v getenforce >/dev/null && [ "$(getenforce)" = Enforcing ]; then
  setsebool -P httpd_can_network_connect 1
  chcon -R -t httpd_sys_content_t $APP/node_modules/mathjax/es5 /var/www/acme
fi
nginx -t && systemctl enable nginx >/dev/null 2>&1 && systemctl restart nginx

for i in $(seq 1 30); do curl -sf http://127.0.0.1:3000/healthz >/dev/null && break; sleep 1; done
if curl -sf http://127.0.0.1:3000/healthz >/dev/null; then
  say "装好了：http://$DOMAIN"
  if [ -f $APP/data/admin-setup-link.txt ]; then
    echo "设置超级管理员：用浏览器打开下面的链接（只能用一次）"
    cat $APP/data/admin-setup-link.txt
    echo "（建议先运行下面的 https.sh，再打开这个链接，把 http 换成 https）"
  fi
  echo "下一步：在阿里云安全组放行 80、443 端口，然后运行 bash $APP/deploy/https.sh $DOMAIN 开启 HTTPS。"
else
  echo "程序没有正常启动，请运行 journalctl -u maki-math -n 50 查看原因"; exit 1
fi
