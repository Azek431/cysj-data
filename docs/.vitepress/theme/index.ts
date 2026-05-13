import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import "./custom.css";
import "./styles/premium-ui.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
