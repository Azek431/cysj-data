/* =========================================================
   CYSJ Docs Theme — CSS Loading Order
   加载顺序：从底层到表层，从全局到局部
   ========================================================= */

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

/* 1. 设计令牌 — 所有变量的唯一数据源（零运行时开销） */
import "./styles/cysj-design-tokens.css";

/* 2. 排版 — 全局字体、标题、段落（首屏必需） */
import "./styles/cysj-typography.css";

/* 3. 组件 — 代码块、引用块、表格、自定义块（首屏必需） */
import "./styles/cysj-components.css";

/* 4. 导航与布局 — 导航栏、侧边栏、目录、分页、页脚（首屏必需） */
import "./styles/cysj-layout.css";

/* 5. 自定义组件 — PageInfo、PageActions、SiteTools（首屏必需） */
import "./styles/cysj-custom-components.css";

/* 6. 首页 — Hero、Feature 卡片（首屏必需） */
import "./styles/cysj-home.css";

/* 7. 微动效 — 淡入、hover 过渡（非关键，defer） */
import "./styles/cysj-animations.css";

/* 8. 性能 — 硬件加速、降级策略（非关键，defer） */
import "./styles/cysj-performance.css";

/* 9. 响应式 — 移动端、平板、打印（非关键，defer） */
import "./styles/cysj-responsive.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
