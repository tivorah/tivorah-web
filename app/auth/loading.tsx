"use client";
import { usePathname } from "next/navigation";
import { AuthFormLoading } from "../../components/auth/auth-loading";
import { authModeForPath } from "../../components/auth/auth-mode";
export default function Loading() {
  return <div className="product-page page-shell"><AuthFormLoading mode={authModeForPath(usePathname())} /></div>;
}
