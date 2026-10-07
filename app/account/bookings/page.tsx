import { AccountBookings } from "../../../components/account/bookings";
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <div className="product-page page-shell">
      <AccountBookings initialRole={role === "provider" ? "provider" : "customer"} />
    </div>
  );
}
