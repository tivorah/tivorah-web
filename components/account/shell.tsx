"use client";
import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { SectionSidebar, useSection } from "../ui/section-nav";

function AccountSidebarIdentity() {
  return <div className="section-sidebar-title"><Image src="/tivorah-mark.png" alt="" width={40} height={40} /><span><strong>Your account</strong><small>Tickets, appointments and messages</small></span></div>;
}

function Shell({ children }: { children: ReactNode }) {
  const section = useSection();
  return <div className="product-page page-shell account-shell"><div className="section-workspace">
    {section ? <SectionSidebar section={section} identity={<AccountSidebarIdentity />} /> : null}
    <div className="section-workspace-main">{children}</div>
  </div></div>;
}

/** Your account with the side nav beside each page, as in the business workspace (phones and
 * tablets: the same links in the header menu). */
export function AccountShell({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="product-page page-shell account-shell"><div className="section-workspace"><aside className="section-sidebar" aria-hidden="true"><AccountSidebarIdentity /></aside><div className="section-workspace-main">{children}</div></div></div>}><Shell>{children}</Shell></Suspense>;
}
