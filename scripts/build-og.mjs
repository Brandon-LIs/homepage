#!/usr/bin/env node
/**
 * 生成分享卡片 public/og.png。
 *
 * 为什么自己画而不是用框架的动态 OG：
 *   这是纯静态站点，分享卡片其实只需要一张固定图。构建期用
 *   satori（HTML/CSS 子集 → SVG）+ resvg 转 PNG，产物直接进 public/，
 *   运行时零成本，也不用为了一个路由引一整个渲染管线。
 *
 * 设计语言与页面一致：纸底、墨字、朱砂橙，标题沿用宋体子集。
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// 与 src/styles/tokens.css 中同名令牌保持一致
const BG = "#fbfaf8";
const INK = "#14110e";
const INK_2 = "#5c5751";
const INK_3 = "#8a847d";
const BRAND = "#ae4104";
const LINE = "#e6e2dc";

const W = 1200;
const H = 630;

function el(type, style, children) {
  return { type, props: { style, children } };
}

const tree = el(
  "div",
  {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: BG,
    padding: "68px 76px",
    position: "relative",
    fontFamily: "Songti",
  },
  [
    // 右上一团暖光，呼应首屏"灯从纸幕后面透出来"
    el("div", {
      position: "absolute",
      top: -180,
      right: -120,
      width: 720,
      height: 720,
      borderRadius: 360,
      backgroundColor: BRAND,
      opacity: 0.09,
    }),
    // 左侧朱砂竖条，页面上唯一的实色块
    el("div", {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 10,
      backgroundColor: BRAND,
    }),

    el("div", { display: "flex", alignItems: "center", gap: 16 }, [
      el(
        "div",
        {
          width: 46,
          height: 46,
          borderRadius: 13,
          backgroundColor: BRAND,
          color: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        },
        "B"
      ),
      el("div", { fontSize: 27, color: INK_2, letterSpacing: 0.4 }, "oopss.top"),
    ]),

    el("div", { display: "flex", flexDirection: "column", gap: 26 }, [
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          fontSize: 78,
          color: INK,
          letterSpacing: -1.2,
          lineHeight: 1.18,
        },
        [
          el("div", { display: "flex" }, [
            el("span", {}, "你好，我是 "),
            el("span", { color: BRAND }, "Brandon"),
          ]),
          el("div", { display: "flex" }, "写代码，也写生活"),
        ]
      ),
      el(
        "div",
        { display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: INK_2 },
        [
          el("span", {}, "前端 · 计算机科学 · AI"),
          el("span", { color: LINE }, "|"),
          el("span", {}, "开源项目在 GitHub"),
        ]
      ),
    ]),

    el(
      "div",
      {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 24,
        color: INK_3,
        borderTop: `1px solid ${LINE}`,
        paddingTop: 26,
      },
      [el("span", {}, "Brandon · 个人主页"), el("span", {}, "「我们都有光明的未来」")]
    ),
  ]
);

const songti = await readFile(join(ROOT, "assets/fonts/songti-700.ttf"));

const svg = await satori(tree, {
  width: W,
  height: H,
  fonts: [{ name: "Songti", data: songti, weight: 700, style: "normal" }],
});

const png = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  font: { loadSystemFonts: false },
})
  .render()
  .asPng();

const out = join(ROOT, "public", "og.png");
await writeFile(out, png);
console.log(`✓ 生成分享卡片 ${out}  (${(png.length / 1024).toFixed(1)} KB)`);
