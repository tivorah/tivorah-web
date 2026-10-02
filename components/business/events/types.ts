export type TicketType = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  quantity: number;
  sold: number;
  maxTicketsPerBuyer: number;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  active?: boolean;
  kind?: "standard" | "group";
  groupSize?: number;
  regularPriceCents?: number | null;
  hidden?: boolean;
  hasAccessCode?: boolean;
  releaseAfterTicketTypeId?: number | null;
};
export type ManagedEvent = {
  id: number;
  /** Hubs this event is shared to (only returned to the organiser). */
  communityIds?: number[];
  allowGroupBookings?: boolean;
  organizerId: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  category: string | null;
  venueName: string | null;
  address: string | null;
  locationType: "venue" | "online";
  onlineUrl: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  status: string;
  images: string[];
  img: string | null;
  ticketTypes: TicketType[];
};
export function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
