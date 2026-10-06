# Brandon · 个人主页

`oopss.top` 的源代码。一个为个人门面重新设计的静态站点：亮色默认 + 完整暗色主题，桌面端有跟随指针的点阵场，移动端自动降级为静态。

配套的博客在 [blog.oopss.top](https://blog.oopss.top)，与本仓库相互独立。

---

## 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 框架 | **Next.js 16**（App Router，静态导出式渲染） | 首页无动态数据依赖，构建期即可产出完整 HTML |
| 语言 | **TypeScript**（`strict`） | 个人信息集中在一个数据文件里，类型能挡住串联错误 |
| 样式 | **原生 CSS + 自定义属性** | 设计是扁平的、一次性的，不需要原子类；产出更小、可读性更高 |
| 字体 | **中文宋体子集化自托管 + Geist** | 标题用 Noto Serif SC 子集（12 MB → 127 KB），正文用系统无衬线 |
| 配图 | **AI 生成 + 脚本处理** | 用 gpt-image-gen 生成原图，再按设计需要裁切、压缩成 AVIF/WebP |
| 动效 | **手写 Canvas + IntersectionObserver** | 需求很具体（点阵位移场），引库只会更重 |
| 部署 | **Vercel** | 免费额度足够，push 即部署 |

**没有使用的依赖**：UI 组件库、CSS-in-JS、动画库、图标库。总计运行时依赖只有 `next` / `react` / `react-dom` 三个。

---

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 http://localhost:3000 。

其他脚本：

```bash
pnpm build      # 生产构建
pnpm start      # 本地预览生产构建
pnpm typecheck  # TypeScript 检查
pnpm lint       # ESLint
```

---

## 部署到 Vercel（免费）

### 方式一：Git 集成（推荐，之后 push 即自动部署）

1. 把本目录推到 GitHub：

   ```bash
   git init
   git add .
   git commit -m "feat: 新版个人主页"
   git branch -M main
   git remote add origin git@github.com:Brandon-LIs/homepage.git
   git push -u origin main
   ```

2. 打开 [vercel.com/new](https://vercel.com/new)，用 GitHub 登录，选中这个仓库。
3. Vercel 会自动识别为 Next.js，**所有配置保持默认即可**，直接 Deploy。
4. 部署完成后在 **Settings → Domains** 里添加 `oopss.top`。

### 方式二：命令行

```bash
pnpm dlx vercel        # 首次会引导登录与关联项目
pnpm dlx vercel --prod # 发布到生产环境
```

### 绑定 oopss.top 域名

在 Vercel 项目的 **Settings → Domains** 添加两个域名：

- `oopss.top`（主域名，本仓库的 canonical 指向它）
- `www.oopss.top`（Vercel 会自动 308 跳转到主域名）

然后到你的域名 DNS 服务商处按下表配置：

| 类型 | 名称 | 值 |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> **注意**：`oopss.top` 目前已经指向一个旧的 Next.js 站点。切换时请先在 Vercel 把新项目部署好并确认域名验证通过，再改动 DNS，避免出现空窗期。
>
> 博客所在的 `blog.oopss.top` 是独立部署，**不要动它的 DNS 记录**。

`status.oopss.top` 同理，与本站无关。

### 换域名要改哪里

如果最终没有用 `oopss.top`，只需要改一个文件：`src/data/site.ts` 里的 `SITE.url`。canonical、Open Graph、sitemap、robots 全部由它派生。

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx            # 根布局：字体、元数据、主题启动脚本、JSON-LD
│   ├── page.tsx              # 首页全部区块（Hero / 关于 / 项目 / 写作 / 联系）
│   ├── globals.css           # 设计令牌 + 基础排版（唯一的设计源头）
│   ├── layout.css            # 布局原语与入场/揭示动画
│   ├── components.css        # 组件样式
│   ├── opengraph-image.tsx   # 构建期生成分享卡片 PNG
│   ├── robots.ts / sitemap.ts
│   └── not-found.tsx
├── components/
│   ├── SiteHeader.tsx        # 吸顶导航 + 移动端抽屉
│   ├── SiteFooter.tsx
│   ├── ThemeToggle.tsx       # 亮/暗切换，无闪烁
│   ├── DotField.tsx          # 指针反应点阵（桌面专属）
│   ├── Reveal.tsx            # 滚动揭示包装器
│   └── PostCard.tsx
├── data/
│   └── site.ts               # ★ 所有个人信息集中在这里
└── lib/
    └── posts.ts              # 构建期从博客 RSS 取最新文章
```

### 改内容只需要动一个地方

自我介绍、技能、项目、联系方式、社交链接**全部**在 `src/data/site.ts`。页面组件只负责呈现，不硬编码文案；域名也只由 `SITE.url` 派生（canonical、OG、sitemap、robots、JSON-LD 都跟着走）。

---

## 已验证的结果

下面这些不是"应该没问题"，是在本机生产构建上实测跑出来的：

| 检查项 | 结果 |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | 全部通过，无警告 |
| Lighthouse 桌面端 | 性能 **100** / 无障碍 100 / 最佳实践 100 / SEO 100 |
| Lighthouse 移动端（三次取中位数） | 性能 **90** / 无障碍 **100** / 最佳实践 **100** / SEO **100** |
| 累积布局偏移（CLS） | **0**（两套主题、所有视口） |
| 正文对比度 | 两套主题全部 ≥ 4.5:1（最小号元信息 4.65:1） |
| 水平溢出 | 1440 / 1120 / 820 / 390 四个宽度均无 |
| 禁用 JavaScript | 全部内容正常渲染，不出现空白区块 |
| `prefers-reduced-motion` | Canvas 不挂载，揭示动画直接呈现终态 |
| 触屏点击目标 | 全部 ≥ 44px（390px 视口实测） |
| 键盘可达 | 所有交互元素可 Tab，焦点环清晰可见 |
| 主题切换 | 默认跟随系统、手动选择持久化、首帧无闪烁 |

---

## 几个刻意的设计决定

**主题不闪烁。** `<head>` 里有一段阻塞脚本，在浏览器首次绘制前就把 `data-theme` 写到 `<html>` 上。如果用 React state 来切主题，暗色用户会先看到一帧白屏。`ThemeToggle` 也不维护自己的 state，而是订阅 DOM 属性——服务端与客户端首次渲染结果一致，既没有水合不一致，也不必在 effect 里同步 setState。

**动效永远不会让内容消失。** 所有揭示动画的起点都是"内容已经可见"，只有 JS 确认可用时才加上待揭示状态（`html.js .reveal`）。爬虫、禁用 JS 的浏览器、以及后台标签页都不会渲染出空白区块。

**指针层在移动端完全不加载。** `DotField` 通过 `useSyncExternalStore` 读取 `pointer: fine` + `hover: hover` + 未开启减少动效，三者不满足就不渲染 canvas。触屏用户不会为一段用不上的代码付出任何解析成本。

**首屏动效不用 `filter: blur()`。** 大字号中文标题上做模糊合成在移动端开销明显，还会把最大内容元素的绘制时间往后推。只用 `transform` + `opacity`，两者都能走合成层。

**不用 `mix-blend-mode` 铺满整屏。** 纸纹最初用混合模式叠在首屏上，好看但代价大：整屏混合层会让浏览器每一帧重新合成整个 hero，而 hero 里正好有个每帧重绘的 canvas。改成普通透明度叠加后，“样式与布局”耗时从 1531ms 降到 920ms，移动端中位分从 74 回到 90。

**点阵静止时会停机。** 位移和速度都小到看不见时，点被吸附回静止位并走快速绘制路径；全部静止且指针不在画面上时，直接停掉 `requestAnimationFrame`。指针移动、改变窗口大小、切换主题都会把它唤醒重画。

**Canvas 是替换元素。** `<canvas>` 只写 `position: absolute; inset: 0` 不会撑开，会退回 300×150 的内在尺寸。必须显式给 `width/height: 100%`。

**Canvas 必须显式指定尺寸。** `<canvas>` 是替换元素，只写 `position: absolute; inset: 0` 不会撑开它——会退回 300×150 的内在尺寸。这个坑在开发时真的踩到了，现在用 `width/height: 100%` 固定住。

**中文不加载网页字体。** 拉丁字形用自托管的可变字体，中文交给系统字体（PingFang SC / 微软雅黑 / Noto Sans CJK）。字体子集化能把中文压到几百 KB，但代价是首屏阻塞和字形缺失风险——系统字体在三个平台上都足够好看。

**文章在构建期抓取。** 首页不为了几篇文章让访客多等一次网络往返，也不把博客的可用性绑到自己身上。RSS 拉取失败时回落到代码内的快照，页面照样完整。

---

## 无障碍

按 WCAG 2.2 AA 实施，两套主题分别验证：

- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1（`--ink-3` 是最小号元信息色，已确保达标）
- 全部可键盘操作，含"跳到主要内容"链接；焦点环在两套主题下都可见
- `prefers-reduced-motion: reduce` 时所有动画退化为瞬时终态，Canvas 不挂载
- 装饰性元素标记 `aria-hidden`，Canvas 不进入 tab 序列
- 触屏下不依赖 hover 传递信息，点击目标 ≥ 44px

---

## 许可

代码部分可自由参考。站内文字与图片内容版权归 Brandon 所有（[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)）。
