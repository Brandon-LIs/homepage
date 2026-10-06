import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * ESLint 扁平配置。
 *
 * 只保留"能抓真 bug"的规则：类型相关的可疑写法、未使用的变量、
 * 以及浏览器环境下的常见错误。不引样式类插件——排版交给自己判断，
 * 规则越多越容易变成噪音。
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".astro/**",
      "assets-raw/**",
      "scripts/**",
      // .astro 单文件组件需要 astro-eslint-parser 才能解析，
      // 而它们的内容主要是模板 + 少量脚本，真正的逻辑都在 src/scripts 里。
      // 用 astro check 做类型与模板校验，ESLint 只管纯 TS 文件，各司其职。
      "src/**/*.astro",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        IntersectionObserver: "readonly",
        MutationObserver: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        getComputedStyle: "readonly",
        HTMLElement: "readonly",
        HTMLCanvasElement: "readonly",
        CanvasRenderingContext2D: "readonly",
        PointerEvent: "readonly",
        CSS: "readonly",
        MediaQueryListEvent: "readonly",
      },
    },
  }
);
