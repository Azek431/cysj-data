# Azek创游世界文档 UI 全量重构方案 v4.0

> **定位：Dark-first Precision Minimal（暗色优先的精密极简知识库 UI）**  
> **适用仓库：`Azek431/cysj-data`**  
> **实施原则：保留 VitePress DefaultTheme，不推倒重写；先审计、后迁移、再删除；用设计系统替代样式补丁。**

---

## 目录

1. [执行摘要](#1-执行摘要)  
2. [已核实的仓库基线](#2-已核实的仓库基线)  
3. [最终设计定位与视觉结果](#3-最终设计定位与视觉结果)  
4. [不可妥协的工程规则](#4-不可妥协的工程规则)  
5. [信息架构与用户路径](#5-信息架构与用户路径)  
6. [最终主题文件架构](#6-最终主题文件架构)  
7. [设计令牌系统](#7-设计令牌系统)  
8. [CSS 级联、选择器与维护规范](#8-css-级联选择器与维护规范)  
9. [首页重构规格](#9-首页重构规格)  
10. [文档页重构规格](#10-文档页重构规格)  
11. [自定义组件重构规格](#11-自定义组件重构规格)  
12. [代码块、表格、提示框与细节组件](#12-代码块表格提示框与细节组件)  
13. [暗色模式、一致性与可访问性](#13-暗色模式一致性与可访问性)  
14. [性能与动效策略](#14-性能与动效策略)  
15. [质量检查脚本重构](#15-质量检查脚本重构)  
16. [实施阶段与提交边界](#16-实施阶段与提交边界)  
17. [验收矩阵](#17-验收矩阵)  
18. [给 Claude Code 的最终执行提示词](#18-给-claude-code-的最终执行提示词)  
19. [权威依据与参考资料](#19-权威依据与参考资料)  

---

# 1. 执行摘要

这次重构的目标不是“以前很炫，现在更朴素”。

真正目标是：

```text
把一个样式不断叠加、装饰较多、维护成本逐渐上升的资料站，
重构为一套暗色优先、结构稳定、内容优先、可持续扩展的知识库主题系统。
```

最终站点应具备以下气质：

- **首页**：快速说明“这是什么、适合谁、从哪里开始”；
- **文档页**：安静、稳定、适合连续阅读；
- **导航**：不抢内容，但随时可找到入口；
- **暗色模式**：像深色纸张上的技术文档，而不是黑底蓝光页面；
- **组件**：只承担信息、导航和操作，不再承担装饰表演；
- **CSS**：从“补丁式文件叠加”收敛为“五个职责明确的模块”。

本次重构的硬目标：

```text
1. 主题 CSS 从旧 9 文件体系迁移到 5 文件体系。
2. 删除粒子、流光、背景呼吸、卡片浮起、正文入场动画等装饰性动态。
3. 静态内容模块不再使用阴影；只有临时浮层允许极轻阴影。
4. 暗色模式作为独立设计系统处理。
5. 保留 VitePress DefaultTheme 的搜索、目录、导航、移动端菜单和文档能力。
6. 通过 UI、CSS、构建、搜索索引与无障碍验证。
7. 不新增第三方 UI 依赖，不修改锁文件。
```

---

# 2. 已核实的仓库基线

> 以下基线来自公开主分支。实施时仍必须先盘点本地工作区，因为本地可能存在尚未推送的改动。

## 2.1 当前入口文件

当前 `docs/.vitepress/theme/index.ts` 仍按顺序导入旧 9 个 CSS 文件：

```text
cysj-design-tokens.css
cysj-typography.css
cysj-components.css
cysj-layout.css
cysj-custom-components.css
cysj-home.css
cysj-animations.css
cysj-performance.css
cysj-responsive.css
```

这意味着此次改造不是“新增几个新 CSS 文件”就结束，而是必须完成：

```text
旧文件内容审计
→ 新五文件迁移
→ index.ts 切换 import
→ 检查脚本切换 required / forbidden 规则
→ 构建与视觉验证
→ 删除旧文件
```

## 2.2 当前检查脚本风险

公开主分支的 `scripts/check-docs-ui.mjs` 当前仍会把以下内容作为必需文件：

```text
HomeParticles.vue
旧 9 个主题 CSS 文件
```

因此：

```text
不能先删除 HomeParticles.vue。
不能先删除旧 CSS。
不能只修改 index.ts。
```

必须先同步改检查脚本，否则删除后会造成质量检查失败。

## 2.3 当前首页结构

当前首页已使用 VitePress 默认首页能力：

```yaml
layout: home
hero:
features:
```

因此正确策略是：

```text
保留 VitePress 原生首页结构
→ 优先通过 Frontmatter、CSS Variables 和局部 CSS 重构
→ 仅在原生能力无法稳定满足时新增很小的本地辅助组件
```

不是重造一个 SPA 首页。

## 2.4 当前 CSS 健康检查问题

现有 CSS 健康检查会统计：

```text
主题 CSS 总体积
单文件大小
!important 使用量
backdrop-filter 使用量
```

此前的基线信息表明：

```text
主题 CSS 总量偏大
某些旧 CSS 文件中 !important 使用过多
```

因此本次成功不能仅以“页面看起来变好看”为标准，还应以：

```text
CSS 总量下降
!important 明显下降
装饰动画清零
静态 box-shadow 清零
职责边界更清晰
```

作为工程验收标准。

---

# 3. 最终设计定位与视觉结果

## 3.1 最终定位

名称：

```text
Dark-first Precision Minimal
暗色优先的精密极简知识库 UI
```

它不是“极简到什么都没有”，而是：

```text
用结构代替装饰；
用排版代替特效；
用语义色代替彩色堆叠；
用边框和留白代替静态阴影；
用明确的状态反馈代替表演式动画；
让首页负责导航，让文档页负责阅读。
```

## 3.2 改造前与改造后

| 项目 | 改造前倾向 | 改造后目标 |
|---|---|---|
| 首页 | 多个装饰与独立卡片 | 统一 Hero + 功能矩阵 + 清晰路径 |
| 动效 | 粒子、流光、浮起、入场 | 120ms–200ms 的状态反馈 |
| 颜色 | 多层蓝色 / 渐变 / 装饰色 | 中性灰 + 单一品牌蓝 |
| 阴影 | 卡片、模块、组件可能叠加 | 静态内容无阴影，浮层例外 |
| 暗色模式 | 可能接近浅色反转 | 近黑背景 + 深灰层级 + 柔和白字 |
| 侧栏当前项 | 渐变条或高强调背景 | 蓝色文字 + 左侧 2px 实线 |
| Feature | 多张漂浮卡片 | 一个整体功能矩阵 |
| 代码块 | 窗口装饰、渐变遮罩 | 边框、语言、复制、可读性 |
| 维护方式 | 多文件补丁式叠加 | 五模块设计系统 |

## 3.3 用户打开站点后应该感受到什么

### 首页第一屏

```text
──────────────────────────────────────────────────────

Azek创游世界文档

创游世界脚本、组件、UI 与项目设计知识库。
从新手入门，到可长期维护的项目结构。

[ 开始阅读 ]   [ 新手路线 ]   GitHub ↗

──────────────────────────────────────────────────────
```

用户应立即理解：

```text
1. 这是创游世界相关的中文知识库；
2. 这里不仅有新手教程，还有脚本、UI、项目设计和 OCR 资料；
3. 可以从“开始阅读”或“新手路线”直接进入；
4. GitHub 是辅助入口，不抢主操作。
```

### 文档页

```text
┌──────────────┬────────────────────────────────────┬──────────────┐
│ 侧边栏 240px │ 正文阅读区 720px–760px               │ 页面目录     │
│              │                                      │              │
│ 当前项蓝字   │ H1                                  │ 当前标题蓝色 │
│ 左侧 2px 线  │ 元信息条                             │              │
│              │ 正文、代码、表格、提示框             │              │
│              │ 上一页 / 下一页                      │              │
└──────────────┴────────────────────────────────────┴──────────────┘
```

用户应感到：

```text
内容是中心；
导航存在但不吵；
文本长时间阅读不累；
暗色模式稳定；
代码、表格、提示框都是阅读工具，而不是装饰物。
```

---

# 4. 不可妥协的工程规则

## 4.1 必须保留

必须继续基于：

```ts
import DefaultTheme from "vitepress/theme";
```

允许的改造方式：

```text
CSS 设计令牌
CSS 覆盖
DefaultTheme Layout 插槽
已有 Vue 辅助组件
必要的小型本地 Vue 组件
首页 Markdown / Frontmatter
质量检查脚本
```

必须保留并兼容：

```text
VitePress 默认顶栏
默认搜索
默认侧边栏
默认右侧目录
默认移动端菜单
默认上一页 / 下一页
编辑此页
主题切换
默认文档布局
SSR 构建
搜索索引
```

## 4.2 严禁

```text
重写整个 DefaultTheme
新增第三方 UI 框架
新增运行时依赖
新增外部字体
修改 pnpm-lock.yaml
粒子 Canvas
背景呼吸
渐变流光
按钮脉冲
卡片上浮
图标缩放
卡片扫光
正文入场动画
无限循环动画
全局 will-change
无差别 contain
translateZ(0) 假性能优化
大量 !important
全局泛选择器污染 VitePress
伪造代码文件名
为绕过检查保留空壳旧 CSS
```

不要无差别写：

```css
* {
  transition: all;
}

a {
  text-decoration: none;
}

button {
  border: 0;
}

h1 {
  font-size: 48px;
}
```

如果某条规则确有必要，必须：

```text
1. 限定在局部组件 class；
2. 解释为什么不能通过变量解决；
3. 确认不会破坏 VitePress 默认主题。
```

## 4.3 删除文件的硬规则

任何文件删除前必须满足：

```text
1. 已确认没有 import；
2. 已确认没有模板引用；
3. 已确认没有脚本动态引用；
4. 已确认检查脚本不再要求它存在；
5. 已确认替代内容已经迁入新架构；
6. 已运行构建验证。
```

---

# 5. 信息架构与用户路径

## 5.1 首页必须解决的四个问题

```text
这是什么？
适合谁？
从哪里开始？
资料在哪里？
```

首页不承担：

```text
炫技展示
历史报告堆叠
全部维护细节
大量独立卡片
隐藏关键入口
```

## 5.2 四条核心用户路径

| 用户意图 | 最短入口 | 首页展示方式 |
|---|---|---|
| 我是新手 | 新手路线 | 首屏 CTA + 功能矩阵 + 路径 01 |
| 我要学脚本 | 脚本系统 | 功能矩阵 + 路径 02 |
| 我要做项目 | 项目设计 | 功能矩阵 + 路径 03 |
| 我要核对资料 | OCR 资料 | 功能矩阵 + 路径 04 |
| 我要参与维护 | 维护规范 / GitHub | 功能矩阵 + 页尾入口 |

## 5.3 首页信息结构

推荐固定顺序：

```text
Hero
→ 功能矩阵
→ 这个资料库适合谁
→ 推荐阅读路径
→ 资料可信度说明
→ 快速入口
→ 维护说明与 GitHub 反馈
```

不要把“推荐阅读路径”默认折叠。

原因：

```text
极简不等于把重要信息藏起来。
核心导航应该在首屏以下直接可见。
折叠仅用于补充建议、前提条件、额外说明。
```

---

# 6. 最终主题文件架构

## 6.1 最终只保留五个主题 CSS 文件

```text
docs/.vitepress/theme/styles/tokens.css
docs/.vitepress/theme/styles/typography.css
docs/.vitepress/theme/styles/components.css
docs/.vitepress/theme/styles/layout.css
docs/.vitepress/theme/styles/custom.css
```

## 6.2 最终 index.ts

```ts
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

import "./styles/tokens.css";
import "./styles/typography.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/custom.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
```

加载顺序必须为：

```text
令牌
→ 排版
→ 通用组件
→ 页面布局
→ 自定义组件
```

## 6.3 文件职责

| 文件 | 职责 | 禁止放入 |
|---|---|---|
| `tokens.css` | 颜色、间距、圆角、字体权重、布局、焦点、层级、动效令牌、VitePress 变量映射 | 具体组件布局 |
| `typography.css` | 正文、标题、链接、列表、段落、图片说明、阅读宽度 | 导航、侧栏、卡片结构 |
| `components.css` | 代码块、表格、引用块、提示框、按钮、输入框、details | 顶栏、侧栏、首页栅格 |
| `layout.css` | 顶栏、侧栏、目录、页脚、Hero、Feature Matrix、响应式布局 | PageInfo / PageActions |
| `custom.css` | PageInfo、PageActions、SiteTools、ReadingProgress、首页辅助组件 | 全局排版和主页面框架 |

## 6.4 旧文件迁移映射

先基于本地真实文件确认，默认迁移如下：

| 旧文件内容 | 新文件去向 |
|---|---|
| `cysj-design-tokens.css` | `tokens.css` |
| `cysj-typography.css` | `typography.css` |
| `cysj-components.css` | `components.css` |
| `cysj-layout.css` | `layout.css` |
| `cysj-home.css` | `layout.css` |
| `cysj-custom-components.css` | `custom.css` |
| `cysj-animations.css` | 删除装饰动画，仅保留必要过渡并迁入对应文件 |
| `cysj-performance.css` | 大部分删除，只保留已验证必要规则 |
| `cysj-responsive.css` | 分拆回 typography/components/layout/custom |

完成后：

```text
旧 9 个 CSS 文件全部删除。
新旧两套体系不得长期共存。
```

---

# 7. 设计令牌系统

## 7.1 令牌原则

所有以下值必须来自令牌：

```text
颜色
间距
圆角
字体权重
布局宽度
速度
缓动曲线
焦点
层级
```

不要在新 CSS 中随意写：

```css
padding: 13px;
border-radius: 14px;
color: #64748b;
transition: 240ms;
```

除非是已解释的特殊值。

## 7.2 tokens.css 推荐内容

```css
:root {
  color-scheme: light;

  /* Surface */
  --cysj-surface-0: #fafafa;
  --cysj-surface-1: #ffffff;
  --cysj-surface-2: #f5f5f5;
  --cysj-surface-code: #f5f5f5;

  /* Text */
  --cysj-text-1: #111111;
  --cysj-text-2: #555555;
  --cysj-text-3: #737373;
  --cysj-text-faint: #888888;

  /* Border */
  --cysj-border: #e5e5e5;
  --cysj-border-strong: #d4d4d4;

  /* Brand */
  --cysj-brand: #2563eb;
  --cysj-brand-hover: #1d4ed8;
  --cysj-brand-soft: rgb(37 99 235 / 0.06);

  /* Focus */
  --cysj-focus: #1d4ed8;
  --cysj-focus-ring: rgb(37 99 235 / 0.28);
  --cysj-focus-width: 2px;
  --cysj-focus-offset: 2px;

  /* Radius */
  --cysj-radius-sm: 4px;
  --cysj-radius-md: 6px;
  --cysj-radius-lg: 8px;
  --cysj-radius-xl: 12px;
  --cysj-radius-pill: 999px;

  /* Spacing */
  --cysj-space-1: 4px;
  --cysj-space-2: 8px;
  --cysj-space-3: 12px;
  --cysj-space-4: 16px;
  --cysj-space-5: 20px;
  --cysj-space-6: 24px;
  --cysj-space-8: 32px;
  --cysj-space-10: 40px;
  --cysj-space-12: 48px;
  --cysj-space-16: 64px;

  /* Font weights */
  --cysj-font-weight-regular: 400;
  --cysj-font-weight-medium: 500;
  --cysj-font-weight-semibold: 600;
  --cysj-font-weight-bold: 700;

  /* Layout */
  --cysj-content-width: 760px;
  --cysj-home-width: 1080px;
  --cysj-sidebar-width: 240px;
  --cysj-nav-height: 56px;

  /* Motion */
  --cysj-speed-fast: 120ms;
  --cysj-speed-normal: 160ms;
  --cysj-speed-slow: 200ms;
  --cysj-ease: cubic-bezier(0.2, 0, 0, 1);

  /* Stacking */
  --cysj-z-header: 20;
  --cysj-z-sidebar: 30;
  --cysj-z-overlay: 50;
  --cysj-z-modal: 100;

  /* Only for temporary overlays */
  --cysj-shadow-overlay: 0 12px 32px rgb(0 0 0 / 0.18);

  /* VitePress mapping */
  --vp-c-bg: var(--cysj-surface-0);
  --vp-c-bg-alt: var(--cysj-surface-1);
  --vp-c-bg-elv: var(--cysj-surface-1);
  --vp-c-bg-soft: var(--cysj-surface-2);
  --vp-c-bg-mute: var(--cysj-surface-2);

  --vp-c-text-1: var(--cysj-text-1);
  --vp-c-text-2: var(--cysj-text-2);
  --vp-c-text-3: var(--cysj-text-3);

  --vp-c-brand-1: var(--cysj-brand);
  --vp-c-brand-2: var(--cysj-brand-hover);
  --vp-c-brand-3: var(--cysj-brand-hover);
  --vp-c-brand-soft: var(--cysj-brand-soft);

  --vp-c-divider: var(--cysj-border);
  --vp-c-divider-light: var(--cysj-border);

  --vp-code-bg: var(--cysj-surface-code);
  --vp-nav-height: var(--cysj-nav-height);
}
```

## 7.3 深色模式

先确认 `.dark` 实际挂载位置，再使用正确选择器。推荐：

```css
:root.dark {
  color-scheme: dark;

  --cysj-surface-0: #0a0a0a;
  --cysj-surface-1: #101010;
  --cysj-surface-2: #141414;
  --cysj-surface-code: #141414;

  --cysj-text-1: #ededed;
  --cysj-text-2: #aaaaaa;
  --cysj-text-3: #7a7a7a;
  --cysj-text-faint: #777777;

  --cysj-border: #222222;
  --cysj-border-strong: #303030;

  --cysj-brand: #4d9de6;
  --cysj-brand-hover: #72b8f3;
  --cysj-brand-soft: rgb(77 157 230 / 0.11);

  --cysj-focus: #82c4ff;
  --cysj-focus-ring: rgb(130 196 255 / 0.28);
}
```

## 7.4 令牌使用边界

| 令牌 | 可用 | 禁止 |
|---|---|---|
| `text-1` | 标题、正文、关键导航 | 装饰性弱文本 |
| `text-2` | 描述、元信息、辅助说明 | 隐藏型装饰 |
| `text-3` | 仍需阅读的辅助文字 | 主正文 |
| `text-faint` | 分隔符、装饰图标、无关键信息元素 | 日期、按钮、导航、表格、链接、状态文本 |
| `brand` | 主按钮、当前导航、焦点、关键链接 | 大面积页面背景 |
| `brand-soft` | Hover、轻提示、表头淡底 | 承载主要内容 |
| `shadow-overlay` | 搜索弹层、下拉菜单、移动抽屉 | 静态卡片、正文、表格、代码块 |

---

# 8. CSS 级联、选择器与维护规范

## 8.1 不把整套覆盖样式放进 @layer

本次不要把所有 VitePress 覆盖样式统一包进命名 `@layer`。

理由：

```text
VitePress 默认主题的选择器与加载顺序需要稳定兼容。
将所有自定义覆盖放进普通命名层，可能导致未分层默认样式优先级更高。
这会迫使后续出现更多 !important，反而违背重构目标。
```

正确优先级：

```text
VitePress CSS Variables
→ 局部组件 class
→ 低复杂度 VitePress 结构选择器
→ 极少量必要 !important
```

## 8.2 选择器规范

优先：

```css
.VPDoc .vp-doc h2
.VPNav
.VPSidebar
.VPFeature
.cysj-page-info
.cysj-page-actions
.cysj-site-tools
```

避免：

```css
h2 {}
a {}
button {}
table {}
div {}
* {}
```

规则：

```text
不写超长嵌套选择器；
不使用 transition: all；
不使用无限动画；
静态内容区不使用 box-shadow；
不使用无意义 !important。
```

## 8.3 !important 预算

最终建议：

```text
警告：超过 8 次
失败：超过 20 次
```

每次使用必须满足：

```text
1. VitePress 原生规则无法通过变量和选择器顺序覆盖；
2. 选择器不能合理增强而不破坏维护性；
3. 使用范围局部；
4. 同文件旁边有简短说明。
```

---

# 9. 首页重构规格

## 9.1 Hero 内容

推荐 `docs/index.md` 保持使用 VitePress 原生首页字段。

推荐结构：

```yaml
---
layout: home
pageClass: cysj-home-page
title: Azek创游世界文档
description: Azek431 整理维护的创游世界中文知识库，收录脚本、组件、UI、项目设计、OCR 证据、新手路线与维护规范。

hero:
  name: Azek创游世界文档
  text: 创游世界脚本、组件、UI 与项目设计知识库
  tagline: 从新手入门，到可长期维护的项目结构。
  actions:
    - theme: brand
      text: 开始阅读
      link: /总索引与导航/创游世界知识库总导航
    - theme: alt
      text: 新手路线
      link: /总索引与导航/新手阅读路线
---
```

说明：

```text
保留品牌名为 hero.name。
将 hero.text 控制为更短的价值说明。
将 tagline 控制为一行或最多两行。
GitHub 不再作为第三个与主按钮同等级的按钮。
```

GitHub 应显示为：

```text
GitHub ↗
```

位置：

```text
Hero 主按钮组之后；
低强调文字链接；
不抢占“开始阅读”和“新手路线”的视觉层级。
```

如果原生首页无法稳定插入，允许新增一个极小的：

```text
docs/.vitepress/theme/components/HomeHeroMetaLink.vue
```

它只负责 GitHub 链接。

## 9.2 Hero 视觉规范

```text
背景：
浅色 #fafafa
深色 #0a0a0a

标题：
无渐变
无阴影
无光晕
无流光
无描边

主按钮：
品牌蓝实心
无阴影
Hover 仅改变颜色和边框状态

次按钮：
透明背景
1px 边框
Hover 变为 brand-soft

GitHub：
纯文字链接
不作为第三个强调按钮
```

尺寸：

```text
桌面上下留白：64px–88px
平板上下留白：48px–64px
手机上下留白：40px–48px
Hero 最大宽度：760px
tagline 最大宽度：540px
```

## 9.3 Feature Matrix

优先使用 VitePress 原生 `features`。

图标规范：

```text
本地 SVG；
目录：docs/public/icons/features/；
统一线性风格；
统一 viewBox；
统一线宽；
不使用 Emoji；
不使用第三方图标包；
装饰 SVG 使用 aria-hidden="true"；
标题和链接承担真实语义。
```

六个功能模块：

| 模块 | 描述 | 链接 |
|---|---|---|
| 新手路线 | 从编辑器基础、脚本入门到项目结构，按顺序进入资料库。 | 查看路线 → |
| 脚本系统 | 变量、广播、积木、组件、作用域与数据流。 | 查看脚本 → |
| UI 设计 | 控件、页面、交互反馈与广播驱动界面设计。 | 查看 UI → |
| 项目设计 | 架构、玩法、系统组织与完整项目设计思路。 | 查看设计 → |
| OCR 资料 | 原始截图、文字识别、编号映射与证据链。 | 查看 OCR → |
| 维护规范 | 质量检查、资料状态、维护流程与贡献入口。 | 查看规范 → |

视觉结构：

```text
┌────────────────────────────────────────────────────┐
│ 新手路线          脚本系统          UI 设计         │
│ 描述              描述              描述            │
│ 查看路线 →         查看脚本 →         查看 UI →       │
├────────────────────────────────────────────────────┤
│ 项目设计          OCR 资料           维护规范        │
│ 描述              描述              描述            │
│ 查看设计 →         查看 OCR →         查看规范 →      │
└────────────────────────────────────────────────────┘
```

推荐 CSS 结构：

```css
.VPFeatures .container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--cysj-border);
  border-radius: var(--cysj-radius-lg);
  background: var(--cysj-border);
}

.VPFeatures .item {
  min-width: 0;
  padding: 0;
}

.VPFeature {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: var(--cysj-surface-1);
  box-shadow: none;
}
```

响应式：

```text
桌面：3 列 × 2 行
平板：2 列 × 3 行
手机：1 列 × 6 行
```

Hover 只允许：

```text
背景 → brand-soft
标题 → brand
链接 → brand
边框视觉 → 轻微变化
```

禁止：

```text
translateY
scale
box-shadow
扫光
渐变
```

## 9.4 首页正文

固定结构：

```text
01 这个资料库适合谁
02 推荐阅读路径
03 资料可信度说明
04 快速入口
05 维护与反馈
```

### 01 这个资料库适合谁

```text
- 想从零学习创游世界的新手；
- 想查变量、广播、积木、组件和 UI 机制的人；
- 想做完整项目、系统设计和玩法架构的人；
- 想核对 OCR 原始资料和证据链的人；
- 想参与内容维护、修正和资料补全的人。
```

### 02 推荐阅读路径

核心路径默认可见：

```text
01 新手入门
从编辑器基础、知识库总导航和官方教程开始。
新手阅读路线 →

02 脚本与积木
理解变量、广播、作用域、组件与系统级能力。
脚本系统 →

03 项目设计
从作品结构、玩法系统到商店、背包、地图和存档。
项目设计 →

04 OCR 与证据
查看原始截图、识别文本、证据等级和待补清单。
OCR资料 →
```

可折叠内容仅用于补充：

```md
::: details 阅读建议
补充建议、适用前提、注意事项。
:::
```

### 03 资料可信度说明

| 类型 | 含义 |
|---|---|
| 原始资料 | 来自截图、OCR、界面内容或原始记录 |
| 整理资料 | 对多个原始信息进行归纳、分类和结构化 |
| 研究结论 | 基于现有资料进行分析、推理和总结 |
| 待验证内容 | 暂时无法完全确认，后续需要继续补证 |

表格后文字：

```text
有来源、有状态、可追溯、可继续维护。
```

### 04 快速入口

改为紧凑文字链接：

```text
新手路线 · 知识库总导航 · 脚本系统 · 项目设计 · OCR资料 · 维护与报告
```

不要继续使用大表格或大块卡片。

---

# 10. 文档页重构规格

## 10.1 布局

```text
┌──────────────┬────────────────────────────────────┬──────────────┐
│ 侧边栏 240px │ 正文阅读区 720px–760px               │ 页面目录     │
│              │                                      │              │
│ 当前项蓝字   │ H1                                  │ 当前标题蓝色 │
│ 左侧 2px 线  │ PageInfo                            │              │
│              │ 正文、代码、表格、提示框             │              │
│              │ 上一页 / 下一页                      │              │
└──────────────┴────────────────────────────────────┴──────────────┘
```

正文：

```css
max-width: var(--cysj-content-width);
```

规则：

```text
普通正文不超过 760px；
代码块、表格、图片可在必要时扩展；
正文不套独立卡片；
页面背景不加纹理；
长文不应在超宽屏上变成过宽行。
```

## 10.2 顶栏

```text
高度：56px
背景：surface-0
底部：1px solid border
静态阴影：无
```

规则：

```text
品牌区域紧凑；
导航不抢内容；
活跃导航只使用文字色、细下划线、极淡背景中的一项或两项；
下拉菜单可使用 overlay shadow；
搜索继续保留在默认导航体系。
```

## 10.3 侧边栏

```text
宽度：240px
背景：与页面统一
静态阴影：无
分隔：1px border
```

当前项：

```text
文字：品牌蓝
左侧：2px 实心品牌蓝线
背景：透明或极淡 brand-soft
```

实现建议：

```text
左侧线用绝对定位伪元素；
避免 border 导致文字横向抖动；
中文分组标题不要强制 uppercase；
分组标题 11px–12px；
不使用渐变条；
不使用大面积蓝色选中背景。
```

## 10.4 右侧目录

```text
当前标题：品牌蓝
非当前标题：text-3
外壳：无卡片
阴影：无
高亮：不使用大面积背景
```

## 10.5 PageInfo.vue

目标：

```text
创建于 2026-01-15 · 更新于 2026-07-01 · 3,200 字 · ~7 分钟阅读        Azek431 ↗
```

规则：

```text
无彩色标签；
无卡片背景；
无维护者悬浮卡；
上下只有细边框；
作者直接链接 GitHub；
数据必须来自真实页面信息；
不存在的数据不输出占位符；
手机端自然换为两行；
已有状态、难度、证据等级若保留，改为低干扰文字。
```

布局：

```text
桌面：
左侧：创建 / 更新 / 字数 / 阅读时间
右侧：维护者链接

手机：
第一行：创建 / 更新 / 字数 / 阅读时间
第二行：维护者链接
```

## 10.6 PageActions.vue 与默认分页

保留 VitePress 默认 pager，不重造分页逻辑。

视觉目标：

```text
────────────────────────────────────────
← 上一页                       下一页 →
────────────────────────────────────────

编辑此页 · 反馈建议 · 复制链接
```

规则：

```text
上一页 / 下一页是主导航；
编辑 / 反馈 / 复制是次级文字操作；
不使用胶囊按钮；
不使用静态阴影；
复制成功使用低干扰状态文字；
可使用 aria-live="polite"；
禁止 alert()。
```

必须验证顺序：

```text
正文
→ 默认上一页 / 下一页
→ PageActions
→ 其他页脚信息
```

---

# 11. 自定义组件重构规格

## 11.1 Layout.vue

先读取真实 `Layout.vue` 并确认现有插槽。

目标结构接近：

```vue
<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <PageInfo />
    </template>

    <template #aside-top>
      <SiteTools v-if="shouldShowSiteTools" />
    </template>

    <template #doc-after>
      <PageActions />
    </template>
  </DefaultTheme.Layout>
</template>
```

规则：

```text
不破坏 DefaultTheme 默认插槽；
首页不显示 PageInfo；
404、搜索、归档类页面不显示文档专属组件；
所有 runtime DOM 操作必须 SSR 安全；
组件卸载时清理监听器。
```

## 11.2 SiteTools.vue

只有在本地真实存在且确有导航价值时保留。

目标：

```text
GitHub · 新手路线 · 总目录 · OCR
```

语义：

```html
<nav aria-label="站点工具">
```

规则：

```text
一行紧凑文字链接；
可带小型 inline SVG；
无卡片；
无额外标题；
无按钮背景；
小屏幕自然换行；
若与顶栏或侧栏高度重复，则删除而不是强行保留。
```

## 11.3 ReadingProgress.vue

阅读进度条是可选功能，不是第一优先级。

处理流程：

```text
先检查是否真实存在；
存在但未挂载、无实际价值或只是装饰时，可以删除；
若最终保留或新增，必须只在文档页显示。
```

若保留：

```text
位置：导航栏下方；
高度：2px；
颜色：纯品牌色；
渐变：无；
发光：无；
手机：不显示百分比；
aria-live：不使用；
滚动：不制造读屏干扰；
路由切换后：正确重算；
onMounted 后才访问 window / document；
onUnmounted 必须清理监听器。
```

不得显示在：

```text
首页
404
搜索页
归档页
维护报告目录
非文档 layout 页面
```

## 11.4 HomeParticles.vue

删除流程：

```text
查引用
→ 若有引用：先删除 import、模板节点、关联 CSS
→ 更新检查脚本
→ 构建验证
→ 删除组件文件

若无引用：
→ 更新检查脚本
→ 删除组件文件
→ 构建验证
```

禁止：

```text
保留空组件；
保留无效 import；
保留粒子 CSS；
保留 Canvas 初始化逻辑；
用另一种装饰动画替代粒子。
```

---

# 12. 代码块、表格、提示框与细节组件

## 12.1 代码块

目标：

```text
┌─────────────────────────────────────────────┐
│ TypeScript                           复制     │
├─────────────────────────────────────────────┤
│ const value = 1;                             │
│ ...                                         │
└─────────────────────────────────────────────┘
```

规则：

```text
删除 macOS 三色装饰点；
删除渐变遮罩；
删除静态阴影；
背景：surface-code；
边框：1px solid border；
圆角：6px；
保留复制代码；
保留现有行号能力；
保留高亮行 / diff / focus 行；
普通代码块显示语言；
只有显式提供文件名时才显示文件名；
禁止 CSS 伪造文件名。
```

普通代码：

````md
```ts
const value = 1;
```
````

只显示：

```text
TypeScript
```

文件名优先使用 VitePress Code Group：

````md
::: code-group

```ts [utils/formatDate.ts]
export function formatDate() {}
```

:::
````

移动端：

```text
代码块内部横向滚动：允许
页面整体横向滚动：禁止
```

## 12.2 行内代码

```css
.vp-doc :not(pre) > code {
  padding: 0.1em 0.32em;
  border: 1px solid var(--cysj-border);
  border-radius: var(--cysj-radius-sm);
  background: var(--cysj-surface-2);
  font-size: 0.9em;
}
```

规则：

```text
不使用高饱和背景；
不使用粗边框；
不使用阴影；
保持与正文的稳定对比度。
```

## 12.3 表格

规则：

```text
1px 细边框；
表头使用极淡 brand-soft；
不使用斑马纹；
不使用整行 hover 高亮；
单元格内边距约 10px 12px；
手机端使用内部横向滚动容器；
表格不得撑出页面；
表头和数据必须清晰可读。
```

## 12.4 引用块与提示框

普通引用块：

```text
左边框：3px 中性灰
背景：透明或极淡 surface-2
圆角：6px
阴影：无
```

VitePress 容器：

```text
info
tip
warning
danger
```

规则：

```text
保留语义色；
保留标题或语义文字；
不能只依赖颜色区分；
背景更淡；
左侧竖条更细；
不使用大圆角；
不使用阴影。
```

## 12.5 details / summary

规则：

```text
默认关闭；
summary 点击区域明确；
展开图标轻量；
只保留 120ms–160ms 状态反馈；
不使用大动画；
核心入口和主要阅读路线不得默认隐藏。
```

---

# 13. 暗色模式、一致性与可访问性

## 13.1 暗色模式视觉方向

暗色模式应该像：

```text
深色纸张上的技术文档
```

而不是：

```text
黑底 + 发光蓝 + 霓虹边框的科技页面
```

## 13.2 深色层级

```text
页面背景：#0a0a0a
普通表面：#101010
代码 / 次级表面：#141414
边框：#222222
加强边框：#303030
主要文字：#ededed
次级文字：#aaaaaa
辅助文字：#7a7a7a
品牌蓝：#4d9de6
```

## 13.3 深色模式规则

```text
不使用纯白正文；
不使用荧光蓝；
静态内容不靠阴影浮起；
代码块比页面背景亮一级；
表格和提示框不堆叠过多深色层；
只有临时浮层可使用 overlay shadow；
自定义滚动条低存在感；
使用 color-scheme 保持原生控件适配；
不使用 prefers-color-scheme 覆盖用户手动选择。
```

## 13.4 对比度规范

| 内容 | 最低目标 |
|---|---|
| 正文与背景 | 4.5:1 |
| 重要元信息 | 尽量达到 4.5:1 |
| 非文字 UI 边框 / 焦点 | 3:1 |
| 大标题 | 至少 3:1，优先更高 |
| 焦点轮廓 | 至少 3:1，且清晰可见 |

规则：

```text
text-faint 不用于关键内容；
当前项不能只依赖蓝色；
当前导航除蓝色外还要有左侧线或结构变化；
warning / danger 除颜色外要保留文字；
正文链接不能只依赖颜色。
```

## 13.5 键盘导航

必须测试：

```text
Tab
Shift + Tab
Enter
Space
Esc
```

重点区域：

```text
顶栏导航
下拉菜单
搜索入口
侧栏折叠
主题切换
Feature Matrix
details
代码复制
编辑此页
复制链接
上一页 / 下一页
移动端菜单
```

禁止：

```text
焦点被顶栏遮住；
焦点进入隐藏内容；
焦点顺序异常；
主要信息仅 hover 可见；
键盘无法关闭弹层。
```

## 13.6 触控目标尺寸与重排

目标：

```text
图标按钮最低 36px × 36px；
手机主要控制尽量达到 40px × 40px；
正文相邻链接不能挤得过近。
```

必须测试：

```text
320px
375px
768px
1024px
1440px
浏览器 200% 缩放
```

允许内部滚动：

```text
宽表格
长代码块
特殊图表
```

禁止：

```text
页面整体横向滚动；
正文被侧栏遮挡；
固定顶栏遮住标题；
按钮文字被裁切；
Feature Matrix 边框断裂。
```

---

# 14. 性能与动效策略

## 14.1 完全删除

```text
粒子
Canvas 装饰
背景呼吸
渐变流光
按钮脉冲
卡片上浮
图标缩放
卡片扫光
正文入场动画
无限循环动画
常驻 will-change
无差别 contain
translateZ(0)
```

## 14.2 只保留状态反馈

| 行为 | 时长 |
|---|---|
| 颜色变化 | 120ms |
| 边框变化 | 120ms |
| 下拉菜单出现 | 160ms |
| 抽屉打开 | 160ms–200ms |
| 主题颜色变化 | 120ms–160ms |
| 焦点状态 | 即时或极短 |

禁止：

```css
transition: all;
animation: infinite;
will-change: transform;
```

## 14.3 reduced motion

加入：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto;
    transition-duration: 0.01ms;
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
```

要求：

```text
不影响菜单打开；
不影响 details 展开；
不影响主题切换；
不影响可用性；
只降低非必要运动。
```

## 14.4 will-change 与 containment

规则：

```text
默认不使用；
只有性能分析明确证明需要时才允许局部使用；
若使用必须有注释说明；
不得长期给静态元素设置；
content-visibility 和 contain 不用于正文主区域；
不能为了“看起来专业”而加入性能属性。
```

---

# 15. 质量检查脚本重构

## 15.1 check-docs-ui.mjs

最终 `requiredFiles` 应只包含真实需要的文件，例如：

```text
docs/.vitepress/theme/index.ts
docs/.vitepress/theme/Layout.vue
docs/.vitepress/theme/components/PageInfo.vue
docs/.vitepress/theme/components/PageActions.vue
docs/.vitepress/theme/styles/tokens.css
docs/.vitepress/theme/styles/typography.css
docs/.vitepress/theme/styles/components.css
docs/.vitepress/theme/styles/layout.css
docs/.vitepress/theme/styles/custom.css
docs/public/_headers
docs/public/llms.txt
docs/public/robots.txt
```

以下只在最终真实挂载时才要求存在：

```text
SiteTools.vue
ReadingProgress.vue
HomeHeroMetaLink.vue
```

旧文件应成为 forbidden：

```text
docs/.vitepress/theme/styles/cysj-design-tokens.css
docs/.vitepress/theme/styles/cysj-typography.css
docs/.vitepress/theme/styles/cysj-components.css
docs/.vitepress/theme/styles/cysj-layout.css
docs/.vitepress/theme/styles/cysj-custom-components.css
docs/.vitepress/theme/styles/cysj-home.css
docs/.vitepress/theme/styles/cysj-animations.css
docs/.vitepress/theme/styles/cysj-performance.css
docs/.vitepress/theme/styles/cysj-responsive.css
docs/.vitepress/theme/components/HomeParticles.vue
docs/.vitepress/theme/styles/cysj-pro.css
docs/.vitepress/theme/styles/cysj-mobile.css
docs/.vitepress/theme/styles/cysj-ambient.css
docs/.vitepress/theme/styles/cysj-ultimate.css
docs/.vitepress/theme/styles/premium-ui.css
docs/.vitepress/theme/styles/polish.css
docs/.vitepress/theme/styles/polish-v3.css
docs/.vitepress/theme/styles/polish-v4.css
docs/.vitepress/theme/styles/minimal-doc-ui.css
docs/.vitepress/theme/styles/page-meta-compact.css
```

规则：

```text
迁移中途不得要求新旧文件同时存在；
不得为通过检查保留空文件；
检查脚本更新与旧文件删除必须同一轮完成。
```

## 15.2 check-css-health.mjs

建议升级为：

```text
单个 CSS 文件硬上限：40 KiB
主题 CSS 总量警告：80 KiB
主题 CSS 总量失败：100 KiB
!important 警告：超过 8 次
!important 失败：超过 20 次
backdrop-filter：任何使用都警告
will-change：任何使用都警告
contain / content-visibility：任何使用都警告
transition: all：直接失败
无限 animation：直接失败
粒子 / canvas 装饰关键词：直接失败
```

静态阴影规则：

```text
box-shadow 只允许用于：
- 搜索弹层
- 下拉菜单
- 移动端抽屉
```

允许的 overlay 阴影必须有注释：

```css
/* cysj-allow-overlay-shadow */
```

检查脚本只能放行带此注释的必要位置。

---

# 16. 实施阶段与提交边界

## Phase 0：基线与盘点

```text
1. 执行所有盘点命令。
2. 保存 docs:ui:check 与 docs:css:check 输出。
3. 记录 CSS 总大小、!important 数量、动画数量、组件清单、Layout 插槽。
4. 运行生产构建，确认原始状态正常。
```

## Phase 1：令牌与基础架构

```text
1. 创建五个新 CSS 文件。
2. 编写浅色 / 深色令牌。
3. 映射 VitePress CSS Variables。
4. 更新 index.ts。
5. 旧文件暂时保留但不再 import。
6. 构建确认新令牌生效。
```

目标：

```text
先让全站统一、稳定、干净、可读。
不要先做复杂首页效果。
```

## Phase 2：文档阅读体验

```text
1. 重写 typography.css。
2. 重写 components.css。
3. 删除渐变标题竖条。
4. 删除 macOS 代码块装饰。
5. 删除代码块渐变遮罩。
6. 去除表格斑马纹。
7. 去除静态组件阴影。
8. 修复手机端代码块与表格溢出。
```

目标：

```text
先把文章阅读体验做到稳定，再处理首页视觉。
```

## Phase 3：导航与布局

```text
1. 重写顶栏。
2. 顶栏改为 56px。
3. 侧栏改为 240px。
4. 当前项改为蓝字 + 左侧 2px 实线。
5. 清理渐变条、阴影、过度背景。
6. 检查移动端抽屉。
7. 检查顶栏、目录、侧栏、正文层级。
```

## Phase 4：首页

```text
1. 调整 docs/index.md Hero。
2. 增加低强调 GitHub 文字链接。
3. 把 Feature 改为统一 Matrix。
4. 替换 Emoji 为本地 SVG。
5. 重写首页正文结构。
6. 保证推荐阅读路径默认可见。
7. 快速入口改为文字导航。
8. 删除首页动画相关 CSS。
```

目标：

```text
用户在 5 秒内理解：
这里是什么、适合谁、从哪里开始、资料在哪里。
```

## Phase 5：组件与死代码清理

```text
1. 重构 PageInfo。
2. 重构 PageActions。
3. 根据真实情况处理 SiteTools。
4. 判断是否保留 ReadingProgress。
5. 删除 HomeParticles。
6. 清理旧组件样式、import 和检查规则。
7. 删除确认废弃的旧 CSS。
```

## Phase 6：质量检查与视觉打磨

```text
1. 更新 UI 检查脚本。
2. 更新 CSS 健康检查。
3. 修复全部 CSS 健康警告。
4. 测试浅色、深色、手机端、键盘导航。
5. 测试搜索、目录、上一页下一页、编辑链接。
6. 构建并检查搜索索引。
7. 最后再调节细微颜色、间距和文案。
```

---

# 17. 验收矩阵

## 17.1 必须执行的命令

```powershell
pnpm run docs:ui:check
pnpm run docs:css:check
pnpm run quality:check
pnpm run docs:check:light
pnpm run docs:build
pnpm run docs:search-index:dist

git diff --check
git status --short
```

## 17.2 浏览器验证

```text
浅色模式
深色模式
320px
375px
768px
1024px
1440px
浏览器 200% 缩放
Tab 键盘导航
移动端抽屉
搜索
复制代码
复制链接
上一页 / 下一页
编辑此页
首页 Feature Matrix
```

## 17.3 最终清单

### 构建与脚本

- [ ] `docs:ui:check` 通过。
- [ ] `docs:css:check` 通过。
- [ ] `quality:check` 通过。
- [ ] `docs:check:light` 通过。
- [ ] `docs:build` 通过。
- [ ] `docs:search-index:dist` 通过。
- [ ] `git diff --check` 无错误。
- [ ] 不新增第三方依赖。
- [ ] 不修改 lockfile。
- [ ] 没有旧 CSS import。
- [ ] 没有 HomeParticles 引用。
- [ ] 生成目录未被 Git 跟踪。

### 视觉与结构

- [ ] 首页无粒子、无流光、无渐变文字、无背景呼吸。
- [ ] 首页品牌名为 `Azek创游世界文档`。
- [ ] Feature Matrix 在桌面、平板、手机都边框整齐。
- [ ] 静态卡片无阴影。
- [ ] 代码块无 macOS 三色点、无阴影、无渐变遮罩。
- [ ] 侧栏当前项为蓝字 + 左侧实线。
- [ ] 顶栏高度为 56px。
- [ ] 正文宽度适合长文阅读。
- [ ] 暗色模式不是黑底蓝光。
- [ ] 页面无整体横向滚动。

### 无障碍

- [ ] 所有关键交互可通过键盘操作。
- [ ] 所有焦点状态清晰可见。
- [ ] 焦点不被顶栏遮住。
- [ ] 关键链接名称明确。
- [ ] 不存在大量无法区分的单独“→”链接。
- [ ] 颜色不是唯一的信息区分方式。
- [ ] 320px 下无页面二维滚动。
- [ ] 200% 缩放下无功能丢失。
- [ ] 图标按钮触摸面积足够。
- [ ] reduced motion 下不保留装饰动画。

---
