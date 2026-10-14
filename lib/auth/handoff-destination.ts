/** What the app is opening, in words, so the loader says where people are going. */
export function destinationLabel(path: string) {
  if (path.startsWith("/business/showcase")) return "your showcase";
  if (path.startsWith("/business/listings/")) return "your listing";
  if (path.startsWith("/business/events/")) return "your event";
  if (path.startsWith("/business/payouts")) return "payout settings";
  if (path.startsWith("/business")) return "your business dashboard";
  if (path.startsWith("/account")) return "your account";
  return "Tivorah";
}
