import type { NextConfig } from "next";

/**
 * Next.js 配置文件
 * 功能：配置图片域名白名单等设置
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_IMAGE_HOSTNAME || "localhost",
      },
      {
        protocol: "https",
        hostname: "q.qlogo.cn",
      },
      {
        protocol: "http",
        hostname: "q.qlogo.cn",
      },
    ],
  },
};

export default nextConfig;
