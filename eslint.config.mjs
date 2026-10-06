import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint 扁平配置。
 *
 * Next.js 16 的 eslint-config-next 已直接导出 flat config 数组，
 * 不再需要 @eslint/eslintrc 的 FlatCompat 桥接。
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "shots/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
