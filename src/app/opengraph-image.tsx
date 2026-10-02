import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.siteName}${profile.siteDomain} - 个人主页`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const tags = [...profile.languages, ...profile.frameworksAndTools].slice(0, 6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0b1120 0%, #1e1b4b 55%, #4c1d95 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 26, letterSpacing: "6px", color: "#a5b4fc" }}>
            {`${profile.siteName}${profile.siteDomain}`.toUpperCase()}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
            {profile.motto}
          </div>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>
            {`${profile.location} · ${profile.role}`}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 24,
                color: "#e2e8f0",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}