import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    exclude: [/_headers$/, /_routes.json$/],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  // Cloudflare Pages / OpenNext 向けの設定
  skipTrailingSlashRedirect: true,
};

export default withPWA(nextConfig);

