"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { hasInAppHistory } from "../../lib/navigation-depth";

// "Back" that returns to wherever the visitor came from inside Tivorah (like the
// browser's back button). Opened directly or from another site, it goes to the
// fallback page instead. Modified clicks (new tab, etc.) keep normal link behaviour.
export function BackLink({ fallback, className, children = "← Back" }: { fallback: string; className?: string; children?: ReactNode }) {
  const router = useRouter();
  return <a
    href={fallback}
    className={className}
    onClick={(event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      let internal = false;
      try { internal = !!document.referrer && new URL(document.referrer).origin === window.location.origin; } catch { internal = false; }
      if ((hasInAppHistory() || internal) && window.history.length > 1) { event.preventDefault(); router.back(); }
    }}
  >{children}</a>;
}
