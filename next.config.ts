import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    navigateFallback: null,
    // 新しい SW を即座にアクティブ化し、既存タブも即座に新 SW の制御下に置く。
    // さらに古いキャッシュを自動削除して、デプロイ後のキャッシュ汚染を防止する（lessons.md §9 参照）。
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    // Cloudflare の特殊設定ファイル (_headers, _routes.json) は HTTP リソースとして 404 を返すため
    // SW の precache から除外する。public/ 配下のファイルは workboxOptions.exclude では除去できないので manifestTransforms を使用する。
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
    ],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  turbopack: {},
};

export default withPWA(nextConfig);

