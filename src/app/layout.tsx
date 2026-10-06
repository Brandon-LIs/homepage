import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SITE, SOCIALS } from "@/data/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  // 等宽字体只用在日期、年份这类小号元信息上，且都在首屏之下。
  // 关掉 preload 把它从关键路径上摘掉，避免和正文字体抢带宽。
  preload: false,
});

/**
 * 标题用宋体。
 *
 * 这是整个页面性格的主要来源：现代几何无衬线是 AI 生成界面的默认脸，
 * 而宋体的笔锋和横细竖粗是中文印刷体独有的东西，模仿不来。
 *
 * 字体是 Noto Serif SC（SIL OFL 1.1，可自由商用与再分发），
 * 用 pyftsubset 按页面实际用到的字符子集化后自托管——
 * 全量中文字体有好几 MB，子集化后只有几十 KB。
 * 生成脚本见 scripts/build-font-subset.py。
 */
const songti = localFont({
  src: [
    {
      path: "../../public/fonts/songti-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-songti",
  display: "swap",
  // 标题字体直接决定首屏观感，必须尽早拿到
  preload: true,
  fallback: ["Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "SimSun", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  keywords: [
    "Brandon",
    "oopss",
    "个人主页",
    "前端开发",
    "计算机科学",
    "AI",
    "开源",
    "宜昌",
    "高中生开发者",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": SITE.blog + "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE.url,
    siteName: SITE.title,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16181d" },
  ],
  colorScheme: "light dark",
};

/**
 * 在浏览器绘制前同步写入主题属性，避免暗色用户看到白屏闪烁（FOUC）。
 * 同时在 <html> 上打 js 标记：只有 JS 可用时才启用滚动揭示动画，
 * 否则内容必须默认可见（爬虫与无 JS 环境不能拿到空白页面）。
 */
const themeBootstrap = `
(function(){
  try {
    var el = document.documentElement;
    el.classList.add('js');
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    el.setAttribute('data-theme', theme);
    el.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${songti.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {/* 首屏纸纹是 CSS 背景图，浏览器要等 CSS 解析完才发现它，
            在慢速移动网络下会拖后最大内容绘制。
            用 media 限定条件预加载：只有当前真正会用到的那一份会被下载，
            另一套主题和另一个尺寸的不会被浪费。 */}
        <link
          rel="preload"
          as="image"
          href="/textures/paper.avif"
          type="image/avif"
          media="(prefers-color-scheme: light) and (min-width: 721px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/textures/paper-sm.avif"
          type="image/avif"
          media="(prefers-color-scheme: light) and (max-width: 720px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/textures/screen-glow.avif"
          type="image/avif"
          media="(prefers-color-scheme: dark) and (min-width: 721px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/textures/screen-glow-sm.avif"
          type="image/avif"
          media="(prefers-color-scheme: dark) and (max-width: 720px)"
          fetchPriority="high"
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: SITE.name,
              url: SITE.url,
              description: SITE.description,
              sameAs: SOCIALS.filter((s) => s.href.startsWith("http")).map(
                (s) => s.href
              ),
            }),
          }}
        />
      </body>
    </html>
  );
}
