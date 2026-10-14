// Booking status wording shared by the customer and provider booking screens (no UI imports, so it is unit-testable).
type StatusBooking = {
  status: string;
  endsAt: string;
  paymentDueAt?: string | null;
  paymentDue?: boolean;
  paymentTiming?: "upfront" | "after_service";
  totalCents?: number;
  stripePaymentIntentId?: string | null;
};

/** Completed pay-after-service appointment still unpaid; works whether or not the API sent paymentDue. */
export const owesPayment = (booking: Partial<StatusBooking>) =>
  booking.paymentDue ?? (booking.status === "completed" && booking.paymentTiming === "after_service" && Number(booking.totalCents ?? 0) > 0 && !booking.stripePaymentIntentId);
export function bookingStatusText(booking: Pick<StatusBooking, "status" | "endsAt"> & Partial<StatusBooking>, role: "customer" | "provider" = "customer") {
  if (owesPayment(booking)) return role === "provider" ? "Waiting for payment" : "Payment due";
  switch (booking.status) {
    case "requested": return role === "provider" ? "Needs your approval" : "Waiting for approval";
    case "pending_payment": return booking.paymentDueAt ? (role === "provider" ? "Invoice sent" : "Invoice due") : "Awaiting payment";
    case "confirmed": return new Date(booking.endsAt) < new Date() ? "Finishing up" : "Confirmed";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "refunded": return "Refunded";
    case "declined": return "Declined";
    case "expired": return "Expired";
    default: return booking.status.replaceAll("_", " ");
  }
}
