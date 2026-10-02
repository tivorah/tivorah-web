import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const mediaCdnHost = process.env.NEXT_PUBLIC_MEDIA_CDN_HOST?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: root,
  productionBrowserSourceMaps: false,
  devIndicators: false,
  compiler: { removeConsole: { exclude: ["error", "warn"] } },
  images: {
    // Reuse optimised responses instead of regenerating them on each visit.
    minimumCacheTTL: 86400,
    remotePatterns: [
      ...(mediaCdnHost ? [{ protocol: "https", hostname: mediaCdnHost }] : []),
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            // Camera on our own pages only: organisers scan tickets at check-in.
            value: "camera=(self), microphone=(), geolocation=()",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      ...["/account/:path*", "/business/:path*", "/auth/:path*"].map(
        (source) => ({
          source,
          headers: [
            { key: "Cache-Control", value: "private, no-store" },
            { key: "X-Robots-Tag", value: "noindex, nofollow" },
            { key: "Referrer-Policy", value: "no-referrer" },
          ],
        }),
      ),
    ];
  },
};

export default nextConfig;
