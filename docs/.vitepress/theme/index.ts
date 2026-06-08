import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";

import "./styles/cysj-pro.css";
import "./styles/cysj-ultimate.css";
import "./styles/cysj-ambient.css";
import "./styles/cysj-performance.css";
import "./styles/cysj-mobile.css";
import "./styles/cysj-clean.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
