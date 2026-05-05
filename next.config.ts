import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    navigateFallback: null,
    // Cloudflare 特殊ファイルを precache から除外 (manifestTransforms で確実に除去)
    manifestTransforms: [
      (entries: any[]) => ({
        manifest: entries.filter((e: any) => !['/_headers', '/_routes.json'].some(p => e.url === p || e.url.endsWith(p))),
        warnings: [],
      }),
    ],
    exclude: [
      /\.map$/,
      /^manifest.*\.webmanifest$/,
      /middleware-manifest\.json$/,
      /_headers/,
      /_routes\.json/,
    ],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  turbopack: {},
};

export default withPWA(nextConfig);

