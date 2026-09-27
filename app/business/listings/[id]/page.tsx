import { notFound } from "next/navigation";
import { ListingEditor } from "../../../../components/business/listing-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return (
    <div className="product-page page-shell">
      <ListingEditor id={id} />
    </div>
  );
}
