"use client";
import Link from "next/link";
import type React from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { featuresForPath, useFeature } from "./features";

/**
 * A page whose feature is switched off in Admin → Features shows this instead, on every page of
 * that feature, as the app does. It follows the live config, so an open tab updates too.
 */
export function FeatureRouteGate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const on = useFeature();
  if (featuresForPath(path).every(on)) return <>{children}</>;
  return <section className="page-shell feature-unavailable" aria-labelledby="feature-unavailable-title">
    <h1 id="feature-unavailable-title">This isn’t available right now</h1>
    <p>This section is currently unavailable. Please check back soon.</p>
    <Link className="event-primary" href="/">Go to Tivorah home</Link>
  </section>;
}

/** A link that leaves the page when its destination is switched off (e.g. Create an event with Events off). */
export function FeatureLink(props: React.ComponentProps<typeof Link>) {
  const on = useFeature();
  return featuresForPath(String(props.href)).every(on) ? <Link {...props} /> : null;
}
