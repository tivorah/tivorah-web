import Link from "next/link";
import Image from "next/image";
import {
  DiscoveryItem,
  DiscoveryKind,
  itemPath,
  money,
} from "../../lib/api/discovery";
import { hubInterestTiers } from "../../lib/category-filter";
export function DiscoveryCard({
  item,
  kind,
}: {
  item: DiscoveryItem;
  kind: DiscoveryKind;
}) {
  return (
    <Link className={`discover-card${kind === "hubs" ? " discover-card-hub" : ""}`} href={itemPath(kind, item.id)}>
      <div className="discover-card-image">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 950px) 50vw, 33vw"
          />
        ) : (
          <span className="discover-image-fallback" aria-hidden="true">
            {kind === "events" ? "↗" : kind === "hubs" ? "◎" : "✳"}
          </span>
        )}
        {item.category ? (
          <span className="discover-category">{item.category}</span>
        ) : null}
      </div>
      <div className="discover-card-copy">
        {item.startsAt ? (
          <p className="discover-date">
            {new Date(item.startsAt).toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "Australia/Adelaide",
            })}
          </p>
        ) : null}
        <h2>{item.title}</h2>
        {kind === "hubs" && item.interests?.length ? (() => {
          const tiers = hubInterestTiers(item.interests);
          return <p className="hub-card-interests">
            <span className="hub-card-primary"><span className="product-sr-only">Primary interest: </span>{tiers.primary}</span>
            {tiers.secondary.length ? <span className="hub-card-secondary"><span className="product-sr-only">Also: </span>{tiers.secondary.join(" · ")}{tiers.more ? ` +${tiers.more}` : ""}</span> : null}
          </p>;
        })() : null}
        <p>
          {[item.locality, item.state].filter(Boolean).join(", ") ||
            (item.locationType === "online" ? "Online" : kind === "hubs" ? "Location not specified" : "Explore on Tivorah")}
        </p>
        {kind !== "hubs" && (item.businessName || item.ownerName || item.sellerUsername || item.ownerUsername) ? (
          <p className="discover-seller">{kind === "events" ? "Organised by " : "By "}{item.businessName || item.ownerName || `@${item.sellerUsername || item.ownerUsername}`}</p>
        ) : null}
        {kind === "hubs" ? <p className="hub-card-meta">{item.memberCount != null ? `${item.memberCount} ${item.memberCount === 1 ? "person" : "people"}` : "New Hub"}{item.ownerName || item.creatorUsername ? ` · Created by ${item.ownerName || `@${item.creatorUsername}`}` : ""}</p> : null}
        <div className="discover-card-bottom">
          <strong>
            {kind === "events"
              ? item.externalTicketUrl
                ? "External tickets"
                : item.priceCents == null
                  ? "Tickets unavailable"
                  : item.priceCents === 0
                    ? item.hasPaidTickets ? "Free & paid" : "Free"
                    : `From ${money(item.priceCents, item.currency)}`
              : item.priceCents != null
              ? item.priceType === "quote"
                ? "Request a quote in the app"
                : `${item.priceType === "from" ? "From " : ""}${money(item.priceCents, item.currency)}${item.priceType === "hourly" ? " / hour" : ""}`
              : kind === "hubs"
                ? "Explore Hub"
                : "View listing"}
          </strong>
          <span aria-hidden="true">↗</span>
        </div>
      </div>
    </Link>
  );
}
