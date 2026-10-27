"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SectionSidebar, useSection } from "../ui/section-nav";

function BusinessSidebarIdentity() {
  return <div className="section-sidebar-title"><Image src="/tivorah-mark.png" alt="" width={40} height={40} /><span><strong>Business workspace</strong><small>Your Tivorah tools</small></span></div>;
}

/** The business workspace: the side nav (wider screens) beside the page. Phones and tablets find the
 * same links, with icons, in the header menu (components/ui/section-nav.tsx). */
export function BusinessShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const section = useSection();
  if (path.startsWith("/business/events/") || path.startsWith("/business/listings/")) return <div className="product-page page-shell event-manage-shell">{children}</div>;
  // The shop preview is a full page, exactly like the public shop.
  if (path === "/business/shop/preview") return <>{children}</>;
  return <div className="product-page page-shell business-shell"><div className="section-workspace">
    {section ? <SectionSidebar section={section} identity={<BusinessSidebarIdentity />} /> : null}
    <div className="section-workspace-main business-workspace-main">{children}</div>
  </div></div>;
}

export function BusinessShellFallback({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/business/events/") || path.startsWith("/business/listings/")) return <div className="product-page page-shell event-manage-shell">{children}</div>;
  if (path === "/business/shop/preview") return <>{children}</>;
  return <div className="product-page page-shell business-shell"><div className="section-workspace"><aside className="section-sidebar" aria-label="Business workspace navigation"><BusinessSidebarIdentity /><Link className="section-sidebar-footer" href="/account">← Your account</Link></aside><div className="section-workspace-main business-workspace-main">{children}</div></div></div>;
}
