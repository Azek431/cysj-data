import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import "./custom.css";
import "./styles/polish.css";
import "./styles/polish-v3.css";
import "./styles/polish-v4.css";
import "./styles/minimal-doc-ui.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
import "./styles/page-meta-compact.css";
