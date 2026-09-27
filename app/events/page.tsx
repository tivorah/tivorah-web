import { DiscoveryPageView } from "../../components/discovery/page";
import { pageMetadata } from "../../lib/site";
export const metadata = pageMetadata(
  "Events",
  "Discover events on Tivorah. Browse freely and find something nearby.",
  "/events",
);
export default function Page() {
  return <DiscoveryPageView kind="events" />;
}
