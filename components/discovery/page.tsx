import { Suspense } from "react";
import { DiscoveryLoading } from "./loading";
import { DiscoveryKind, sections } from "../../lib/api/discovery";
import { DiscoveryBrowser } from "./browser";
import { CreatePromo } from "./create-promo";
export function DiscoveryPageView({ kind }: { kind: DiscoveryKind }) {
  const section = sections[kind];
  return (
    <div className="product-page discovery-page page-shell">
      <section className={`discover-hero discover-hero-${kind}`}>
        <div>
          <p className="product-eyebrow">
            TIVORAH {section.label.toUpperCase()}
          </p>
          <h1>{section.title}</h1>
          <p>{section.description}</p>
          {kind !== "hubs" ? <CreatePromo kind={kind} /> : null}
        </div>
      </section>
      <Suspense
        fallback={<DiscoveryLoading label="Loading search…" />}
      >
        <DiscoveryBrowser kind={kind} />
      </Suspense>
      {kind === "hubs" ? (
        <aside className="discover-app-note">
          <h2>Find your Hub here. Feel at home in the app.</h2>
          <p>
            Join, share banter and connect with people in Tivorah for iOS and
            Android.
          </p>
        </aside>
      ) : null}
    </div>
  );
}
