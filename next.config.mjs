import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const mediaCdnHost = process.env.NEXT_PUBLIC_MEDIA_CDN_HOST?.trim();
const production = process.env.NODE_ENV === "production";

// Content Security Policy: limits what a page can load or send, so an injected script can't run
// or phone home. Next.js still needs inline scripts for hydration (no nonce setup yet).
const origin = (value) => { try { return new URL(value).origin; } catch { return ""; } };
const apiOrigin = origin(process.env.NEXT_PUBLIC_API_URL ?? "");
const socketOrigin = apiOrigin.replace(/^http/, "ws");
const posthogOrigins = ["https://us.i.posthog.com", "https://us-assets.i.posthog.com", "https://eu.i.posthog.com", "https://eu-assets.i.posthog.com"];
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} ${posthogOrigins.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  // Development talks to the API on a LAN address over plain HTTP.
  `connect-src 'self' ${[apiOrigin, socketOrigin, ...posthogOrigins].filter(Boolean).join(" ")}${production ? "" : " http: ws:"}`,
  "frame-src https://www.google.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");

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
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
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

export { contentSecurityPolicy };
export default nextConfig;
