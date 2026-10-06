#!/usr/bin/env node
/**
 * 构建期从博客 RSS 拉取最新文章，写成 src/data/posts.json。
 *
 * 为什么放在构建期而不是客户端：
 *   首页不该为了几篇文章让访客多等一次网络往返，也不该把博客的
 *   可用性绑到首屏上。抓取发生在构建时，产物是纯静态 JSON。
 *
 * 失败时不写文件、以非零码退出。调用方（build 脚本或 GitHub Action）
 * 会保留上一次的 posts.json，页面照样完整——不会因为博客临时挂了
 * 就把主页搞崩。
 *
 * 用法：
 *   node scripts/fetch-posts.mjs [--limit 4] [--out src/data/posts.json]
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RSS_URL = "https://blog.oopss.top/blog/rss.xml";

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const outArg = args.indexOf("--out");
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : 4;
const OUT = resolve(ROOT, outArg >= 0 ? args[outArg + 1] : "src/data/posts.json");

/** 本地已处理过的封面。新文章回落到远程原图。 */
const LOCAL_COVERS = new Set([
  "blogsclub-friend-link",
  "free-mousepad-by-bc",
  "guiyang-trip",
  "tech-add-ai-search-to-blog",
]);

function decodeEntities(input) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    // &amp; 必须最后处理，否则会把上面解出的内容二次解码
    .replace(/&amp;/g, "&");
}

function stripTags(input) {
  return decodeEntities(input.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/**
 * 取某个标签的内容。
 *
 * 两个必须处理的细节：
 *   1. 标签名可能带命名空间前缀（RSS 的正文是 content:encoded），
 *      所以前缀要一起匹配，不能只找 <encoded>。
 *   2. 内容常被 <![CDATA[ ]]> 包着。必须先剥掉 CDATA 外壳再交给
 *      stripTags——否则 <[^>]+> 会把整个 CDATA 段当成一个标签吃掉，
 *      标题直接变成空字符串。
 */
function tag(item, name) {
  const m = item.match(
    new RegExp(`<(?:[\\w-]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "i")
  );
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
}

function parse(xml, limit) {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const posts = [];

  for (const raw of items) {
    const title = stripTags(tag(raw, "title"));
    const href = stripTags(tag(raw, "link"));
    if (!title || !href) continue;

    const parsed = new Date(tag(raw, "pubDate"));
    const date = Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toISOString().slice(0, 10);

    // 摘要优先取正文首段，这样拿到的是文章真正在说的话，
    // 而不是模板化的 meta description
    const body = decodeEntities(tag(raw, "encoded") || tag(raw, "description"));
    const firstPara =
      body
        .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
        .match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? body;
    const summary = stripTags(firstPara).slice(0, 110);

    const remoteCover =
      raw.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ??
      body.match(/<img[^>]+src="([^"]+)"/i)?.[1];

    const slug = href.split("/").filter(Boolean).pop() ?? "";
    const cover = LOCAL_COVERS.has(slug) ? `/covers/${slug}.webp` : remoteCover;

    posts.push({
      title,
      href,
      date,
      dateLabel: formatDate(date),
      summary: summary || "阅读全文 ›",
      cover: cover || "",
    });

    if (posts.length >= limit) break;
  }

  return posts;
}

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(RSS_URL, {
      signal: controller.signal,
      headers: { "user-agent": "oopss-homepage/2.0 (+https://oopss.top)" },
    });
    if (!res.ok) throw new Error(`RSS 返回 ${res.status}`);

    const xml = await res.text();
    const posts = parse(xml, LIMIT);
    if (posts.length === 0) throw new Error("RSS 里没有可用的文章");

    const payload = {
      // 记录抓取时间，方便排查"为什么还是旧文章"
      fetchedAt: new Date().toISOString(),
      source: RSS_URL,
      posts,
    };

    await mkdir(dirname(OUT), { recursive: true });
    await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf-8");

    console.log(`✓ 抓到 ${posts.length} 篇文章 → ${OUT}`);
    for (const p of posts) console.log(`  ${p.date}  ${p.title}`);
  } finally {
    clearTimeout(timer);
  }
}

main().catch((err) => {
  // 非零退出，让 CI 知道这次没更新成功；已有的 posts.json 保持不动
  console.error(`✗ 抓取失败：${err.message}`);
  console.error("  已保留上一次的 posts.json，页面不会因此缺内容。");
  process.exit(1);
});
