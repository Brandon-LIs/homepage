import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE, HERO } from "@/data/site";

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 与 globals.css 中同名令牌保持一致。 */
const BG = "#fbfaf8";
const INK = "#14110e";
const INK_2 = "#5c5751";
const INK_3 = "#8a847d";
const BRAND = "#ae4104";
const LINE = "#e6e2dc";

/**
 * 分享卡片。
 *
 * 设计语言与页面一致：纸底、墨字、朱砂橙。左侧压一条朱砂色，
 * 右上一团柔和的暖光呼应首屏"灯从纸幕后面透出来"的构图。
 * 标题沿用页面的宋体，避免分享出去变成一张和站点无关的图。
 * 构建期生成静态 PNG，不增加运行时开销。
 */
export default async function OpengraphImage() {
  // 用 TTF 而不是页面那份 WOFF2：Satori 只认 TTF/OTF，不认 wOF2。
  // 这份是按同一字符集子集化的（141 KB），放在 assets/ 下随仓库提交，
  // 因为构建时必须能读到它。
  const songti = await readFile(
    join(process.cwd(), "assets/fonts/songti-700.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: "68px 76px",
          fontFamily: "Songti, sans-serif",
          position: "relative",
        }}
      >
        {/* 右侧暖光，来自皮影幕布的背光 */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 720,
            height: 720,
            borderRadius: 720,
            background: BRAND,
            opacity: 0.09,
          }}
        />
        {/* 左侧朱砂色竖条，是唯一的实色块 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            background: BRAND,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: BRAND,
              color: BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ fontSize: 27, color: INK_2, letterSpacing: 0.2 }}>
            {SITE.url.replace(/^https?:\/\//, "")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              color: INK,
              letterSpacing: -1.2,
              lineHeight: 1.16,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {HERO.headline.map((line, i) => (
              <span key={i} style={{ display: "flex" }}>
                {line.map((seg, j) => (
                  <span key={j} style={{ color: seg.accent ? BRAND : INK }}>
                    {seg.text}
                  </span>
                ))}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 28,
              color: INK_2,
            }}
          >
            <span>前端 · 计算机科学 · AI</span>
            <span style={{ color: LINE }}>|</span>
            <span>宜昌</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: INK_3,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 26,
          }}
        >
          <span>{SITE.name} · 个人主页</span>
          <span>「我们都有光明的未来」</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Songti",
          data: songti,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
