/**
 * 站点级常量与个人信息数据源。
 *
 * 所有对外可见的身份信息集中在此，页面组件只负责呈现，
 * 避免同一句自我介绍散落在多个组件里各自演化。
 *
 * 事实来源：blog.oopss.top/about、/docs/2026kc1、/docs/2026kc2、RSS、
 * GitHub @Brandon-LIs、status.oopss.top（核对于 2026-10）。
 */

export const SITE = {
  url: "https://oopss.top",
  name: "Brandon",
  title: "Brandon · 个人主页",
  description:
    "写前端，也折腾 AI 和硬件，做过 cfmemos、SmartMath 这些开源项目。这里是我的个人主页。",
  blog: "https://blog.oopss.top",
  status: "https://status.oopss.top",
  github: "https://github.com/Brandon-LIs",
  motto: "我们都有光明的未来",
  icp: [
    { text: "萌ICP备20262621号", href: "https://icp.gov.moe/?keyword=20262621" },
    { text: "茶ICP备2026070373号", href: "https://icp.gov.moe/?keyword=2026070373" },
    { text: "元ICP备00688号", href: "https://icp.gov.moe/?keyword=00688" },
  ],
  license: { text: "CC-BY-4.0", href: "https://creativecommons.org/licenses/by/4.0/" },
} as const;

export const SOCIALS = [
  {
    label: "GitHub",
    handle: "@Brandon-LIs",
    href: "https://github.com/Brandon-LIs",
    note: "开源项目都在这儿",
  },
  {
    label: "博客",
    handle: "blog.oopss.top",
    href: "https://blog.oopss.top",
    note: "技术笔记与生活记录",
  },
  {
    label: "邮箱",
    handle: "bcihal@qq.com",
    href: "mailto:bcihal@qq.com",
    note: "最可靠的联系方式",
  },
] as const;

/** 标题里的一段文字，accent 为真时用朱砂色点出来。 */
export type HeadlineSegment = { text: string; accent: boolean };

/** 首屏的一句话定位——页面第一眼要传达的东西。 */
export const HERO: {
  headline: HeadlineSegment[][];
  lede: string;
  meta: string;
} = {
  /* 标题分两行，其中一段用朱砂色点出来。
     这是版面里唯一的"重音"，用来告诉读者哪半句是重点。 */
  headline: [
    [
      { text: "你好，我是 ", accent: false },
      { text: "Brandon", accent: true },
    ],
    [{ text: "写代码，也写生活", accent: false }],
  ],
  lede: "从 Python 和 HTML/CSS 入门，眼下主要写前端，剩下的时间给 AI 和硬件。学到什么就想马上做出来试试，做完再写篇文章记一下。",
  meta: "校园科创社社长",
};

/** 事实卡片：用可验证的具体信息替代抽象自我评价。 */
export const FACTS = [
  {
    label: "现在",
    value: "提前半年升入高中",
    detail: "通过拔尖创新人才培养选拔考试，比同届早半年进入高中",
  },
  {
    label: "在做",
    value: "校园科创社社长",
    detail: "带着同学把点子做成能跑的东西，软件硬件都有",
  },
  {
    label: "拿过",
    value: "全国二等奖",
    detail:
      "第二十七届全国师生数字素养提升实践活动 · 「幕影千年」皮影艺术互动体验装置",
  },
  {
    label: "习惯",
    value: "做完就写下来",
    detail: "踩过的坑和比赛失利的复盘都会写。七月的国赛只拿了二等奖，整场复盘也发出来了",
  },
] as const;

/**
 * 工作环境。
 *
 * 这类信息很具体，也几乎无法伪造，比"热爱技术"有用得多。
 * 灵感来自同行的个人站，但内容全部换成他自己真实在用的东西。
 */
export const SETUP = [
  { label: "系统", value: "Windows · Linux" },
  { label: "编辑器", value: "VS Code" },
  { label: "主力语言", value: "TypeScript · Python" },
  { label: "硬件", value: "行空板 M10 · ESP32 · 树莓派" },
  { label: "部署", value: "Cloudflare Workers · Vercel" },
  { label: "时区", value: "UTC+8" },
] as const;

