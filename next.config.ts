import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    // ナビゲーションフォールバックを無効化 — LP の HTML を /app に返さないため
    navigateFallback: null,
    exclude: [
      /\.map$/,
      /^manifest.*\.webmanifest$/,
      /middleware-manifest\.json$/,
      /_headers$/,
      /_routes\.json$/,
    ],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  turbopack: {},
};

export default withPWA(nextConfig);

