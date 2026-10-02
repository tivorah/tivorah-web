import Link from "next/link";
import Image from "next/image";
import {
  DiscoveryItem,
  DiscoveryKind,
  itemPath,
  money,
} from "../../lib/api/discovery";
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
        {kind === "hubs" && item.interests?.length ? <p className="hub-card-interests">{item.interests.slice(0, 3).join(" · ")}</p> : null}
        <p>
          {[item.locality, item.state].filter(Boolean).join(", ") ||
            (item.locationType === "online" ? "Online" : kind === "hubs" ? "Location not specified" : "Explore on Tivorah")}
        </p>
        {item.businessName ? (
          <p className="discover-seller">{item.businessName}</p>
        ) : null}
        {kind === "hubs" ? <p className="hub-card-meta">{item.memberCount != null ? `${item.memberCount} ${item.memberCount === 1 ? "person" : "people"}` : "New Hub"}{item.creatorUsername ? ` · Created by @${item.creatorUsername}` : ""}</p> : null}
        <div className="discover-card-bottom">
          <strong>
            {kind === "events"
              ? item.externalTicketUrl
                ? "External tickets"
                : item.priceCents == null
                  ? "Tickets unavailable"
                  : item.priceCents === 0
                    ? item.hasPaidTickets ? "Free & paid" : "Free"
                    : `From ${money(item.priceCents)}`
              : item.priceCents != null
              ? item.priceType === "quote"
                ? "Request a quote in the app"
                : `${item.priceType === "from" ? "From " : ""}${money(item.priceCents)}${item.priceType === "hourly" ? " / hour" : ""}`
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
