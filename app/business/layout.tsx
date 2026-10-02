import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessShell, BusinessShellFallback } from "../../components/business/shell";
export const metadata: Metadata = {
  title: "Manage your business",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<BusinessShellFallback>{children}</BusinessShellFallback>}><BusinessShell>{children}</BusinessShell></Suspense>;
}
