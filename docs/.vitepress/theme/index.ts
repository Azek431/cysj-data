/* =========================================================
   CYSJ Docs Theme — CSS Loading Order
   加载顺序：从底层到表层，从全局到局部
   ========================================================= */

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

/* 1. 设计令牌 — 所有变量的唯一数据源 */
import "./styles/tokens.css";

/* 2. 排版 — 全局字体、标题、段落 */
import "./styles/typography.css";

/* 3. 组件 — 代码块、引用块、表格、自定义块 */
import "./styles/components.css";

/* 4. 导航与布局 — 导航栏、侧边栏、目录、分页、页脚、首页区块 */
import "./styles/layout.css";

/* 5. 自定义组件 — PageInfo、PageActions、SiteTools、ReadingProgress */
import "./styles/custom.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
