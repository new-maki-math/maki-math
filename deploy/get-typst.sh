#!/bin/bash
# 下载固定版本的 Typst 编译器到 <项目>/bin/typst，并校验文件指纹。用法：bash deploy/get-typst.sh
set -euo pipefail
VER=0.15.1
SHA=a6d077d0a95eed5a2eba715b2dae06be954f624ccbf85758a03f389ded33118c   # typst-x86_64-unknown-linux-musl.tar.xz
DIR="$(cd "$(dirname "$0")/.." && pwd)/bin"
if [ -x "$DIR/typst" ] && "$DIR/typst" --version | grep -q "$VER"; then echo "Typst $VER 已经装好：$DIR/typst"; exit 0; fi
case "$(uname -m)" in x86_64) ;; *) echo "这个脚本只准备了 x86_64 Linux 的版本；其他平台请自己安装 Typst $VER（https://github.com/typst/typst/releases）"; exit 1;; esac
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
URL="https://github.com/typst/typst/releases/download/v$VER/typst-x86_64-unknown-linux-musl.tar.xz"
echo "下载 $URL"
curl -fsSL --retry 3 -o "$T/t.tar.xz" "$URL" || wget -q -O "$T/t.tar.xz" "$URL" || { echo "下载失败：请在能访问 GitHub 的电脑上下载上面的文件，传到服务器后放到 $DIR/typst"; exit 1; }
echo "$SHA  $T/t.tar.xz" | sha256sum -c - >/dev/null || { echo "文件指纹不对，已停止"; exit 1; }
tar -xJf "$T/t.tar.xz" -C "$T"
mkdir -p "$DIR" && install -m 755 "$T"/typst-*/typst "$DIR/typst"
echo "已安装：$("$DIR/typst" --version)"
