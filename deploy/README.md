# 部署说明（阿里云 Alibaba Cloud Linux 3，2G 内存）

## 日常更新：从 GitHub 拉代码（推荐）

在服务器上（root）运行：

```
maki-update            # 部署 GitHub 上 main 分支的最新版本
maki-update v1.2       # 部署某个版本（标签或提交号）
```

第一次运行会生成一把只读的部署密钥并打印出来：把它加到 GitHub 仓库 → Settings → Deploy keys（不要勾选写权限），再运行一次就行。
代码保存在 `/srv/maki-math/repo`，部署过程和下面的「上传压缩包」完全一样（先备份数据库，再更新、重启）。
连不上 GitHub 时，照旧用上传压缩包的方式。

## 第一次安装

1. 阿里云控制台 → 安全组：放行 22、80、443 端口。
2. 域名解析：`maki-math.com` 和 `www.maki-math.com` 都加一条 A 记录，指向服务器公网 IP。
3. 把整个 `maki-math` 文件夹传到服务器，例如在自己电脑上运行：
   ```
   scp maki-math.tar.gz root@服务器IP:/root/
   ```
   然后登录服务器：
   ```
   cd /root && tar xzf maki-math.tar.gz && cd maki-math
   bash deploy/install.sh maki-math.com
   ```
   大约 10–20 分钟（最慢的是 TeX Live）。
4. 开启 HTTPS：
   ```
   bash /srv/maki-math/app/deploy/https.sh maki-math.com 你的邮箱
   ```
   如果 Let's Encrypt 申请失败，可以在阿里云「数字证书管理服务」申请免费证书，下载 Nginx 格式，
   改名放成 `/etc/nginx/ssl/maki-math.com.pem` 和 `/etc/nginx/ssl/maki-math.com.key`，再运行一次上面的命令。

   运行完会打印「设置超级管理员」的链接。
5. 用浏览器打开这个链接，设置你的昵称和密码，就是超级管理员了。链接只能用一次。
   找不到这个链接时，运行 `cat /srv/maki-math/app/data/admin-setup-link.txt`。

**注意：开启 HTTPS 之前就能访问，但登录状态只有在 HTTPS 下才是安全的，所以先做第 4 步再做第 5 步。**

## 服务器上已经有旧网站或旧数据库时

先运行 `bash deploy/takeover.sh 域名`：把旧网站、全部数据库、nginx 和证书完整存档到 `/root/archive/日期/`，不删任何东西。
确认存档没问题后，运行 `bash deploy/takeover.sh 域名 --清理`：删掉旧数据库和旧网站配置，数据库改为只允许本机连接，已有的 Let's Encrypt 证书继续使用。
然后再运行 install.sh 和 https.sh。

恢复某个旧数据库：`su - postgres -c "createdb 库名" && su - postgres -c "pg_restore -d 库名 /root/archive/日期/数据库/库名.dump"`

## 账号

网站不开放注册，普通访客不需要账号：进度和「我的讲义」存在他们自己的浏览器里，可以在「我的讲义」页导出备份文件、在别的设备导入。

账号只发给你邀请的人：
- **邀请**：审核台 → 成员 → 生成邀请链接，发给对方。对方打开后设置昵称和密码即可，链接 7 天有效、只能用一次。开通后在同一页给他设「编辑」「审核」或「认证老师」。
- **忘记密码**：在他的卡片上点「重设密码链接」发给他，2 天有效。
- **手机号**：需要实名记录时，在卡片上点「登记手机号」手动填。登记后他也能用手机号加密码登录。
- **反馈**：访客不登录也能提交反馈，只有审核者能看到。提交前浏览器要先做一次计算验证；同一 IP 每小时最多 5 条，全站访客反馈每天最多 200 条（可以用 `ANON_FEEDBACK_DAILY_MAX` 调整）。

网站不发短信、不发邮件，没有这部分费用。

## 日常

| 做什么 | 命令 |
|---|---|
| 看运行状态 | `systemctl status maki-math` |
| 看日志 | `journalctl -u maki-math -n 100` |
| 重启 | `systemctl restart maki-math` |
| 更新程序 | 把新的 `maki-math` 文件夹传上来，进入它运行 `bash deploy/update.sh`（会先自动备份） |
| 手动备份 | `maki-backup` |
| 看内存 | `free -h` |

## 备份与恢复

每天凌晨 4 点自动备份数据库到 `/var/backups/maki-math/`，保留 14 天。
建议再在阿里云控制台给云盘设一个自动快照策略（每周一次）。

恢复某一份备份：
```
systemctl stop maki-math
su - postgres -c "dropdb maki_math && createdb -O mathweb -E UTF8 -T template0 maki_math"
su - postgres -c "pg_restore -d maki_math --no-owner --role=mathweb /var/backups/maki-math/文件名.dump"
systemctl start maki-math
```

## 配置文件 `/etc/maki-math.env`

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | 数据库地址，默认走本机 socket，不需要密码 |
| `PG_POOL` | 数据库连接数，默认 8 |
| `COOKIE_SECURE` | 开启 HTTPS 后为 1 |
| `PUBLIC_URL` | 网站地址，用来生成设置超管的链接 |
| `POW_SECRET` | 计算验证用的密钥，安装时随机生成 |
| `ANON_FEEDBACK_DAILY_MAX` | 访客反馈每天的总上限 |
| `TEX_CJK_FONT`、`TEX_CJK_SANS` | 讲义 PDF 的中文字体，默认 Noto，缺字体时自动改成 Fandol |

## 内存占用（2G 够用）

- PostgreSQL：约 150–200 MB
- 网站程序：约 80–150 MB
- 生成 PDF：每次一份排队进行，峰值约 200 MB，相同内容直接用缓存
- nginx：约 10 MB
- 另有 2G 交换分区兜底

以后要升级：内存加到 4G 以上后，可以把 `PG_POOL` 调大、加 Meilisearch 做搜索，程序不用大改。
