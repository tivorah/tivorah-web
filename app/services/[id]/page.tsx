import { DiscoveryDetail } from "../../../components/discovery/detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscoveryDetail kind="services" id={id} />;
}
