import { DiscoveryPageView } from "../../components/discovery/page";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata(
  "Services",
  "Discover services on Tivorah. Browse freely and find something nearby.",
  "/services",
);
export default function Page() {
  return <DiscoveryPageView kind="services" />;
}
