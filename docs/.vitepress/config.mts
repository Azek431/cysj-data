import { defineConfig } from 'vitepress'
import { generatedSidebar } from './sidebar.generated'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Azek 创游世界引擎文档',
  titleTemplate: ':title | 创游世界资料库',
  description:
    '系统整理创游世界脚本、组件、UI、项目设计、OCR 证据、引擎更新与维护规范的中文知识库。',

  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true, metaChunk: true,

  sitemap: {
    hostname: 'https://cysjdocs.azek431.top'
  },

  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          '创游世界, 创游世界文档, 创游世界教程, 创游世界脚本, 创游世界资料库, 创游世界知识库, OCR资料, 游戏引擎'
      }
    ],
    ['meta', { name: 'author', content: 'Azek431' }],
    ['meta', { name: 'robots', content: 'index, follow' }],

    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Azek 创游世界引擎文档' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          '系统化整理创游世界脚本、UI、项目设计、OCR 证据、版本演进与维护规范的知识库。'
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
    ['meta', { property: 'og:site_name', content: '创游世界资料库' }],

    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Azek 创游世界引擎文档' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          '系统化整理创游世界脚本、UI、项目设计、OCR 证据、版本演进与维护规范的中文知识库。'
      }
    ],

    ['link', { rel: 'icon', href: '/logo.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: '创游世界资料库',
    repo: 'Azek431/cysj-data',

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

    sidebar: generatedSidebar,

    outline: {
      label: '本页目录',
      level: [2, 4]
    },

    sidebarMenuLabel: '章节导航',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

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
                resetButtonTitle: '清空搜索',
                backButtonTitle: '关闭搜索',
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

