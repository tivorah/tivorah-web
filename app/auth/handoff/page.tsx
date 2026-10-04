import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionHandoff } from "../../../components/auth/session-handoff";
import { LoadingState } from "../../../components/ui/loading-state";

// The URL briefly carries a sign-in token: never send it as a referrer or let it be indexed.
export const metadata: Metadata = { title: "Opening Tivorah", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="product-page page-shell">
      <Suspense fallback={<LoadingState label="Opening Tivorah…" variant="form" />}>
        <SessionHandoff />
      </Suspense>
    </div>
  );
}
