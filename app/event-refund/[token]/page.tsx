import type { Metadata } from "next";
import { RefundDecision } from "./refund-decision";

export const metadata: Metadata = { title: "Your refund", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <div className="product-page page-shell refund-decision-page"><RefundDecision token={token} /></div>;
}
