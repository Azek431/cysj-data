import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import "./styles/cysj-pro.css";
import './styles/cysj-ultimate.css'

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;

