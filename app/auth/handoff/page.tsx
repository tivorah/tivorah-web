import type { Metadata } from "next";
import { Suspense } from "react";
import { HandoffFallback, SessionHandoff } from "../../../components/auth/session-handoff";

// The URL briefly carries a sign-in token: never send it as a referrer or let it be indexed.
export const metadata: Metadata = { title: "Opening Tivorah", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense fallback={<HandoffFallback />}>
        <SessionHandoff />
      </Suspense>
    </div>
  );
}
