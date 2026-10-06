import "server-only";

export type Post = {
  title: string;
  href: string;
  /** ISO 日期，便于 <time dateTime> 与排序 */
  date: string;
  /** 已格式化的中文日期，无 JS 也能正确显示 */
  dateLabel: string;
  summary: string;
  cover?: string;
};

/**
 * 构建期从博客 RSS 拉取最新文章。
 *
 * 为什么放在构建期而不是客户端：个人主页不该为了几篇文章
 * 让访客多等一次网络往返，也不该把博客的可用性绑到首屏上。
 * 拉取失败时回退到下面这份快照，页面照样完整渲染。
 */
const RSS_URL = "https://blog.oopss.top/blog/rss.xml";

/** RSS 不可达时的兜底内容（抓取于 2026-10-05）。 */
const FALLBACK: Post[] = [
  {
    title: "博客支持 Blogsclub 一键添加友链",
    href: "https://blog.oopss.top/blog/blogsclub-friend-link",
    date: "2026-10-05",
    dateLabel: "2026 年 10 月 5 日",
    summary:
      "接入 BlogsClub 开放平台，一键授权获取博友的站点地址、头像与邮箱等信息。",
    cover: "https://jsd.oopss.top/gh/Brandon-LIs/paper@refs/heads/main/lite.webp",
  },
  {
    title: "收到了 Blogsclub 的鼠标垫",
    href: "https://blog.oopss.top/blog/free-mousepad-by-bc",
    date: "2026-09-13",
    dateLabel: "2026 年 9 月 13 日",
    summary:
      "「每月拾光」入选博主可以用 0.01 积分兑换鼠标垫，顺丰发货第三天到手。",
    cover:
      "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/1789271159758-sm.webp",
  },
  {
    title: "生活 | 贵阳游记",
    href: "https://blog.oopss.top/blog/guiyang-trip",
    date: "2026-08-31",
    dateLabel: "2026 年 8 月 31 日",
    summary:
      "暑假尾声和朋友去贵阳玩了几天的行程记录：甲秀楼、东山寺、青岩古镇、花溪夜郎谷、花果园与黔灵山。",
    cover:
      "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/1788159846637-sm.webp",
  },
  {
    title: "技术 | 给博客加上 AI 搜索功能",
    href: "https://blog.oopss.top/blog/tech-add-ai-search-to-blog",
    date: "2026-08-22",
    dateLabel: "2026 年 8 月 22 日",
    summary:
      "主题自带的本地搜索在文章变多后会卡到浏览器崩溃，换成 Cloudflare Workers + AI 向量检索。",
    cover: "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/08220001-sm.webp",
  },
];

function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // &amp; 必须最后处理，否则会把上面转义出的内容二次解码
    .replace(/&amp;/g, "&");
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function tag(item: string, name: string): string {
  const m = item.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i")
  );
  return m ? m[1].trim() : "";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
}

function parse(xml: string, limit: number): Post[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const posts: Post[] = [];

  for (const raw of items) {
    const title = stripTags(tag(raw, "title"));
    const href = stripTags(tag(raw, "link"));
    if (!title || !href) continue;

    const pub = tag(raw, "pubDate");
    const parsed = new Date(pub);
    const date = Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toISOString().slice(0, 10);

    // 摘要优先取正文首段（RSS 的 description 常带完整 HTML），
    // 这样拿到的是文章真正在说的话，而不是模板化的 meta description。
    const body = decodeEntities(tag(raw, "encoded") || tag(raw, "description"));
    const firstPara =
      body
        .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
        .match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? body;
    const summary = stripTags(firstPara).slice(0, 110);

    const cover =
      raw.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ??
      body.match(/<img[^>]+src="([^"]+)"/i)?.[1] ??
      undefined;

    posts.push({
      title,
      href,
      date,
      dateLabel: formatDate(date),
      summary: summary || "阅读全文 ›",
      cover,
    });

    if (posts.length >= limit) break;
  }

  return posts;
}

/**
 * 本地处理过的封面。
 *
 * 博客的原始封面是彩色的，直接引用会把这套纸墨配色搅乱，
 * 所以 scripts/process-covers.py 把常用的几张降饱和后放进 public/covers。
 * 新文章会用远程原图（Next 的图片优化会照常处理），
 * 等跑过脚本、把新封面加进 scripts/process-covers.py 的映射表即可。
 */
const LOCAL_COVER_SLUGS = [
  "blogsclub-friend-link",
  "free-mousepad-by-bc",
  "guiyang-trip",
  "tech-add-ai-search-to-blog",
] as const;

function localCoverFor(href: string): string | undefined {
  const slug = href.split("/").filter(Boolean).pop();
  if (!slug) return undefined;
  return (LOCAL_COVER_SLUGS as readonly string[]).includes(slug)
    ? `/covers/${slug}.webp`
    : undefined;
}

export async function getRecentPosts(limit = 4): Promise<Post[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  const withLocalCover = (p: Post): Post => ({
    // 有本地版本就优先用本地（配色统一、无第三方依赖），否则用远程原图
    ...p,
    cover: localCoverFor(p.href) ?? p.cover,
  });

  try {
    const res = await fetch(RSS_URL, {
      signal: controller.signal,
      headers: { "user-agent": "oopss-homepage/1.0 (+https://oopss.top)" },
    });
    if (!res.ok) throw new Error(`RSS responded ${res.status}`);

    const xml = await res.text();
    const posts = parse(xml, limit);
    if (posts.length === 0) throw new Error("RSS contained no usable items");

    // 解析成功但没有封面时，用快照补齐同链接的封面
    return posts.map((p) =>
      withLocalCover({
        ...p,
        cover: p.cover ?? FALLBACK.find((f) => f.href === p.href)?.cover,
      })
    );
  } catch {
    // 构建期网络不可用（比如离线构建）不该让整个站点构建失败
    return FALLBACK.slice(0, limit).map(withLocalCover);
  } finally {
    clearTimeout(timer);
  }
}
