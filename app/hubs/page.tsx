import { DiscoveryPageView } from "../../components/discovery/page";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata(
  "Hubs",
  "Discover hubs on Tivorah. Browse freely and find something nearby.",
  "/hubs",
);
export default function Page() {
  return <DiscoveryPageView kind="hubs" />;
}
