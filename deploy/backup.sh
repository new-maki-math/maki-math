#!/bin/bash
# 备份数据库到 /var/backups/maki-math，保留 14 天。恢复方法见 deploy/README.md
set -euo pipefail
D=/var/backups/maki-math; mkdir -p $D
F=$D/maki_math-$(date +%Y%m%d-%H%M).dump
su - postgres -s /bin/bash -c "pg_dump -Fc maki_math" > "$F.tmp" && mv "$F.tmp" "$F"
chmod 600 "$F"
find $D -name 'maki_math-*.dump' -mtime +14 -delete
echo "已备份到 $F（$(du -h "$F" | cut -f1)）"
