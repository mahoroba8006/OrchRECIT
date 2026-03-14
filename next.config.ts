import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Cloudflare Pages / OpenNext 向けの設定
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
