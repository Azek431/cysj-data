import { defineConfig } from "vitepress";
import { generatedSidebar } from "./sidebar.generated";

export default defineConfig({
  title: "Azek 创游世界引擎文档",
  description: "由 @Azek431 搭建的创游世界引擎资料库与开发文档",

  head: [
    [
      "meta",
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    ["meta", { name: "theme-color", content: "#2563eb" }],
    [
      "meta",
      {
        name: "keywords",
        content: "创游世界, 游戏引擎, 文档, 教程, 脚本, API, OCR资料, 资源库",
      },
    ],
    ["meta", { name: "author", content: "Azek431" }],
    ["meta", { name: "robots", content: "index, follow" }],

    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Azek 创游世界引擎文档" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "系统化整理创游世界引擎脚本、UI、项目设计、OCR 证据与维护规范的知识库。",
      },
    ],
    ["meta", { property: "og:url", content: "https://cysjdocs.dpdns.org/" }],
    [
      "meta",
      { property: "og:image", content: "https://cysjdocs.dpdns.org/logo.png" },
    ],
    ["meta", { property: "og:site_name", content: "创游世界资料库" }],

    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:site", content: "@Azek431" }],
    ["meta", { name: "twitter:title", content: "Azek 创游世界引擎文档" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "系统化整理创游世界引擎脚本、UI、项目设计、OCR 证据与维护规范的知识库。",
      },
    ],
    ["link", { rel: "icon", href: "/logo.png" }],
  ],

  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,

  themeConfig: {
    logo: "/logo.png",

    repo: "Azek431/cysj-data",

    editLink: {
      pattern: "https://github.com/Azek431/cysj-data/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    outlineTitle: "本页目录",
    sidebarMenuLabel: "章节导航",

    nav: [
      { text: "首页", link: "/" },
      { text: "总导航", link: "/总索引与导航/创游世界知识库总导航" },
      { text: "新手路线", link: "/总索引与导航/新手阅读路线" },
      { text: "脚本系统", link: "/脚本系统/脚本界面与积木知识索引" },
      { text: "项目设计", link: "/项目设计/项目设计导航" },
      { text: "OCR资料", link: "/OCR资料/OCR资料导航" },
      { text: "维护", link: "/维护与报告/维护与报告导航" },
      { text: "关于", link: "/关于" },
    ],

    sidebar: generatedSidebar,

    search: {
      provider: "local",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Azek431/cysj-data",
      },
    ],

    footer: {
      message: "由 Azek431 整理与维护 | 基于 MIT 许可证开源",
      copyright:
        "Copyright © 2026 Azek431 | 内容仅供学习参考，请遵守相关法律法规",
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