export const SKILLS = [
  {
    group: "语言",
    items: ["TypeScript", "JavaScript", "Python", "C++", "HTML5", "CSS3"],
  },
  {
    group: "框架与运行时",
    items: ["React", "Vue.js", "Next.js", "Node.js", "Express", "Docusaurus"],
  },
  {
    group: "云与基础设施",
    items: [
      "Cloudflare Workers",
      "D1 · KV · R2",
      "Vercel",
      "GitHub Actions",
      "Git",
    ],
  },
  {
    group: "硬件与实验",
    items: ["行空板 M10", "ESP32", "Arduino", "MQTT", "树莓派", "AI 工程化"],
  },
] as const;

export type Project = {
  year: string;
  category: string;
  name: string;
  tagline: string;
  detail: string;
  stack: readonly string[];
  href: string;
  hrefLabel: string;
  /** 有在线 demo 的项目才给这个字段 */
  demo?: string;
};

/**
 * 项目清单。按"最能说明这个人在做什么"排序，
 * 每条都能点进去看到真实代码或实现记录。
 */
export const PROJECTS: readonly Project[] = [
  {
    year: "2026",
    name: "幕影千年",
    category: "竞赛作品 · 软硬结合",
    tagline: "皮影艺术互动体验装置",
    detail:
      "国赛作品。行空板 M10 上跑 Flask 服务并自己开 Wi-Fi 热点，MQTT 把 Arduino 的多组舵机连起来做对角联动，摄像头识别手势，Unreal Engine 里做了个数字孪生同步演示。四端要同时跑通，这部分最费劲。",
    stack: ["行空板 M10", "MQTT", "Arduino", "Unreal Engine"],
    href: "https://blog.oopss.top/docs/2026kc2",
    hrefLabel: "创作说明",
  },
  {
    year: "2026",
    name: "智学AI",
    category: "AI 应用 · 全栈",
    tagline: "让 AI 帮你听懂名师视频",
    detail:
      "市面上的 AI 解题都是让模型自己讲一遍。这个反过来：AI 不讲课，只帮你把已经存在的名师视频看懂。收了 770 多条高中数学视频、248 位 UP 主，搜索、播放、提问连在一起。",
    stack: ["Express", "SQLite", "Vite", "KaTeX", "多模型 AI"],
    href: "https://github.com/Brandon-LIs/SmartMath",
    hrefLabel: "GitHub",
  },
  {
    year: "2026",
    name: "airportal",
    category: "网络工具 · 全栈",
    tagline: "文件快传",
    detail:
      "浏览器之间传文件的小工具。6 位取件码取件，有效期从 1 小时到 7 天可选，20 多种格式能直接在网页里预览，接了 12 种第三方登录。跑在 Cloudflare Workers 上，存储可以用 S3 或 R2。",
    stack: ["Cloudflare Workers", "S3 / R2"],
    href: "https://github.com/Brandon-LIs/airportal",
    hrefLabel: "GitHub",
  },
] as const;

export const BLOG_STATS = {
  url: "https://blog.oopss.top",
  rss: "https://blog.oopss.top/blog/rss.xml",
  sitemap: "https://blog.oopss.top/sitemap.xml",
  /** 首篇《欢迎来到我的博客》发布于 2026-07-31。 */
  since: "2026 年 7 月",
} as const;

/** 关于页里自我描述的要点，用于「关于」区块的叙事。 */
export const ABOUT_PARAGRAPHS = [
  "初中快毕业才开始认真学编程。从 Python 和 HTML/CSS 入门，后来慢慢摸到 Vue、React 和 Node.js。现在主要写前端。",
  "去年通过拔尖创新人才选拔，提前半年升入高中。在学校是科创社社长，平时带着同学做东西，从网页到行空板和 ESP32 都碰。",
  "做过的项目都留在 GitHub 上。七月的国赛只拿到二等奖，回来把整场复盘写了，哪一步做砸了也写进去了。",
] as const;
