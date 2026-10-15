#!/bin/bash
# 开启 HTTPS。用法（root）：bash https.sh 域名 [邮箱]
# 两种证书来源：
#   1. 已经从阿里云下载了免费证书（Nginx 格式）：把两个文件放成
#      /etc/nginx/ssl/域名.pem 和 /etc/nginx/ssl/域名.key，再运行本脚本。
#   2. 没有放证书：自动用 Let's Encrypt 申请，并每天检查续期。
set -euo pipefail
DOMAIN="${1:?请写域名}"; EMAIL="${2:-}"
APP=/srv/maki-math/app
mkdir -p /etc/nginx/ssl

if [ ! -f /etc/nginx/ssl/$DOMAIN.pem ]; then
  echo "== 用 Let's Encrypt 申请证书"
  command -v certbot >/dev/null || { dnf -y install epel-aliyuncs-release >/dev/null 2>&1 || dnf -y install epel-release >/dev/null 2>&1 || true; dnf -y install certbot >/dev/null; }
  ARGS=(certonly --webroot -w /var/www/acme -d "$DOMAIN" -d "www.$DOMAIN" --agree-tos --non-interactive)
  if [ -n "$EMAIL" ]; then ARGS+=(-m "$EMAIL"); else ARGS+=(--register-unsafely-without-email); fi
  certbot "${ARGS[@]}"
  HOOK=/etc/letsencrypt/renewal-hooks/deploy/maki.sh
  mkdir -p "$(dirname $HOOK)"
  cat > $HOOK <<H
#!/bin/sh
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/$DOMAIN.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/$DOMAIN.key
systemctl reload nginx
H
  chmod 755 $HOOK
  cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/$DOMAIN.pem
  cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/$DOMAIN.key
  systemctl enable --now certbot-renew.timer >/dev/null 2>&1 || (crontab -l 2>/dev/null; echo "17 3 * * * certbot renew -q") | sort -u | crontab -
fi
chmod 600 /etc/nginx/ssl/$DOMAIN.key

touch /etc/maki-math.https
sed "s/__DOMAIN__/$DOMAIN/g; s#__APP__#$APP#g" $APP/deploy/nginx-https.conf > /etc/nginx/conf.d/maki-math.conf
sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=1/; s#^PUBLIC_URL=.*#PUBLIC_URL=https://'"$DOMAIN"'#' /etc/maki-math.env
nginx -t && systemctl reload nginx && systemctl restart maki-math
echo "== HTTPS 已开启：https://$DOMAIN"
[ -f $APP/data/admin-setup-link.txt ] && { sleep 3; echo "设置超级管理员的链接："; sed "s#^http://#https://#" $APP/data/admin-setup-link.txt; }
