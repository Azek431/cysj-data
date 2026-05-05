#!/usr/bin/env bash
set -e

SRC="/www/wwwroot/cysjdocs"
DIST_SRC="$SRC/docs/.vitepress/dist"
DIST_OUT="/www/wwwroot/cysjdocs-dist"
HASH_FILE="$SRC/.last_docs_hash"
LOCK_FILE="/tmp/cysjdocs-deploy.lock"
LOG_FILE="/www/wwwlogs/cysjdocs-deploy.log"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date '+%F %T') another deploy is running, skip" >> "$LOG_FILE"
  exit 0
fi

cd "$SRC"

# 只统计真正影响网站的文件，排除缓存、构建产物、node_modules、Syncthing 临时文件
CURRENT_HASH=$(find docs package.json pnpm-lock.yaml pnpm-workspace.yaml \
  -type f \
  ! -path "docs/.vitepress/cache/*" \
  ! -path "docs/.vitepress/dist/*" \
  ! -path "docs/_conflicts/*" \
  ! -name "*.sync-conflict-*" \
  ! -name ".stignore" \
  -print0 2>/dev/null \
  | sort -z \
  | xargs -0 sha256sum \
  | sha256sum \
  | awk '{print $1}')

LAST_HASH=""
if [ -f "$HASH_FILE" ]; then
  LAST_HASH=$(cat "$HASH_FILE")
fi

if [ "$CURRENT_HASH" = "$LAST_HASH" ]; then
  echo "$(date '+%F %T') no changes, skip build" >> "$LOG_FILE"
  exit 0
fi

echo "$(date '+%F %T') changes detected, start build" >> "$LOG_FILE"

sudo -u deploy pnpm install --frozen-lockfile
sudo -u deploy pnpm run docs:build

mkdir -p "$DIST_OUT"
rsync -av --delete "$DIST_SRC/" "$DIST_OUT/" >> "$LOG_FILE"

chown -R www:www "$DIST_OUT" 2>/dev/null || true

echo "$CURRENT_HASH" > "$HASH_FILE"
chown deploy:deploy "$HASH_FILE" 2>/dev/null || true

echo "$(date '+%F %T') deploy complete" >> "$LOG_FILE"