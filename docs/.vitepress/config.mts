import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Azek 创游世界引擎文档',
  description: '由 @Azek431 搭建的创游世界引擎资料库与开发文档',

  head: [
    ['meta', { name: 'keywords', content: '创游世界, 游戏引擎, 文档, 教程, 脚本, API, OCR资料' }],
    ['meta', { name: 'author', content: 'Azek431' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],

  cleanUrls: true,
  ignoreDeadLinks: true,

  themeConfig: {
    logo: "logo.png",

    lastUpdated: true,
    repo: 'Azek431/cysj-data',
    editLink: {
      pattern: 'https://github.com/Azek431/cysj-data/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    outlineTitle: '本页目录',
    sidebarMenuLabel: '目录',

    nav: [
      { text: '首页', link: '/' },
      { text: '总导航', link: '/总索引与导航/创游世界知识库总导航' },
      { text: '新手路线', link: '/总索引与导航/新手阅读路线' },
      { text: '脚本系统', link: '/脚本系统/脚本界面与积木知识索引' },
      { text: '项目设计', link: '/项目设计/项目设计导航' },
      { text: 'OCR资料', link: '/OCR资料/OCR资料导航' },
      { text: '维护', link: '/维护与报告/维护与报告导航' },
      { text: '关于', link: '/关于' }
    ],

    sidebar: [
      {
        text: '开始阅读',
        collapsed: false,
        items: [
          { text: '首页', link: '/' },
          { text: '新手阅读路线', link: '/总索引与导航/新手阅读路线' },
          { text: '知识库总导航', link: '/总索引与导航/创游世界知识库总导航' },
          { text: 'docs 目录分类对照表', link: '/总索引与导航/docs 目录分类对照表' },
          { text: '关于', link: '/关于' }
        ]
      },
      {
        text: '脚本系统',
        collapsed: false,
        items: [
          { text: '脚本界面与积木知识索引', link: '/脚本系统/脚本界面与积木知识索引' },
          { text: '创游世界脚本实战架构入门', link: '/脚本系统/专题研究/创游世界脚本实战架构入门' },
          { text: '系统级脚本能力解析', link: '/脚本系统/专题研究/系统级脚本能力解析' },
          { text: '脚本作用域与数据流深度研究', link: '/脚本系统/专题研究/脚本作用域与数据流深度研究' },
          { text: '脚本组件体系与能力分层深度研究', link: '/脚本系统/专题研究/脚本组件体系与能力分层深度研究' },
          { text: '创游世界 API 整理', link: '/脚本系统/专题研究/创游世界 API 整理' }
        ]
      },
      {
        text: '教程资料',
        collapsed: true,
        items: [
          { text: '官方教程知识索引', link: '/教程资料/官方教程知识索引' },
          { text: 'B站视频资源清单', link: '/教程资料/B站创游世界视频资源清单' },
          { text: 'B站视频资源研究', link: '/教程资料/B站创游世界视频资源研究' },
          { text: '创游世界学习路线图', link: '/教程资料/专题研究/创游世界学习路线图' },
          { text: '从视频学习到实战落地指南', link: '/教程资料/专题研究/创游世界从视频学习到实战落地指南' },
          { text: '对象素材组件脚本关系总图', link: '/教程资料/专题研究/创游世界对象_素材_组件_脚本关系总图' }
        ]
      },
      {
        text: '项目设计',
        collapsed: true,
        items: [
          { text: '项目设计导航', link: '/项目设计/项目设计导航' },
          { text: '项目结构与架构导航', link: '/项目设计/项目结构与架构导航' },
          { text: '系统设计专题导航', link: '/项目设计/系统设计专题导航' },
          { text: '商店系统专题导航', link: '/项目设计/商店系统专题导航' },
          { text: '多地图与场景切换导航', link: '/项目设计/多地图与场景切换导航' },
          { text: '教程引导与新手流程导航', link: '/项目设计/教程引导与新手流程导航' }
        ]
      },
      {
        text: '核心研究',
        collapsed: true,
        items: [
          { text: '专题研究导航', link: '/核心研究/专题研究导航' },
          { text: 'API 与脚本接口导航', link: '/核心研究/API与脚本接口导航' },
          { text: '脚本系统研究导航', link: '/核心研究/脚本系统研究导航' },
          { text: 'UI 与交互研究导航', link: '/核心研究/UI与交互研究导航' },
          { text: '广播与事件机制导航', link: '/核心研究/广播与事件机制导航' },
          { text: '数据、变量与作用域导航', link: '/核心研究/数据、变量与作用域导航' },
          { text: '组件与对象系统导航', link: '/核心研究/组件与对象系统导航' },
          { text: '版本与能力边界导航', link: '/核心研究/版本与能力边界导航' }
        ]
      },
      {
        text: '引擎更新',
        collapsed: true,
        items: [
          { text: '引擎更新知识索引', link: '/引擎更新/引擎更新知识索引' },
          { text: '4.54.0 数据类型与脚本能力升级解析', link: '/引擎更新/专题研究/4.54.0 数据类型与脚本能力升级解析' },
          { text: '联机 UI 演进专题', link: '/引擎更新/专题研究/联机UI演进专题' }
        ]
      },
      {
        text: 'OCR 资料',
        collapsed: true,
        items: [
          { text: 'OCR资料导航', link: '/OCR资料/OCR资料导航' },
          { text: 'OCR 资料总览与完整化现状', link: '/OCR资料/OCR 资料总览与完整化现状' },
          { text: 'OCR 完整化总表', link: '/OCR资料/OCR 完整化总表' },
          { text: 'OCR 未识别与残缺清单', link: '/OCR资料/OCR 未识别与残缺清单' },
          { text: 'OCR 证据链说明', link: '/OCR资料/OCR 证据链说明' },
          { text: 'OCR 图片编号映射表', link: '/OCR资料/映射表/OCR 图片编号映射表' }
        ]
      },
      {
        text: '元信息',
        collapsed: true,
        items: [
          { text: '创游世界术语表', link: '/元信息/创游世界术语表' },
          { text: '知识库文档状态总表', link: '/元信息/知识库文档状态总表' },
          { text: '知识标签体系总表', link: '/元信息/知识标签体系总表' },
          { text: '知识条目统一元数据规范', link: '/元信息/知识条目统一元数据规范' },
          { text: '页面模板与标准化文档结构', link: '/元信息/页面模板' },
          { text: '资料库深入研究报告', link: '/元信息/创游世界资料库深入研究报告' }
        ]
      }, 
      {
        text: '维护与报告',
        collapsed: true,
        items: [
          { text: '维护与报告导航', link: '/维护与报告/维护与报告导航' },
          { text: '社区贡献与维护指南', link: '/维护与报告/社区贡献与维护指南' },
          { text: '合规与版权声明', link: '/维护与报告/合规与版权声明' },
          { text: '站点部署与运维方案', link: '/维护与报告/站点部署与运维方案' },
          { text: '资料规范与状态总览', link: '/维护与报告/资料规范与状态总览' },
          { text: '维护流程说明', link: '/维护与报告/维护流程说明' },
          { text: '维护检查清单', link: '/维护与报告/维护检查清单' },
          { text: '文档状态分级规则', link: '/维护与报告/文档状态分级规则' },
          { text: '更新日志入口导航', link: '/维护与报告/更新日志入口导航' },
          { text: '知识库深度优化报告', link: '/维护与报告/知识库深度优化报告' }
        ]
      }
    ],

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Azek431/cysj-data' }
    ],

    footer: {
      message: '由 Azek431 整理与维护 | 基于 MIT 许可证开源',
      copyright: 'Copyright © 2026 Azek431 | 内容仅供学习参考，请遵守相关法律法规'
    }
  },

  markdown: {
    lineNumbers: true
  }
})
