import { notFound } from "next/navigation";
import { EventWorkspace } from "../../../../components/business/events/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return (
    <div className="product-page page-shell">
      <EventWorkspace id={id} />
    </div>
  );
}
