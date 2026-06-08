import { defineConfig } from 'vitepress'
import { generatedSidebar } from './sidebar.generated'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Azek创游世界文档',
  titleTemplate: ':title | Azek创游世界文档',
  description: 'Azek431 整理维护的创游世界中文文档站，系统收录创游世界脚本、组件、UI、项目设计、OCR 证据、引擎更新、新手路线和长期维护规范。',

  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true, metaChunk: true,

  sitemap: {
    hostname: 'https://cysjdocs.azek431.top'
  },

  transformPageData(pageData) {
    const pagePath = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
      .replace(/\/$/, '')

    const canonicalPath = pagePath ? `/${pagePath}` : '/'
    const canonicalUrl = `https://cysjdocs.azek431.top${encodeURI(canonicalPath)}`

    pageData.frontmatter.head ??= []

    pageData.frontmatter.head = pageData.frontmatter.head.filter((entry) => {
      if (!Array.isArray(entry)) return true

      const [tag, attrs] = entry

      return !(tag === 'link' && attrs?.rel === 'canonical')
    })

    pageData.frontmatter.head.push([
      'link',
      { rel: 'canonical', href: canonicalUrl }
    ])
  },

  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    [
      'meta',
      {
        name: 'keywords',
        content: 'Azek创游世界文档, Azek431, 创游世界, 创游世界文档, 创游世界教程, 创游世界脚本, 创游世界知识库, 创游世界引擎, 创游世界UI, 创游世界组件, OCR资料, 游戏引擎'
      }
    ],
    ['meta', { name: 'author', content: 'Azek431' }],
    ['meta', { name: 'robots', content: 'index, follow' }],

    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Azek创游世界文档' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Azek431 整理维护的创游世界中文文档站，系统收录创游世界脚本、组件、UI、项目设计、OCR 证据、引擎更新、新手路线和长期维护规范。'
      }
    ],
    ['meta', { property: 'og:url', content: 'https://cysjdocs.azek431.top/' }],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://cysjdocs.azek431.top/logo.png'
      }
    ],
    ['meta', { property: 'og:site_name', content: 'Azek创游世界文档' }],

    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Azek创游世界文档' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Azek431 整理维护的创游世界中文文档站，系统收录创游世界脚本、组件、UI、项目设计、OCR 证据、引擎更新、新手路线和长期维护规范。'
      }
    ],

    ['link', { rel: 'icon', href: '/logo.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Azek创游世界文档',
    repo: 'Azek431/cysj-data',

    nav: [
      { text: '首页', link: '/' },
      { text: '开始阅读', items: [
        { text: '新手阅读路线', link: '/总索引与导航/新手阅读路线' },
        { text: '快速入门索引', link: '/总索引与导航/快速入门索引' },
        { text: '按问题查资料', link: '/总索引与导航/按问题查资料' },
        { text: '知识库总导航', link: '/总索引与导航/创游世界知识库总导航' }
      ] },
      { text: '专题资料', items: [
        { text: '脚本系统', link: '/脚本系统/脚本界面与积木知识索引' },
        { text: '项目设计', link: '/项目设计/项目设计导航' },
        { text: '核心研究', link: '/核心研究/核心研究导航' },
        { text: '教程资料', link: '/教程资料/教程资料导航' },
        { text: 'OCR 资料', link: '/OCR资料/OCR资料导航' },
        { text: '引擎更新', link: '/引擎更新/引擎更新知识索引' }
      ] },
      { text: '维护', items: [
        { text: '维护与报告', link: '/维护与报告/维护与报告导航' },
        { text: '资料证据等级', link: '/维护与报告/资料证据等级说明' },
        { text: '内容质量审计', link: '/维护与报告/内容质量审计清单' }
      ] },
      { text: '关于', link: '/关于' }
    ],
    sidebar: generatedSidebar,

    outline: { label: '本页目录', level: [2, 3] },

    sidebarMenuLabel: '章节导航',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchtitle: 'Azek创游世界文档',
    darkModeSwitchtitle: 'Azek创游世界文档',

    editLink: {
      pattern: 'https://github.com/Azek431/cysj-data/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtontitle: 'Azek创游世界文档',
                backButtontitle: 'Azek创游世界文档',
                noResultsText: '没有找到相关结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        },
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 5,
              text: 2,
              titles: 3
            }
          }
        }
      }
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Azek431/cysj-data',
        ariaLabel: 'GitHub 仓库'
      },
      {
        icon: 'gitee',
        link: 'https://gitee.com/Azek431/cysj-data',
        ariaLabel: 'Gitee 镜像仓库'
      }
    ],

    footer: {
      message: '由 Azek431 整理与维护 | 基于 MIT 许可证开源',
      copyright:
        'Copyright © 2026 Azek431 | 内容仅供学习参考，请遵守相关法律法规'
    }
  },

  markdown: {
    lineNumbers: true,
    image: {
      lazyLoading: true
    },
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '危险',
      infoLabel: '信息',
      detailsLabel: '展开查看'
    },
    toc: {
      level: [2, 3]
    }
  }
})
