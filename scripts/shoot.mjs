/**
 * 视觉验证脚本：在多个视口下截图，并在桌面端模拟指针移动，
 * 用于人工核对设计效果与响应式表现。
 *
 * 用法：
 *   pnpm add -D playwright && npx playwright install chromium
 *   node scripts/shoot.mjs [baseUrl]
 *
 * playwright 刻意不写进 package.json：它只用于本地核查，
 * 不是构建或部署的依赖，没必要让 Vercel 安装一套浏览器。
 * 如已单独装好 chromium，可用 CHROME_PATH 指定可执行文件。
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, dsf: 2 },
  { name: "laptop", width: 1120, height: 800, dsf: 2 },
  { name: "tablet", width: 820, height: 1024, dsf: 2 },
  { name: "mobile", width: 390, height: 844, dsf: 3 },
];

const browser = await chromium.launch({
  // 允许用 CHROME_PATH 指定已装好的 chromium，省去再下一套浏览器
  executablePath: process.env.CHROME_PATH || undefined,
});
const errors = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    hasTouch: vp.name === "mobile" || vp.name === "tablet",
    isMobile: vp.name === "mobile",
  });
  const page = await ctx.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${vp.name}] console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${vp.name}] pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);

  // 首屏
  await page.screenshot({ path: `${OUT}/${vp.name}-hero.png` });

  // 桌面/笔记本：模拟指针移动，检验反应层
  if (vp.name === "desktop" || vp.name === "laptop") {
    for (let i = 0; i <= 20; i++) {
      await page.mouse.move(
        vp.width * 0.2 + (vp.width * 0.5 * i) / 20,
        vp.height * 0.3 + (vp.height * 0.25 * i) / 20
      );
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${vp.name}-pointer.png` });
  }

  // 全页
  await page.screenshot({ path: `${OUT}/${vp.name}-full.png`, fullPage: true });

  // 暗色主题
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
    try {
      localStorage.setItem("theme", "dark");
    } catch {}
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vp.name}-dark-hero.png` });

  if (vp.name === "desktop") {
    await page.mouse.move(vp.width * 0.6, vp.height * 0.4);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${vp.name}-dark-pointer.png` });
    await page.screenshot({ path: `${OUT}/${vp.name}-dark-full.png`, fullPage: true });
  }

  // 水平溢出检测
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    return {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      overflowing: de.scrollWidth > de.clientWidth + 1,
    };
  });
  if (overflow.overflowing) {
    errors.push(
      `[${vp.name}] 水平溢出: scrollWidth=${overflow.scrollW} clientWidth=${overflow.clientW}`
    );
  }

  await ctx.close();
}

await browser.close();

if (errors.length) {
  console.log("\n=== 发现问题 ===");
  for (const e of errors) console.log(" -", e);
  process.exitCode = 1;
} else {
  console.log("\n没有控制台错误，也没有水平溢出。");
}
