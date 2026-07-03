import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@theme': path.resolve(__dirname, 'docs/.vitepress/theme')
    }
  },

  build: {
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },

    // CSS 代码分割
    cssCodeSplit: true,

    // 提高 chunk 大小警告阈值（VitePress 站点本身较大）
    chunkSizeWarningLimit: 1000,

    // 预加载策略
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks(id) {
          // VitePress 框架单独打包
          if (id.includes('vitepress') && id.includes('node_modules')) {
            return 'vendor-vitepress'
          }
          // Vue 单独打包
          if (id.includes('vue') && id.includes('node_modules')) {
            return 'vendor-vue'
          }
          // Shiki 语法高亮单独打包
          if (id.includes('shiki') && id.includes('node_modules')) {
            return 'vendor-shiki'
          }
          // Mark.js 搜索库
          if (id.includes('mark.js') && id.includes('node_modules')) {
            return 'vendor-markjs'
          }
          // DocSearch
          if (id.includes('@docsearch') && id.includes('node_modules')) {
            return 'vendor-docsearch'
          }
        },

        // 预加载关键资源
        prefetchTests: true,
        // chunk 文件名哈希
        chunkFileNames: 'assets/chunks/[name]-[hash].js'
      }
    }
  },

  // 服务器性能优化
  optimizeDeps: {
    include: ['vue', 'vitepress']
  }
})
