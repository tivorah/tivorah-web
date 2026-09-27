import { DiscoveryPageView } from "../../components/discovery/page";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata(
  "Shop",
  "Discover shop on Tivorah. Browse freely and find something nearby.",
  "/shop",
);
export default function Page() {
  return <DiscoveryPageView kind="items" />;
}
