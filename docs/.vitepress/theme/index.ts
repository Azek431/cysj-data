/* =========================================================
   CYSJ Docs Theme — CSS Loading Order
   加载顺序至关重要：从底层到表层，从全局到局部
   ========================================================= */

import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

/* 1. 设计令牌 — 所有变量的唯一数据源 */
import "./styles/cysj-design-tokens.css";

/* 2. 排版 — 全局字体、标题、段落 */
import "./styles/cysj-typography.css";

/* 3. 组件 — 代码块、引用块、表格、自定义块 */
import "./styles/cysj-components.css";

/* 4. 导航与布局 — 导航栏、侧边栏、目录、分页、页脚 */
import "./styles/cysj-layout.css";

/* 5. 首页 — Hero、Feature 卡片、首页内容区 */
import "./styles/cysj-home.css";

/* 6. 自定义组件 — PageInfo、PageActions、SiteTools */
import "./styles/cysj-custom-components.css";

/* 7. 微动效 — 淡入、hover 过渡 */
import "./styles/cysj-animations.css";

/* 8. 性能 — 硬件加速、降级策略 */
import "./styles/cysj-performance.css";

/* 9. 响应式 — 移动端、平板、打印 */
import "./styles/cysj-responsive.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
