import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Why Tivorah", description: "Why Tivorah brings community, local discovery and practical opportunities into connected Hubs.", alternates: { canonical: "/why-tivorah" } };

export default function WhyTivorah() {
  return <article className="content">
    <span className="eyebrow">Why Tivorah</span><h1>Local life should not feel fragmented.</h1>
    <p>Conversations happen in one app, events in another, opportunities travel privately and service marketplaces can feel anonymous. Tivorah connects these experiences through the Hubs people choose to join.</p>
    <h2>Community before transactions</h2>
    <ul><li><strong>Useful context.</strong> Profiles, services, events and opportunities can be connected to a Hub.</li><li><strong>Clear ownership.</strong> Hub creators establish rules, manage membership where needed and respond to reports.</li><li><strong>Local discovery.</strong> People can find relevant activity around them without losing the context of their communities.</li><li><strong>Real participation.</strong> A question can lead to an answer, a connection, an event or a useful referral.</li></ul>
    <h2>Built for life in Australia</h2>
    <p>Tivorah is for people newly arriving and people already established here. It reflects the way life in Australia is built through neighbourhoods, professional networks, cultural communities and shared interests.</p>
    <p>Tivorah does not guarantee a member, provider, listing, event or opportunity merely because it appears in the app. Members should independently verify claims, licences, prices and safety information that matter.</p>
    <p><Link href="/#updates">Join the waitlist</Link> or learn about <Link href="/hub-organisers">running a Hub</Link> and <Link href="/service-providers">listing a service</Link>.</p>
  </article>;
}
