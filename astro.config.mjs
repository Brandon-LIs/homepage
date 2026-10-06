import { defineConfig } from "astro/config";

/**
 * 纯静态输出。
 *
 * 页面本身几乎不需要 JavaScript：主题切换、移动端菜单、指针点阵
 * 都是几十行原生脚本，能直接内联或按条件加载，不必背一个框架运行时。
 * 这是从 Next.js 迁过来最主要的原因——之前光 JavaScript 就有 477 KB。
 *
 * sitemap 与 robots 用 public/ 下的静态文件，单页站点没必要引集成。
 */
export default defineConfig({
  site: "https://oopss.top",
  output: "static",
  build: {
    // 样式内联进 <head>，省掉一次阻塞渲染的往返请求
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});
