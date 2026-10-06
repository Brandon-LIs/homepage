#!/usr/bin/env node
/**
 * 构建后按「实际渲染出来的内容」重新子集化标题字体。
 *
 * 为什么必须在构建之后做：
 *   站点的文章标题与摘要是构建期从博客 RSS 抓的。在构建前扫描源码
 *   无法知道那些字——曾经因此漏了 62 个汉字（鼠标垫、贵阳、崩溃、
 *   链接……），它们没有字形就回落成系统字体，同一句话里两种字体。
 *
 *   只有等 HTML 生成完毕，才能拿到真正会显示的全部字符。
 *
 * 用法（由 package.json 的 build 脚本在 astro build 之后调用）：
 *   node scripts/subset-font-after-build.mjs
 *
 * 前置：public/fonts/songti-700.woff2 已由 build-font-subset.py 生成种子版本，
 *       其中包含源码用字（保证首次构建也有字体可显示）。
 *       本脚本会用更完整的字符集覆盖它。
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
/**
 * 子集化的来源必须是「完整母集」，不能是页面子集本身。
 *
 * 这里踩过一个很隐蔽的坑：最初拿 public/fonts/songti-700.woff2
 * （只有 578 字形）当来源，于是无论传入多少字符，产出永远是那 578 个——
 * subset-font 只能在已有字形里挑，没法凭空变出没有的字。
 * 表面看缺字"修好了"，其实只是因为那次的种子恰好包含那几个字，
 * 下一篇新文章照样会缺。真正的来源是 assets/fonts/songti-master.woff2
 * （3882 字形，由 build-font-subset.py 从完整 Noto Serif SC 生成）。
 */
const MASTER = join(ROOT, "assets", "fonts", "songti-master.woff2");
const OUT = join(ROOT, "dist", "fonts", "songti-700.woff2");

/** 全站会出现的标点、数字与拉丁字符，避免中英混排时缺字回落。 */
const EXTRA =
  "0123456789" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "abcdefghijklmnopqrstuvwxyz" +
  " .,:;!?()[]{}<>/\\|-" +
  "\u2013\u2014\u2018\u2019\u201c\u201d\u2026\u2030\u00b0" +
  "\u00b7\u3001\u3002\uff0c\uff1b\uff1a\uff1f\uff01\uff08\uff09" +
  "\u300c\u300d\u300e\u300f\u300a\u300b\u3008\u3009\u3010\u3011" +
  "_'\"`~@#$%^&*+=";

/**
 * 从构建产物里提取「标题字体」真正会用到的文字。
 *
 * 只扫标题族元素，不扫整页——因为宋体只用在 h1–h4 和页脚座右铭上
 * （见 tokens.css 的 --font-display 用法）。之前扫全页，把正文、
 * 标签、评论区的字也塞进了字体，570 个字形里有 400 多个永远用不上，
 * 白白多下 58 KB（124 KB → 66 KB）。
 *
 * 这里宁可多收一些显示类元素，也不要漏——漏字会导致标题里
 * 某个字回落成黑体，比多几 KB 严重得多。
 */
const TITLE_CLASSES = [
  "section-title",
  "project__name",
  "post__title",
  "setup__title",
  "skills__title",
  "site-footer__motto",
  "notfound__title",
  "section-lede",
  "section-index",
  "fact__value",
  "contact__label",
  "stats__value",
  "brand__name",
];

/**
 * 从 HTML 里抽出标题族元素的文字。
 *
 * 这里刻意手写了一个标签栈，而不用正则的 backreference。
 * 原因：HTML 存在同名标签嵌套（<span> 里套 <span>），
 * `<(\w+)>(.*?)</\1>` 这类写法会错配，把整段漏掉——
 * 实测因此抽出 0 个汉字，字体缩到 38 KB 却什么字都没有。
 *
 * 手写栈能准确配对，也顺手解决了另一个坑：class 不一定是
 * 元素的第一个属性（Astro 会生成 <h2 id="..." class="...">），
 * 所以要在开标签内部找 class，而不是要求 class 打头。
 */
function extractTitleText(html) {
  const parts = [];
  const stack = [];
  const re = /<(\/?)([a-z][a-z0-9]*)\b([^>]*?)(\/?)>/gi;
  let m;

  while ((m = re.exec(html))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3] || "";
    const selfClosing = m[4] === "/" || /^(br|img|input|meta|link|hr|source)$/.test(tag);
    if (selfClosing) continue;

    if (!closing) {
      const isHeading = /^h[1-4]$/.test(tag);
      const cls = (attrs.match(/class="([^"]*)"/) || [])[1];
      const wantsClass =
        !!cls && TITLE_CLASSES.some((c) => cls.split(/\s+/).includes(c));
      stack.push({ tag, want: isHeading || wantsClass, start: re.lastIndex });
    } else {
      // 弹出到与闭标签同名的最近一层
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          if (stack[i].want) parts.push(html.slice(stack[i].start, m.index));
          stack.length = i;
          break;
        }
      }
    }
  }

  return parts.join(" ").replace(/<[^>]+>/g, " ");
}

/** 从构建产物里提取所有会渲染出来的文字。 */
async function collectFromDist() {
  const chars = new Set(EXTRA);
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!/\.html$/.test(e.name)) continue;

      const html = await readFile(full, "utf-8");
      // 标题族元素的文字——这是宋体唯一会渲染的内容
      const text = extractTitleText(html);
      for (const ch of text) chars.add(ch);
    }
  };
  await walk(DIST);
  return chars;
}

async function main() {
  if (!existsSync(MASTER)) {
    console.error(`✗ 找不到母集字体：${MASTER}`);
    console.error("  跑一次 scripts/build-font-subset.py 生成它");
    process.exit(1);
  }
  if (!existsSync(DIST)) {
    console.error("✗ 找不到 dist/，请先执行 astro build");
    process.exit(1);
  }

  const used = await collectFromDist();
  const cjkUsed = [...used].filter((c) => c >= "\u4e00" && c <= "\u9fff").length;

  // 只下发页面真正用到的字。博客日后出现新字，下次构建会自动纳入。
  const charset = [...used].join("");

  const master = await readFile(MASTER);
  const subset = await subsetFont(master, charset, { targetFormat: "woff2" });

  // 自检：产出的字形必须真的覆盖页面用到的每一个汉字。
  // 这个校验能挡住上面那个"来源错了但表面看不出"的坑。
  const fontkit = await import("fontkit");
  const font = fontkit.create(subset);
  const missing = [...used].filter(
    (ch) => ch >= "\u4e00" && ch <= "\u9fff" && !font.hasGlyphForCodePoint(ch.codePointAt(0))
  );
  if (missing.length) {
    throw new Error(
      `子集缺 ${missing.length} 个字形：${missing.slice(0, 40).join("")}。` +
        `母集可能不含这些字，请重新生成 assets/fonts/songti-master.woff2`
    );
  }

  await writeFile(OUT, subset);
  console.log(
    `✓ 标题字体已按标题用字子集化：` +
      `汉字 ${cjkUsed}，总字符 ${used.size}，` +
      `${(subset.length / 1024).toFixed(1)} KB（字形覆盖已自检）`
  );
}

main().catch((err) => {
  console.error("✗ 字体子集化失败：", err.message);
  // 不中断构建：dist 里已有种子字体，页面仍可正常显示
  console.error("  沿用种子子集，页面不会缺字体，但可能出现个别回落字。");
});
