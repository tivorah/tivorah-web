"use client";
import { usePathname } from "next/navigation";
import { AuthFormLoading } from "../components/auth/auth-loading";
import { authModeForPath } from "../components/auth/auth-mode";

export default function Loading() {
  const path = usePathname();
  // Opening sign-in from elsewhere lands on this root boundary; show the
  // form-shaped sign-in skeleton there instead of the generic page skeleton.
  if (path.startsWith("/auth/") && !path.startsWith("/auth/complete")) {
    return <div className="product-page page-shell"><AuthFormLoading mode={authModeForPath(path)} /></div>;
  }
  return <section className="content recovery-state route-loading" role="status" aria-busy="true">
    <p>Loading Tivorah…</p>
    <div className="page-skeleton" aria-hidden="true"><span /><span /><span /></div>
  </section>;
}
