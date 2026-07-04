# Project Overview — 创游世界资料汇总

## Structure

```text
cysj-data/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts            # VitePress 主配置（站点名、SEO、sitemap、RSS）
│   │   ├── theme/
│   │   │   ├── index.ts          # 主题入口（5 个 CSS 文件）
│   │   │   ├── Layout.vue        # 根布局组件（无粒子动画）
│   │   │   ├── components/       # 自定义组件（PageInfo, PageActions, SiteTools, ReadingProgress）
│   │   │   └── styles/           # 5 层 CSS 架构（重构后）
│   │   │       ├── tokens.css       # 设计令牌（颜色/间距/圆角/动效/布局）
│   │   │       ├── typography.css   # 全局字体、标题、段落
│   │   │       ├── components.css   # 代码块、引用块、表格
│   │   │       ├── layout.css       # 导航栏、侧边栏、分页、首页区块、响应式
│   │   │       └── custom.css       # PageInfo、PageActions、SiteTools、ReadingProgress
│   │   └── public/             # 静态资源（favicon, robots.txt）
│   ├── index.md                # 首页
│   └── ...                     # 210+ 个 .md 页面
├── scripts/                    # 自动化脚本（25+ 个）
├── .serena/                    # Serena 项目管理
└── package.json
```

## Key Facts

- **框架**: VitePress 1.6.4（基于 Vue 3 + Vite）
- **内容**: 创游世界（CYWorld）游戏开发引擎的中文知识库
- **主题**: CYSJ 现代极简设计系统，中性灰 + 品牌蓝，暗色优先
- **CSS 架构**: 5 层（令牌→排版→组件→布局→自定义组件），从旧 9 层精简
- **暗色模式**: 独立设计系统，`#0a0a0a` 背景，沉稳蓝 `#4d9de6`
- **SEO**: sitemap + RSS + Open Graph + JSON-LD
- **SSR**: 元数据通过 transformPageData 注入
- **动画**: 完全移除粒子/流光/呼吸/扫光/脉冲，仅保留 120-200ms 状态反馈

## Invariants

- CSS 加载顺序固定（见 index.ts），不可颠倒
- 设计令牌变量统一使用 `--cysj-*` 命名空间
- 响应式断点：420px / 640px / 768px / 960px
- 所有自定义组件类名前缀 `.cysj-`，子元素用 `__`，状态用 `.is-*`
- 静态内容不用阴影，使用边框和留白区分层级
- 导航栏高度 56px，侧边栏宽度 240px
