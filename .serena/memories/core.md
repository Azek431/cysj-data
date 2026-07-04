# Project Overview — 创游世界资料汇总


## Structure

```text
cysj-data/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts            # VitePress 主配置（站点名、SEO、sitemap、RSS）
│   │   ├── theme/
│   │   │   ├── index.ts          # 主题入口（CSS 加载顺序、Layout 注册）
│   │   │   ├── Layout.vue        # 根布局组件
│   │   │   ├── components/       # 自定义组件（AuthorCard, MetaLine, CysjTools 等）
│   │   │   └── styles/           # 9 层 CSS 架构
│   │   │       ├── cysj-design-tokens.css   # 设计令牌（颜色/间距/阴影/圆角/动效）
│   │   │       ├── cysj-typography.css      # 全局字体、标题、段落
│   │   │       ├── cysj-components.css      # 代码块、引用块、表格
│   │   │       ├── cysj-layout.css          # 导航栏、侧边栏、分页、页脚
│   │   │       ├── cysj-custom-components.css # 页面元信息、作者卡片、阅读进度条
│   │   │       ├── cysj-home.css            # Hero、Feature 卡片、首页
│   │   │       ├── cysj-animations.css      # 入场动画、渐变流光、背景呼吸
│   │   │       ├── cysj-performance.css     # 硬件加速、防布局偏移、降级
│   │   │       └── cysj-responsive.css      # 响应式断点、无障碍、打印
│   │   └── public/             # 静态资源（favicon, robots.txt）
│   ├── index.md                # 首页
│   ├── guide/                  # 指南
│   ├── reference/              # 参考文档
│   └── ...                     # 其他页面
├── .serena/                    # Serena 项目管理
└── package.json
```


## Key Facts

- **框架**: VitePress 5.x（基于 Vue 3 + Vite）
- **内容**: 创游世界（CYWorld）游戏开发引擎的资料汇总
- **主题**: 自定义 CYSJ 设计系统，蓝紫色品牌色，Slate 色系
- **CSS 架构**: 9 层分层（令牌→排版→组件→布局→自定义组件→首页→动画→性能→响应式）
- **暗色模式**: 完整支持，每处关键变量都有暗色变体
- **SEO**: sitemap + RSS + Open Graph + JSON-LD
- **SSR**: 元数据通过 transformPageData 注入


## Invariants

- CSS 加载顺序固定（见 index.ts），不可颠倒
- 设计令牌变量统一使用 `--cysj-*` 命名空间
- 响应式断点：420px / 640px / 768px / 960px（对齐 VitePress 默认 640/960）
- 所有自定义组件类名前缀 `.cysj-`，子元素用 `__`，状态用 `.is-*`
