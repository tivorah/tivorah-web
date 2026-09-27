import { AccountOrder } from "../../../../components/account/order";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return (
    <div className="product-page page-shell">
      <AccountOrder id={id} />
    </div>
  );
}
