# =========================================================
# 创游世界资料库：VitePress 文档站一键部署检查脚本
# 适用环境：Windows PowerShell / VSCode 终端
#
# 作用：
# 1. 检查项目目录
# 2. 检查 pnpm / Node 环境
# 3. 安装依赖（可选）
# 4. 重新生成侧边栏
# 5. 检查 frontmatter
# 6. 检查 UI 关键文件
# 7. 执行 VitePress 正式构建
#
# 注意：
# 本脚本不会自动 git commit / push。
# 推送仍建议使用 VSCode Git UI 手动完成。
# =========================================================

param(
  [switch]$Install,
  [switch]$Clean,
  [switch]$Preview
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok($Message) {
  Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
  Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Write-Fail($Message) {
  Write-Host "FAIL $Message" -ForegroundColor Red
}

$StartTime = Get-Date

Write-Host ""
Write-Host "创游世界资料库 - 文档站一键部署检查" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor DarkGray

# 1. 检查项目根目录
Write-Step "检查项目目录"

if (!(Test-Path "package.json")) {
  Write-Fail "未找到 package.json。请在项目根目录运行本脚本。"
  exit 1
}

if (!(Test-Path "docs\.vitepress\config.mts")) {
  Write-Fail "未找到 docs\.vitepress\config.mts。请确认当前目录是 VitePress 项目根目录。"
  exit 1
}

if (!(Test-Path "scripts\generate-sidebar.mjs")) {
  Write-Fail "未找到 scripts\generate-sidebar.mjs。"
  exit 1
}

Write-Ok "项目目录检查通过"

# 2. 检查 Node / pnpm
Write-Step "检查 Node 与 pnpm 环境"

try {
  $nodeVersion = node -v
  Write-Ok "Node: $nodeVersion"
} catch {
  Write-Fail "未检测到 Node.js，请先安装 Node.js 20 或以上版本。"
  exit 1
}

try {
  $pnpmVersion = pnpm -v
  Write-Ok "pnpm: $pnpmVersion"
} catch {
  Write-Warn "未检测到 pnpm，尝试启用 corepack..."
  try {
    corepack enable
    $pnpmVersion = pnpm -v
    Write-Ok "pnpm: $pnpmVersion"
  } catch {
    Write-Fail "无法启用 pnpm。请先执行：corepack enable"
    exit 1
  }
}

# 3. 可选清理构建产物
if ($Clean) {
  Write-Step "清理旧构建产物"

  $dist = "docs\.vitepress\dist"

  if (Test-Path $dist) {
    try {
      cmd /c "attrib -R -H -S `"$dist`" /S /D" | Out-Null
      Remove-Item -LiteralPath $dist -Recurse -Force
      Write-Ok "已清理 docs\.vitepress\dist"
    } catch {
      Write-Warn "dist 删除失败，尝试使用 cmd 强制删除"
      cmd /c "rmdir /s /q `"docs\.vitepress\dist`""
    }
  } else {
    Write-Ok "没有发现旧 dist，跳过"
  }
}

# 4. 可选安装依赖
if ($Install -or !(Test-Path "node_modules")) {
  Write-Step "安装依赖"

  if (Test-Path "pnpm-lock.yaml") {
    try {
      pnpm install --frozen-lockfile
    } catch {
      Write-Warn "frozen-lockfile 安装失败，尝试普通 pnpm install"
      pnpm install
    }
  } else {
    pnpm install
  }

  Write-Ok "依赖安装完成"
} else {
  Write-Ok "已存在 node_modules，跳过依赖安装"
}

# 5. 生成侧边栏
Write-Step "生成侧边栏与自动目录"
pnpm run docs:sidebar
Write-Ok "侧边栏生成完成"

# 6. 检查 frontmatter
Write-Step "检查 frontmatter"
pnpm run docs:frontmatter:check
Write-Ok "frontmatter 检查通过"

# 7. 检查 UI 关键文件
Write-Step "检查文档站 UI 关键文件"
pnpm run docs:ui:check
Write-Ok "UI 检查通过"

# 8. 正式构建
Write-Step "执行 VitePress 正式构建"
pnpm run docs:build
Write-Ok "VitePress 构建成功"

# 9. 检查输出目录
Write-Step "检查构建输出目录"

$OutputDir = "docs\.vitepress\dist"

if (Test-Path $OutputDir) {
  Write-Ok "构建产物已生成：$OutputDir"
} else {
  Write-Fail "未找到构建产物：$OutputDir"
  exit 1
}

# 10. 可选预览
if ($Preview) {
  Write-Step "启动构建产物预览"
  Write-Host "预览服务启动后，可以在浏览器打开终端显示的地址。" -ForegroundColor Yellow
  pnpm run docs:preview
}

$EndTime = Get-Date
$Duration = New-TimeSpan -Start $StartTime -End $EndTime

Write-Host ""
Write-Host "=================================================" -ForegroundColor DarkGray
Write-Host "文档站一键部署检查完成" -ForegroundColor Green
Write-Host "耗时：$($Duration.ToString())" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "1. 用 VSCode Git UI 查看改动"
Write-Host "2. 提交信息建议：新增：文档站一键部署检查脚本"
Write-Host "3. 同步到 GitHub 后，等待 Cloudflare Pages 自动部署"
Write-Host "=================================================" -ForegroundColor DarkGray
