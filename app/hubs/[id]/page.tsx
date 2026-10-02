import { DiscoveryDetail, discoveryMetadata } from "../../../components/discovery/detail";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return discoveryMetadata("hubs", id);
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscoveryDetail kind="hubs" id={id} />;
}
