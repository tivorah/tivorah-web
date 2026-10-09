// Mirrors tivorah-api/src/services/refundPolicy.ts. The API decides eligibility; this only labels.
export const refundPolicyOptions = [
  { value: "none", label: "No change-of-mind refunds" },
  { value: "before_7_days", label: "Full refund up to 7 days before" },
  { value: "before_48_hours", label: "Full refund up to 48 hours before" },
  { value: "before_start", label: "Full refund any time before it starts" },
  { value: "custom", label: "Case by case (I review each request)" },
] as const;

export type RefundPolicyPreset = (typeof refundPolicyOptions)[number]["value"];

export const refundPolicyLabel = (preset?: string | null) =>
  refundPolicyOptions.find((option) => option.value === preset)?.label ?? null;
