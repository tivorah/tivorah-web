import { DiscoveryDetail, discoveryMetadata } from "../../../components/discovery/detail";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return discoveryMetadata("services", id);
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscoveryDetail kind="services" id={id} />;
}
