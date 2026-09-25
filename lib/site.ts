import type { Metadata } from "next";

// Preview deployments must retain the public identity and stay out of search.
const configuredUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tivorah.com");
export const siteOrigin = /\.(vercel\.app|netlify\.app|up\.railway\.app)$/.test(configuredUrl.hostname)
  ? "https://tivorah.com" : configuredUrl.origin;
export const indexingDisabled = process.env.SITE_NOINDEX === "true"
  || process.env.VERCEL_ENV === "preview"
  || ["deploy-preview", "branch-deploy"].includes(process.env.CONTEXT || "");
export const socialImage = { url: "/social-preview.png", width: 1200, height: 630, alt: "Tivorah — Find your people. Build your life in Australia." };

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "Tivorah", locale: "en_AU", title, description, url: path, images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}
