// Refund requests and complaints (tivorah-api/src/services/bookingRequests.ts).
export type RequestKind = "refund" | "complaint";
export type RequestStatus = "open" | "refunded" | "declined" | "resolved" | "escalated" | "closed" | "withdrawn";

export type BookingRequest = {
  id: number; kind: RequestKind; reason: string; message: string; status: RequestStatus;
  sellerResponse: string | null; respondedAt: string | null; refundedCents: number;
  escalatedAt: string | null; staffNote: string | null; resolvedAt: string | null; createdAt: string;
  canEscalate: boolean; canWithdraw: boolean;
};

/** Seller and staff views add the booking and buyer. */
export type ManagedBookingRequest = BookingRequest & {
  subjectType: "event_order" | "service_booking"; bookingId: number; eventId: number | null; productId: number | null; title: string;
  buyer: { id: number; name: string; email: string }; totalCents: number; refundableCents: number; currency: string;
  quantity: number | null; appointmentAt: string | null; bookingStatus: string | null; escalationNote: string | null;
};

export type RequestOptions = {
  policy: { preset: string | null; label: string | null; note: string | null; deadline: string | null; summary: string };
  canRequestRefund: boolean; canComplain: boolean; refundableCents: number; currency: string;
  reasons: Record<RequestKind, string[]>;
  requests: BookingRequest[];
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  open: "Waiting for the seller", refunded: "Refunded", declined: "Declined", resolved: "Resolved",
  escalated: "With Tivorah", closed: "Closed by Tivorah", withdrawn: "Withdrawn",
};

/** Seller-facing wording for the same statuses. */
export const sellerStatusLabel: Record<RequestStatus, string> = {
  ...requestStatusLabel, open: "Needs your reply",
};

export const requestKindLabel: Record<RequestKind, string> = { refund: "Refund request", complaint: "Complaint" };
