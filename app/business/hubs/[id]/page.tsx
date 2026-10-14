import { notFound } from "next/navigation";
import { ManageHub } from "../../../../components/business/hubs/manage";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return <ManageHub id={Number(id)} />;
}
