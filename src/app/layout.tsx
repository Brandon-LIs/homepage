import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { profile } from "@/data/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * 手写字体（用于标题等特殊元素）
 * 来源：public/font/Pacifico-Regular-all.ttf，本地字体，避免外部请求。
 * 暴露变量：--font-pacifico
 */
const pacifico = localFont({
  src: "../../public/font/Pacifico-Regular-all.ttf",
  variable: "--font-pacifico",
  style: "normal",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_TITLE = process.env.NEXT_PUBLIC_SITE_TITLE || `${profile.siteName}${profile.siteDomain}`;
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || profile.description;
const SITE_FULL_NAME = `${profile.siteName}${profile.siteDomain}`;

const KEYWORDS = Array.from(
  new Set(
    [
      profile.name,
      SITE_FULL_NAME,
      profile.role,
      profile.location,
      profile.motto,
      "个人主页",
      "个人网站",
      "前端开发",
      "开源项目",
      ...profile.languages,
      ...profile.frameworksAndTools,
    ].filter(Boolean)
  )
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_FULL_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_FULL_NAME,
  keywords: KEYWORDS,
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  publisher: profile.name,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_FULL_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    other: {
      "baidu-site-verification": "codeva-ZZuKffGjLt",
      "bytedance-verification-code": "ubHDsdWpJbkckySjegF5",
    },
  },
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON_PATH || "/favicon.ico",
    apple: process.env.NEXT_PUBLIC_APPLE_ICON_PATH || "/favicon.ico",
  },
};

/**
 * JSON-LD 结构化数据（schema.org Person）
 * 用途：帮助搜索引擎理解站点主体信息，命中富媒体搜索结果。
 */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: SITE_FULL_NAME,
  url: SITE_URL,
  image: new URL(profile.avatar || "/avatar.jpg", SITE_URL).toString(),
  description: SITE_DESCRIPTION,
  jobTitle: profile.role,
  homeLocation: {
    "@type": "Place",
    address: profile.location,
  },
  knowsAbout: [...profile.languages, ...profile.frameworksAndTools],
  sameAs: profile.socials.map((social) => social.url),
};

/**
 * 根布局组件
 * 用途：设置页面的全局样式、字体变量和元数据。
 * 参数：children - 页面内容
 * 返回：HTML 根结构
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          async
          defer
          src="https://apis.oopss.top/script.js"
          data-website-id="12b74a52-9a81-4e59-9e52-f424334e1916"
          data-host-url="https://umami.oopss.top"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${pacifico.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Script src="https://bsz.oopss.top/busuanzi.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}