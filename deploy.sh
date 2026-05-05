#!/usr/bin/env bash
set -e cd /www/wwwroot/cysjdocs echo "开始构建 VitePress..." sudo -u deploy pnpm run docs:build echo "发布到网站目录..." sudo rsync -av --delete /www/wwwroot/cysjdocs/docs/.vitepress/dist/ 
/www/wwwroot/cysjdocs-dist/ echo "修复权限..." sudo chown -R www:www /www/wwwroot/cysjdocs-dist 2>/dev/null || true
echo "部署完成。"
