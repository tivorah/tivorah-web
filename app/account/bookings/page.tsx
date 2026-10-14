import { AccountBookings } from "../../../components/account/bookings";
const id = (value?: string) => (value && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : undefined);
// Emails link here: ?pay= (invoice), ?review= (after the appointment), ?quote= (quote received).
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string; tab?: string; pay?: string; review?: string; quote?: string; requested?: string }> }) {
  const params = await searchParams;
  return (
    <div className="product-page page-shell">
      <AccountBookings initialRole={params.role === "provider" ? "provider" : "customer"} focus={{ tab: params.tab === "quotes" ? "quotes" : undefined, pay: id(params.pay), review: id(params.review), quote: id(params.quote), requested: params.requested === "1" }} />
    </div>
  );
}
