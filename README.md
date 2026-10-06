# Brandon · 个人主页

`oopss.top` 的源代码。一个纯静态的个人主页：亮色默认 + 完整暗色主题，桌面端有跟随指针的点阵场，移动端自动降级。

配套博客在 [blog.oopss.top](https://blog.oopss.top)，与本仓库相互独立。**博客发文后，这里会自动同步最新文章并重新部署**，见下文。

---

## 为什么是 Astro 而不是 Next.js

第一版用的是 Next.js。能跑，但有个说不通的地方：这是一个以文字为主的单页站点，却要传输 **477 KB 的 JavaScript**——React 运行时、路由、渲染器全都要带上，而页面上真正需要脚本的只有「主题切换」「移动端菜单」「指针点阵」这三件小事。

改用 Astro 后默认零 JS，需要交互的地方按需加载原生脚本：

| | Next.js 版 | Astro 版 |
|---|---|---|
| JavaScript（gzip） | 477 KB | **5.8 KB** |
| 首屏总传输 | 933 KB | **约 240 KB** |
| 请求数 | 20 | **8** |
| 移动端 Lighthouse | 90 | **99** |
| 最大内容绘制 | 3.3 s | **2.2 s** |
| 总阻塞时间 | 130 ms | **0 ms** |

桌面端四项指标（性能 / 无障碍 / 最佳实践 / SEO）全部 **100**。

---

## 技术选型

| 项 | 选择 | 理由 |
|---|---|---|
| 框架 | **Astro 7**（`output: "static"`） | 默认零 JS，交互按需加载 |
| 语言 | **TypeScript**（strict） | 个人信息集中在一个数据文件里，类型能挡住串联错误 |
| 样式 | **原生 CSS + 自定义属性** | 设计是一次性的，不需要原子类；产出更小 |
| 字体 | **子集化自托管**（宋体 127 KB + Geist 29 KB） | 构建期落盘，运行时不请求任何第三方域名 |
| 分享卡片 | **satori + resvg，构建期生成** | 纯静态站点只需要一张固定图，不必引动态 OG 路由 |
| 部署 | **Vercel** | 免费额度足够，push 即部署 |

运行时依赖只有 `astro` 一个。

---

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

其他脚本：

```bash
pnpm build      # 抓文章 → 构建 → 生成分享卡片
pnpm preview    # 本地预览构建产物
pnpm check      # Astro 类型与模板检查
pnpm lint       # ESLint
```

`build` 里的第一步刻意用 `||` 而不是 `&&`：RSS 抓不到时只提示一句、
继续构建，而不是让整条命令链中断。抓取失败应当是"这次没更新"，
不是"站点挂了"。

---

## 文章自动同步

这是整站唯一需要"自动化"的部分。

### 它是怎么工作的

`scripts/fetch-posts.mjs` 在**构建期**抓取博客 RSS，解析后写成 `src/data/posts.json`。页面直接读这个 JSON，所以：

- 访客打开首页时**不需要**任何额外网络请求，文章已经是 HTML 的一部分；
- 博客临时挂了也不影响主页——抓取失败时脚本以非零码退出，**保留上一次的 `posts.json`**，页面照常构建（已实测验证）。

### 三种触发方式

`.github/workflows/sync-posts.yml` 任意一种都会跑：

1. **手动**：仓库 Actions 页面点 `Run workflow`
2. **定时兜底**：每天北京时间凌晨 4 点
3. **发文即触发**（推荐，最快）：在博客仓库加一个 workflow，发文后调用本仓库的 `repository_dispatch`

第 3 种需要在两个仓库之间配一个 token：

1. 建一个细粒度 Personal Access Token，只给 `Brandon-LIs/homepage` 仓库的 **Contents: Read and write** 权限。
2. 把它存成**博客仓库**的 Secret，例如 `HOMEPAGE_DISPATCH_TOKEN`。
3. 在博客仓库加 `.github/workflows/notify-homepage.yml`：

```yaml
name: 通知主页更新
on:
  push:
    branches: [main]
    paths:
      - "blog/**"        # 改成你博客文章所在的目录
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: 触发主页同步
        run: |
          curl -sS -X POST \
            -H "Authorization: Bearer ${{ secrets.HOMEPAGE_DISPATCH_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/Brandon-LIs/homepage/dispatches \
            -d '{"event_type":"blog-updated"}'
```

这样发文后一分钟内主页就会更新。

### 换博客地址

只改 `scripts/fetch-posts.mjs` 顶部的 `RSS_URL`。

### 新文章没有配图怎么办

`scripts/process-covers.py` 里有张"本地封面"映射表。新文章不在表里时会**自动回落到博客的远程原图**。想让新封面也统一成站点的低饱和风格，把文章 slug 加进那张表、重跑一次脚本即可。

---

## 项目结构

```
scripts/
├── fetch-posts.mjs        # 构建期抓 RSS → src/data/posts.json
├── process-images.py      # 生图原图 → AVIF/WebP（含窄屏变体）
├── process-covers.py      # 博客封面降饱和，统一配色
├── build-font-subset.py   # 中文字体子集化（12 MB → 127 KB）
└── build-og.mjs           # 生成 public/og.png

src/
├── layouts/Base.astro     # <head>、主题启动脚本、预加载、JSON-LD
├── pages/
│   ├── index.astro        # 首页全部区块
│   └── 404.astro
├── components/
│   ├── SiteHeader.astro   # 吸顶导航（logo 用裁切过的头像）+ 移动端抽屉
│   ├── SiteFooter.astro
│   ├── DotField.astro     # 指针点阵容器（默认 hidden）
│   └── PostCard.astro
├── scripts/               # 客户端脚本（原生 TS，无框架）
│   ├── site.ts            # 主题切换、吸顶分隔线、移动端菜单
│   ├── reveal.ts          # 滚动揭示
│   └── dotfield.ts        # 指针反应点阵
├── styles/
│   ├── fonts.css          # @font-face
│   ├── tokens.css         # 设计令牌 + 基础排版
│   ├── base.css           # 布局原语与动画
│   └── components.css     # 组件样式
└── data/
    ├── site.ts            # ★ 所有个人信息集中在这里
    └── posts.json         # ← 由脚本生成，不要手改
```

### 改内容只需要动一个地方

自我介绍、技能、项目、联系方式、社交链接**全部**在 `src/data/site.ts`。域名也只由 `SITE.url` 派生。

---

## 已验证的结果

不是"应该没问题"，是在生产构建上实测跑出来的：

| 检查项 | 结果 |
|---|---|
| `pnpm lint` / `pnpm check` / `pnpm build` | 全部通过，0 error 0 warning |
| Lighthouse 桌面端 | 性能 **100** / 无障碍 100 / 最佳实践 100 / SEO 100 |
| Lighthouse 移动端（三次取中位数） | 性能 **99** / 无障碍 **100** / 最佳实践 **100** / SEO **100** |
| 累积布局偏移（CLS） | **0**（两套主题、所有视口） |
| 正文对比度 | 两套主题全部 ≥ 4.5:1 |
| 水平溢出 | 1440 / 1120 / 820 / 390 四个宽度均无 |
| 禁用 JavaScript | 全部内容正常渲染，不出现空白区块 |
| `prefers-reduced-motion` | Canvas 不参与渲染，揭示动画直接呈现终态 |
| 触屏 | Canvas 不加载，点击目标全部 ≥ 44px |
| 键盘可达 | 所有交互元素可 Tab，焦点环清晰可见 |
| 主题切换 | 默认跟随系统、手动选择持久化、首帧无闪烁 |
| RSS 抓取失败 | `posts.json` 不被破坏，站点照常构建 |

---

## 几个刻意的设计决定

**主题不闪烁。** `<head>` 里有一段内联阻塞脚本，在浏览器首次绘制前就把 `data-theme` 写到 `<html>` 上。如果用框架状态来切主题，暗色用户会先看到一帧白屏。

**动效永远不会让内容消失。** 所有揭示动画的起点都是"内容已经可见"，只有脚本确认可用时才加上待揭示状态（`html.js .reveal`）。爬虫、禁用 JS 的浏览器、后台标签页都不会渲染出空白区块。

**指针点阵默认不存在。** 容器一开始是 `hidden` 的，脚本确认 `pointer: fine` + `hover: hover` + 未开启减少动效之后才显示并开始绘制。触屏用户既不下载那段代码，Canvas 也不参与布局。

**点阵静止时会停机。** 位移看不出来时点被吸附回静止位并走快速路径；全部静止且指针离开就停掉 `requestAnimationFrame`。指针移动、改变窗口大小、切换主题都会唤醒重画。

**首屏动效不用 `filter: blur()`。** 大字号中文标题上做模糊合成在移动端开销明显，还会推迟最大内容元素的绘制。只用 `transform` + `opacity`。

**不用 `mix-blend-mode` 铺满整屏。** 纸纹最初用混合模式叠在首屏上，但整屏混合层会让浏览器每帧重新合成整个 hero，而 hero 里正好有个每帧重绘的 canvas。改成普通透明度叠加后，「样式与布局」耗时从 1531ms 降到 920ms。

**Canvas 是替换元素。** 只写 `position: absolute; inset: 0` 不会撑开它，会退回 300×150 的内在尺寸，必须显式给 `width/height: 100%`。

**从 `next/image` 换成原生 `<img>` 时要补回定位。** `fill` 属性会在行内注入 `position: absolute; inset: 0`，所以 CSS 里不用写。换成原生 `<img>` 后这些都没了，图片退回文档流：浏览器在图片加载完成前拿不到内在比例，就把 `height="420"` 当成固定高度，再被 `max-width` 压到容器宽度——封面被拉成 116×420 的长条，宽高比全乱。现在靠显式绝对定位撑满封面框。

**画布尺寸变化要用 ResizeObserver，不能只监听 window。** 标题字体加载完会重新换行、hero 高度随之变化，这类改变不触发 `window.resize`，只监听 window 会让画布位图比容器高一截（实测差 70px 左右，表现为点阵略微纵向拉伸）。

**左上角用裁切过的头像。** 原图是一张插画，五官明显偏左（眼睛在 34% 处），直接圆形裁切在 32px 下会糊成一团白色。`avatar-mark-64/128` 是以脸部为中心重新裁的正方形，小尺寸下眼睛和轮廓还认得出来，并按 1x/2x 提供。

**中文不加载网页字体。** 标题用宋体子集（12 MB → 121 KB，OFL 许可）；正文交给系统字体（PingFang SC / 微软雅黑 / Noto Sans CJK）。正文用宋体会累，用黑体是中文长文的通行做法。

**字体子集必须在构建之后生成。** 这是踩过最深的一个坑：

子集原本在构建前扫源码生成，覆盖 `src/` 和 OG 脚本。但博客文章的标题与摘要是构建期从 RSS 抓的，那些字不在源码里——于是页面上 **62 个汉字**（鼠标垫、贵阳、崩溃、链接……）在标题字体里没有字形，回落成系统字体。同一句话里两种字体，肉眼很明显。

试过"两级字体 + `unicode-range` 兜底"，但中文码点是散开的，无法用区间把两级切开，实测浏览器会把两个文件都下载（白费 785 KB），方案作废。

最终做法：`astro build` 之后跑 `subset-font-after-build.mjs`，从**生成好的 HTML** 里提取真正用到的字符，再回填精确子集：

- 子集化的来源是 `assets/fonts/songti-master.woff2`（GB2312 全集，6887 字）。**不能拿页面子集当来源**——那样无论传多少字都只能取到已有字形，表面看问题修好了，其实只是碰巧覆盖，下篇新文章照样缺字。
- 脚本自带自检：产出后逐字验证页面汉字是否都有字形，缺一个就报错。这个校验正是它发现的「腌」「笃」两个二级字不在 GB2312 一级字表里。
- 母集只在构建期使用、不进部署产物。下发字体只含页面实际用字，**121 KB**；把 6800 字全塞进去要多下 785 KB，得不偿失。

---

## 部署到 Vercel

### 方式一：Git 集成（推荐）

```bash
git init && git add . && git commit -m "feat: 新版个人主页"
git branch -M main
git remote add origin git@github.com:Brandon-LIs/homepage.git
git push -u origin main
```

然后打开 [vercel.com/new](https://vercel.com/new) 选中该仓库。Vercel 会自动识别 Astro，**配置保持默认**，直接 Deploy。

### 方式二：命令行

```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

### 绑定域名

| 类型 | 名称 | 值 |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> **注意**：`oopss.top` 目前指向旧的站点。建议先在 Vercel 部署并验证通过，再改 DNS。
> `blog.oopss.top` 与 `status.oopss.top` 是独立部署，**不要动它们的记录**。

如果最终没用 `oopss.top`，改 `src/data/site.ts` 的 `SITE.url`，以及 `public/robots.txt`、`public/sitemap.xml` 里的域名。

---

## 无障碍

按 WCAG 2.2 AA 实施，两套主题分别验证：

- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1
- 全部可键盘操作，含"跳到主要内容"链接
- `prefers-reduced-motion: reduce` 时动画退化为瞬时终态，Canvas 不渲染
- 装饰性元素标记 `aria-hidden`，Canvas 不进入 tab 序列
- 触屏下不依赖 hover 传递信息，点击目标 ≥ 44px

---

## 仓库说明

这个仓库原本 fork 自 [QQHKX/qqhkx-homepage](https://github.com/QQHKX/qqhkx-homepage)，
2026 年 10 月改版时整站重写（Next.js → Astro），旧源码完整保留在
[`legacy-nextjs`](https://github.com/Brandon-LIs/homepage/tree/legacy-nextjs) 分支。

新站用到的第三方资源：

- 字体 [Noto Serif SC](https://github.com/notofonts/noto-cjk) 与 [Geist](https://vercel.com/font)，均为 SIL OFL 1.1
- 配图由 AI 生成后自行处理，着色取自本人作品「幕影千年」

## 许可

代码部分可自由参考。站内文字与图片内容版权归 Brandon 所有（[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)）。
