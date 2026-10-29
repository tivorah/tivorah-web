import "./product.css";
import { Analytics } from "../components/analytics/analytics";
import { SiteFooter } from "../components/site-footer";
import { AccountProvider } from "../hooks/use-account";
import "./discovery-filters.css";
import { DiscoveryFeatures } from "../components/discovery/features";
import { FeatureRouteGate } from "../components/discovery/feature-route-gate";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { indexingDisabled, siteOrigin, socialImage } from "../lib/site";
import "./styles.css";
import "./brand.css";
import "./product-tour.css";
import "./centered-layout.css";
import "./journey-polish.css";
import "./legal.css";
import "./home-polish.css";
import "react-day-picker/style.css";
import "./date-field.css";
import "./select-field.css";
import "./shop.css";
import "./refine.css";
import "./sheet.css";
import "./form-shape.css";
import "./shop-editor.css";
import "./mobile-app.css";
import "./controls.css";
import "./theme-dark.css";
import { SiteHeader } from "./site-header";
import { THEME_BAR_COLOURS, themeBootScript } from "../lib/theme";
import { loadInitialFeatures } from "../lib/api/server-features";
import { Suspense } from "react";
import { NavigationTracker } from "../components/ui/navigation-tracker";
import { PressEffect } from "../components/ui/press-effect";
import { NavProgress } from "../components/ui/nav-progress";
import { ContentReviewDialog } from "../components/ui/content-review-dialog";

// The browser bar matches the page. No viewport-fit=cover: the browser keeps content clear of the
// notch and its own bars (cover hid the "Back to the Tivorah app" bar under the in-app browser's bar).
// The browser bar is light like the site; lib/theme.ts switches it when a page shows dark.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: THEME_BAR_COLOURS.light };

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Tivorah — Your community, wherever you are in Australia",
    template: "%s | Tivorah",
  },
  description:
    "Join Hubs, find or offer services, create or book events, and buy or sell new and used local items. Tivorah is a community app based in Adelaide, Australia.",
  robots: indexingDisabled ? { index: false, follow: false } : undefined,
  twitter: { card: "summary_large_image", images: [socialImage] },
  icons: { icon: "/tivorah-mark.png", apple: "/tivorah-mark.png" },
  openGraph: {
    images: [socialImage],
    type: "website",
    siteName: "Tivorah",
    locale: "en_AU",
    title: "Tivorah — Find your people. Build your life in Australia.",
    description:
      "Connect through Hubs, find or offer services, create or book events, and buy or sell new and used local items on Tivorah.",
  },
};

// Headline font, the same as the app's (tivorah-mobile constants/fonts.ts): self-hosted by Next at
// build time, used for h1/h2 through --font-headline (app/brand.css). Body text stays Inter/system.
const headlineFont = Bricolage_Grotesque({ subsets: ["latin"], weight: "800", display: "swap", variable: "--font-headline" });

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialFeatures = await loadInitialFeatures();
  return (
    // The pre-paint script may add data-signed-in before React hydrates.
    <html lang="en" className={headlineFont.variable} suppressHydrationWarning>
      <head>
        {/* Light or dark before the first paint (lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("tivorah-signed-in")==="1")document.documentElement.setAttribute("data-signed-in","")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AccountProvider><Analytics /><DiscoveryFeatures initialConfig={initialFeatures}>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Suspense fallback={null}><NavigationTracker /></Suspense>
          <PressEffect />
          <Suspense fallback={null}><NavProgress /></Suspense>
          <SiteHeader />
          <main id="main-content" tabIndex={-1}>
            <FeatureRouteGate>{children}</FeatureRouteGate>
          </main>
          <SiteFooter />
          <ContentReviewDialog />
        </DiscoveryFeatures></AccountProvider>
      </body>
    </html>
  );
}
