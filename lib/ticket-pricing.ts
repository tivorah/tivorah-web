// Mobile counterpart: tivorah-mobile/utils/ticketPricing.ts. Keep both in step with
// calculatePlatformFee in tivorah-api/src/services/stripe.ts.
//
// The server quote for a ticket type carries its fee rate. Totals for any quantity are then
// worked out instantly here, so changing the quantity never waits on the network. The API
// re-quotes and snapshots the fee when the order is created, so the charged amount stays
// server-authoritative.

export type FeeRate = { percentageBps: number; fixedFeeCents: number; chargedTo: "buyer" | "provider"; taxTreatment?: string };
export type TicketTotals = { subtotalCents: number; platformFeeCents: number; buyerTotalCents: number; chargedTo: "buyer" | "provider"; ticketGstCents: number | null; taxTreatment?: string };

/** Mirrors calculatePlatformFee on the API: basis points on the subtotal plus a fixed fee per order. */
export function platformFee(subtotalCents: number, rate: FeeRate): number {
  if (subtotalCents <= 0) return 0;
  const calculated = Math.round((subtotalCents * rate.percentageBps) / 10_000) + rate.fixedFeeCents;
  return rate.chargedTo === "provider" ? Math.min(calculated, subtotalCents) : calculated;
}

/** Reads the fee rate from a server quote. Free quotes carry no rate, and none is needed. */
export function feeRateFromQuote(quote: { platformFeeCents?: number; chargedTo?: string; percentageBps?: number; fixedFeeCents?: number; tax?: { treatment: string } }): FeeRate {
  return {
    ...(quote.tax ? { taxTreatment: quote.tax.treatment } : {}),
    percentageBps: Number(quote.percentageBps) || 0,
    fixedFeeCents: Number(quote.fixedFeeCents) || 0,
    chargedTo: quote.chargedTo === "buyer" ? "buyer" : "provider",
  };
}

/** Totals for a ticket selection, or null while a paid ticket's fee rate is still unknown. */
export function ticketTotals(priceCents: number, quantity: number, rate: FeeRate | null): TicketTotals | null {
  const subtotalCents = Math.max(0, priceCents) * Math.max(0, Math.floor(quantity));
  if (subtotalCents === 0) return { subtotalCents: 0, platformFeeCents: 0, buyerTotalCents: 0, chargedTo: "provider", ticketGstCents: 0, taxTreatment: "not_applicable" };
  if (!rate) return null;
  const platformFeeCents = platformFee(subtotalCents, rate);
  return {
    subtotalCents,
    ticketGstCents: rate.taxTreatment === "taxable" ? Math.round(subtotalCents / 11) : ["not_registered", "gst_free", "input_taxed"].includes(rate.taxTreatment || "") ? 0 : null,
    taxTreatment: rate.taxTreatment,
    platformFeeCents,
    buyerTotalCents: subtotalCents + (rate.chargedTo === "buyer" ? platformFeeCents : 0),
    chargedTo: rate.chargedTo,
  };
}

/** Eased value between two amounts for the short price roll; always lands exactly on `to`. */
export function rollAmount(from: number, to: number, progress: number): number {
  if (progress >= 1) return to;
  const eased = 1 - Math.pow(1 - Math.max(0, progress), 3);
  return Math.round(from + (to - from) * eased);
}
