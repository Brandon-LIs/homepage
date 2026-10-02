# 部署指南

本项目为 Next.js 15 App Router 应用，构建产物为 **SSR（Serverless Functions）**，不是纯静态站点。

---

## 环境变量

### 仓库已内置 `.env`（推荐，开箱即用）

所有配置项均为 `NEXT_PUBLIC_` 前缀的**公开变量**（会打进客户端产物），不含任何密钥，因此仓库直接携带 `.env`，
Git 部署时构建阶段即可读取，**无需在平台后台逐项配置**。

需要改配置时，直接编辑仓库根目录的 `.env` 并重新推送即可。

`.env.example` 是完整的中文注释模板，字段说明以它为准。

### 改为平台端管理（可选）

若不希望配置进仓库：

```bash
# 1. 从 git 索引移除（保留本地文件）
git rm --cached .env

# 2. 删除 .gitignore 中的 .env 规则（见该文件内注释）

# 3. 在平台后台按 .env.example 逐项添加环境变量
```

> ⚠️ 两种方式**不要混用**：平台端配置的变量优先级高于仓库 `.env`，
> 若两边不一致，会出现「改了仓库却不生效」的情况。

---

## 一、EdgeOne Pages（腾讯云，推荐国内加速）

仓库已配置好，直接连接即可。

### 连接步骤

1. 打开 [EdgeOne Pages 控制台](https://console.tencentcloud.com/edgeone/pages) → **国际站**
   （无 ICP 备案务必选国际站；已备案可选中国站获得大陆加速）
2. **新建项目** → 选择 **Git 仓库** 导入
3. 填写仓库地址 `https://github.com/Brandon-LIs/homepage`
4. 构建配置（一般可自动识别 Next.js，无需改动）：

   | 配置项 | 值 |
   |---|---|
   | 框架预设 | Next.js |
   | 构建命令 | `npm run build` |
   | 安装命令 | `npm install` |
   | 输出目录 | 由框架自动识别 |
   | Node 版本 | `20.x` 或更高 |

5. 部署完成后，在 **Settings → Domains** 绑定自定义域名

### ⚠️ 关于区域与备案

CLI 部署可用 `-a overseas` 指定海外区域；**控制台 Git 部署需在项目设置中确认加速区域**。

无 ICP 备案时，必须使用**海外/国际区域**。绑定自定义域名前，
请先删除域名原有的 CDN 加速配置，避免 DNS 记录冲突。

---

## 二、Vercel

### 连接步骤

1. 打开 [vercel.com](https://vercel.com) → **Add New → Project**
2. 导入仓库 `Brandon-LIs/homepage`
3. Framework 自动识别为 Next.js，直接 Deploy
4. 部署后在 **Settings → Domains** 添加自定义域名

### 环境变量

仓库已带 `.env`，通常无需额外配置。若 `.env` 被移除，则在
**Settings → Environment Variables** 按 `.env.example` 添加。

---

## 三、CLI 部署（可选）

```bash
npm i -g edgeone@latest
edgeone login --site global
edgeone makers deploy -n <项目名> -a overseas
```

---

## 常见问题

**Q：页面上「精选项目」或社交链接区块是空的？**

A：几乎都是 `NEXT_PUBLIC_SOCIALS` / `NEXT_PUBLIC_PROJECTS` 的 JSON 被写成了多行。
dotenv 不支持未加引号的多行值，只会读到第一个字符 `[`，导致 `JSON.parse` 失败。
**把 JSON 压成一行即可。**

**Q：头像不显示？**

A：远程头像需要在 `next.config.ts` 的 `images.remotePatterns` 中放行域名；
使用本地图片（放 `public/`，以 `/xxx.jpg` 引用）则无需任何配置，推荐。

**Q：修改 `.env` 后线上没变化？**

A：`NEXT_PUBLIC_` 变量在**构建时**被内联进产物，必须重新构建部署才会生效，
不是运行时读取。

**Q：换域名后 SEO 标签仍指向旧域名？**

A：修改 `.env` 中的 `NEXT_PUBLIC_SITE_URL` 后重新部署。
它决定 canonical、`og:url` 和 `sitemap.xml` 的值。

**Q：百度/字节跳动站点验证？**

A：站点验证 meta 标签已写在 `src/app/layout.tsx` 的 `verification` 字段中，
验证文件已放在 `public/` 下，对应路径可直接访问：

- `https://你的域名/baidu_verify_codeva-ZZuKffGjLt.html`
- `https://你的域名/ByteDanceVerify.html`