# =========================================================
# 创游世界资料库：文档内容整理脚本
# 适用：Windows PowerShell / VSCode 终端
#
# 作用：
# 1. 清理误提交的 .vitepress 备份目录
# 2. 迁移 docs 根目录散落文档到正确分类
# 3. 新增“内容质量审计清单”
# 4. 新增“OCR 当前状态与待补清单”
# 5. 新增“导航体系说明”
# 6. 给首页 / 按问题查资料追加维护入口
# 7. 重新生成侧边栏
#
# 注意：
# - 不删除“资料/”原始资料目录
# - 不自动 git commit / push
# - 运行后请用 VSCode Git UI 检查变更
# =========================================================

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
  Write-Host "OK  $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "WARN $msg" -ForegroundColor Yellow
}

function Ensure-Dir($path) {
  if (!(Test-Path $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
  }
}

function Rel-Path($fullPath) {
  $root = (Get-Location).Path
  return $fullPath.Replace($root + "\", "")
}

function Git-Move-OrMove($src, $dest) {
  if (!(Test-Path $src)) {
    Write-Warn "未找到：$src，跳过"
    return
  }

  Ensure-Dir (Split-Path $dest -Parent)

  if (Test-Path $dest) {
    Write-Warn "目标已存在：$dest，跳过迁移 $src"
    return
  }

  try {
    git mv "$src" "$dest"
    Write-Ok "已迁移：$src -> $dest"
  } catch {
    Move-Item -LiteralPath $src -Destination $dest
    Write-Ok "已移动：$src -> $dest"
  }
}

Write-Host ""
Write-Host "创游世界资料库：文档内容整理开始" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor DarkGray

# 0. 基础检查
Write-Step "检查项目根目录"

if (!(Test-Path "package.json")) {
  Write-Host "请在项目根目录运行本脚本。" -ForegroundColor Red
  exit 1
}

if (!(Test-Path "docs")) {
  Write-Host "未找到 docs 目录。" -ForegroundColor Red
  exit 1
}

Write-Ok "项目目录检查通过"

# 1. 清理误提交的 VitePress 备份目录
Write-Step "清理误提交的 VitePress 备份目录"

$bakDirs = Get-ChildItem -Path "docs" -Force -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like ".vitepress.bak.*" }

if ($bakDirs.Count -eq 0) {
  Write-Ok "没有发现 docs/.vitepress.bak.* 备份目录"
} else {
  foreach ($dir in $bakDirs) {
    $rel = Rel-Path $dir.FullName
    try {
      git rm -r -- "$rel"
      Write-Ok "已从 Git 移除备份目录：$rel"
    } catch {
      Remove-Item -LiteralPath $dir.FullName -Recurse -Force
      Write-Ok "已删除备份目录：$rel"
    }
  }
}

# 2. 迁移 docs 根目录散落文档
Write-Step "迁移 docs 根目录散落文档"

Git-Move-OrMove "docs\OCR 完整化推进清单.md" "docs\OCR资料\OCR 完整化推进清单.md"
Git-Move-OrMove "docs\知识库总索引.md" "docs\总索引与导航\知识库总索引.md"
Git-Move-OrMove "docs\知识库扩展复盘与完善路线图.md" "docs\维护与报告\知识库扩展复盘与完善路线图.md"

# 3. 新增内容质量审计清单
Write-Step "写入内容质量审计清单"

Ensure-Dir "docs\维护与报告"

@'
---
title: 内容质量审计清单
description: 用于记录创游世界资料库中重复、缺证据、缺入口、缺 frontmatter、格式不统一、待合并和待优化的文档问题。
category: 维护与报告
tags:
  - 创游世界
  - 内容审计
  - 维护
  - 文档质量
  - 知识库
status: 整理中
evidence: E3
---

# 内容质量审计清单

这个页面用于记录资料库中的内容质量问题，帮助后续持续优化。

它不是普通用户必读页面，而是维护者用来判断：

- 哪些文档需要合并
- 哪些文档需要补证据
- 哪些文档需要补 frontmatter
- 哪些文档需要改成站内链接
- 哪些文档需要改表格格式
- 哪些文档需要补“最小可做版本”
- 哪些导航入口需要更新

## 当前优先级

| 优先级 | 类型 | 说明 |
|---|---|---|
| P0 | 仓库清理 | 移除误提交的备份目录、构建产物和临时文件 |
| P1 | 入口整理 | 保证首页、按问题查资料、知识库总导航、分类导航层级清晰 |
| P2 | 链接规范 | 把文档中的 `docs/...md` 仓库路径逐步改为 VitePress 站内链接 |
| P3 | 证据回链 | 给 E3 研究结论补充 OCR、截图或原始资料来源 |
| P4 | 内容合并 | 合并重复报告、重复指南和版本过多的阶段性文档 |
| P5 | 教程增强 | 给实战文档补“最小可做版本、变量设计、广播设计、常见错误” |

## 待清理内容

| 位置 | 问题 | 建议处理 | 状态 |
|---|---|---|---|
| `docs/.vitepress.bak.*` | 备份目录不应进入仓库 | 删除并加入 `.gitignore` | 处理中 |
| `docs/OCR 完整化推进清单.md` | 根目录文档过多 | 移动到 `OCR资料` | 处理中 |
| `docs/知识库总索引.md` | 根目录文档过多 | 移动到 `总索引与导航` | 处理中 |
| `docs/知识库扩展复盘与完善路线图.md` | 根目录文档过多 | 移动到 `维护与报告` | 处理中 |

## 待合并或重构内容

| 范围 | 问题 | 建议处理 | 状态 |
|---|---|---|---|
| OCR资料 | V1/V2/V3 报告较多 | 新增“当前状态与待补清单”，历史报告作为归档 | 进行中 |
| 核心研究/联机相关 | 多个联机指南可能重复 | 建立联机系统阅读导航，明确入门、完全指南、速查卡关系 | 待处理 |
| 导航页 | 多个导航都承担总入口职责 | 明确：首页 → 按问题查资料 → 总导航 → 分类导航 → 具体文档 | 进行中 |
| 维护报告 | AI 建设报告版本较多 | 保留历史，增加当前状态和归档说明 | 待处理 |

## 待补证据内容

| 文档类型 | 当前问题 | 建议补充 | 状态 |
|---|---|---|---|
| 脚本系统相关专题 | 部分结论为 E3 归纳 | 补充 OCR 或截图来源回链 | 待处理 |
| 项目设计相关指南 | 方法论较多 | 补充“适用前提”和“限制说明” | 待处理 |
| AI/联机/存档等高级专题 | 可能存在推断内容 | 标记 E4 待验证段落 | 待处理 |
| OCR 总结页面 | 历史报告较多 | 建立当前状态页，减少用户迷路 | 进行中 |

## 待增强教程化内容

| 类型 | 建议增加模块 |
|---|---|
| 项目设计文档 | 最小可做版本、变量设计、广播设计、常见错误 |
| 脚本文档 | 积木使用场景、触发时机、错误案例、调试方法 |
| OCR 资料文档 | 原始内容、人工修正、对应专题、证据等级 |
| 导航文档 | 适合谁、先看什么、不适合谁、下一步去哪 |

## 表格格式检查

需要重点检查这些类型的内容：

- `系统 文档 说明`
- `误区 后果 正确做法`
- `文档 说明 适合阶段`
- `变量名 类型 作用`
- `广播名 触发方 接收方 作用`

如果显示成普通文本，应改为标准 Markdown 表格。

## 链接规范

推荐使用 VitePress 站内链接：

```md
[新手阅读路线](/总索引与导航/新手阅读路线)
