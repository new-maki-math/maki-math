#!/bin/bash
# 接管旧服务器：先完整存档，再清理旧网站和旧数据库，为 install.sh 腾地方。
# 用法（root）：bash deploy/takeover.sh 域名
#   第一次运行只存档、不删任何东西，最后会列出存档内容。
#   确认存档没问题后，再运行：bash deploy/takeover.sh 域名 --清理
set -euo pipefail
export PATH=/usr/local/bin:/usr/local/sbin:$PATH
DOMAIN="${1:?请写域名，例如 maki-math.com}"
MODE="${2:-}"
PGDATA=/var/lib/pgsql/data
say() { printf '\n\033[1;34m== %s\033[0m\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "请用 root 运行"; exit 1; }

ARCH_ROOT=/root/archive
LATEST=$(ls -d $ARCH_ROOT/20* 2>/dev/null | tail -1 || true)

if [ "$MODE" != "--清理" ]; then
  A=$ARCH_ROOT/$(date +%Y%m%d-%H%M)
  mkdir -p "$A"; chmod 700 $ARCH_ROOT "$A"
  say "存档到 $A"

  # 数据库：整体一份（含用户和权限），每个库再单独一份
  su - postgres -c "pg_dumpall" | gzip > "$A/全部数据库.sql.gz"
  mkdir -p "$A/数据库"
  for db in $(su - postgres -c "psql -Atc \"SELECT datname FROM pg_database WHERE NOT datistemplate AND datname <> 'postgres'\""); do
    su - postgres -c "pg_dump -Fc '$db'" > "$A/数据库/$db.dump"
    echo "  数据库 $db：$(du -h "$A/数据库/$db.dump" | cut -f1)"
  done
  cp -a $PGDATA/pg_hba.conf $PGDATA/postgresql.conf "$A/数据库/" 2>/dev/null || true

  # 旧网站文件、nginx、证书
  [ -d /var/www ] && tar czf "$A/var-www.tar.gz" -C /var www && echo "  旧网站文件：$(du -h "$A/var-www.tar.gz" | cut -f1)"
  tar czf "$A/nginx配置.tar.gz" -C /etc nginx
  [ -d /etc/letsencrypt ] && tar czf "$A/letsencrypt证书.tar.gz" -C /etc letsencrypt
  crontab -l > "$A/root-crontab.txt" 2>/dev/null || true
  for u in $(ls /home); do crontab -u "$u" -l > "$A/crontab-$u.txt" 2>/dev/null || true; done

  # 检查存档能读
  gzip -t "$A/全部数据库.sql.gz" && echo "  全部数据库：$(du -h "$A/全部数据库.sql.gz" | cut -f1)，校验通过"
  for f in "$A"/数据库/*.dump; do [ -e "$f" ] || continue; pg_restore -l "$f" >/dev/null || { echo "存档 $f 读不出来，停止"; exit 1; }; done
  echo "  每个数据库的存档都校验通过"
  say "存档完成"
  ls -la "$A" "$A/数据库"
  echo
  echo "建议把存档下载一份到你自己的电脑（在 Mac 终端里运行）："
  echo "  scp -r root@服务器IP:$A ~/Downloads/"
  echo
  echo "确认没问题后，运行下面这行清理旧网站和旧数据库："
  echo "  bash $(cd "$(dirname "$0")" && pwd)/takeover.sh $DOMAIN --清理"
  exit 0
fi

# ---------- 清理 ----------
[ -n "$LATEST" ] && [ -s "$LATEST/全部数据库.sql.gz" ] || { echo "没找到存档，请先运行一次不带 --清理 的 takeover.sh"; exit 1; }
say "使用存档 $LATEST，开始清理"

# 旧数据库：删掉除系统库和新网站库以外的全部数据库，以及它们的登录用户
for db in $(su - postgres -c "psql -Atc \"SELECT datname FROM pg_database WHERE NOT datistemplate AND datname NOT IN ('postgres','maki_math')\""); do
  su - postgres -c "psql -qc 'DROP DATABASE \"$db\" WITH (FORCE)'" 2>/dev/null || su - postgres -c "dropdb '$db'"
  echo "  已删除数据库 $db（存档里有）"
done
for r in $(su - postgres -c "psql -Atc \"SELECT rolname FROM pg_roles WHERE rolname !~ '^pg_' AND rolname NOT IN ('postgres','mathweb')\""); do
  su - postgres -c "psql -qc 'DROP ROLE IF EXISTS \"$r\"'" && echo "  已删除数据库用户 $r"
done

# 数据库只允许本机连接（不再对公网开放 5432）
cat > $PGDATA/pg_hba.conf <<'EOF'
# Maki：只允许本机连接
local   all   all                 peer
host    all   all   127.0.0.1/32  scram-sha-256
host    all   all   ::1/128       scram-sha-256
EOF
chown postgres:postgres $PGDATA/pg_hba.conf; chmod 600 $PGDATA/pg_hba.conf
sed -i "s/^\s*listen_addresses\s*=.*/listen_addresses = 'localhost'/" $PGDATA/postgresql.conf
grep -q "^listen_addresses" $PGDATA/postgresql.conf || echo "listen_addresses = 'localhost'" >> $PGDATA/postgresql.conf
systemctl restart postgresql
echo "  数据库现在只监听本机"

# nginx：换成干净的主配置，旧的在存档里
cat > /etc/nginx/nginx.conf <<'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;
include /usr/share/nginx/modules/*.conf;

events { worker_connections 1024; }

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;
    sendfile            on;
    tcp_nopush          on;
    keepalive_timeout   65;
    types_hash_max_size 4096;
    server_tokens       off;
    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # 用 IP 或别的域名访问时直接断开
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        location /.well-known/acme-challenge/ { root /var/www/acme; }
        location / { return 444; }
    }

    include /etc/nginx/conf.d/*.conf;
}
EOF
mkdir -p /var/www/acme
rm -f /etc/nginx/conf.d/*.conf
nginx -t && systemctl reload nginx
echo "  nginx 已换成干净配置"

# 已有的 Let's Encrypt 证书：续期方式改成 webroot，以后自动续期不再改 nginx 配置
RC=/etc/letsencrypt/renewal/$DOMAIN.conf
if [ -f "$RC" ]; then
  python3 - "$RC" "$DOMAIN" <<'PY'
import sys, re
p, d = sys.argv[1], sys.argv[2]
s = open(p).read()
s = re.sub(r'\n\[\[webroot_map\]\][\s\S]*$', '\n', s)
s = re.sub(r'(?m)^authenticator = .*$', 'authenticator = webroot', s)
s = re.sub(r'(?m)^installer = .*\n', '', s)
s = re.sub(r'(?m)^webroot_path = .*\n', '', s)
s = s.replace('[renewalparams]\n', '[renewalparams]\nwebroot_path = /var/www/acme,\n', 1)
s = s.rstrip('\n') + f'\n[[webroot_map]]\n{d} = /var/www/acme\nwww.{d} = /var/www/acme\n'
open(p, 'w').write(s)
PY
  mkdir -p /etc/nginx/ssl
  cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/$DOMAIN.pem
  cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/$DOMAIN.key
  chmod 600 /etc/nginx/ssl/$DOMAIN.key
  mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  cat > /etc/letsencrypt/renewal-hooks/deploy/maki.sh <<H
#!/bin/sh
cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/$DOMAIN.pem
cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/$DOMAIN.key
systemctl reload nginx
H
  chmod 755 /etc/letsencrypt/renewal-hooks/deploy/maki.sh
  systemctl enable --now certbot-renew.timer >/dev/null 2>&1 || { crontab -l 2>/dev/null | grep -q "certbot renew" || (crontab -l 2>/dev/null; echo "17 3 * * * certbot renew -q") | crontab -; }
  echo "  沿用已有证书（$(openssl x509 -enddate -noout -in /etc/nginx/ssl/$DOMAIN.pem | cut -d= -f2) 到期，会自动续期）"
fi

say "清理完成。下一步运行：bash deploy/install.sh $DOMAIN"
