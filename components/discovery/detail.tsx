import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "../../lib/api/client";
import {
  DiscoveryItem,
  DiscoveryKind,
  itemPath,
  money,
  sections,
} from "../../lib/api/discovery";
import { ServiceBooking } from "./service-booking";
import { AppHandoff } from "./app-handoff";
export async function DiscoveryDetail({
  kind,
  id,
}: {
  kind: Exclude<DiscoveryKind, "events">;
  id: string;
}) {
  if (!/^[1-9]\d*$/.test(id)) notFound();
  let item: DiscoveryItem;
  try {
    item = await api<DiscoveryItem>(`/public/discovery/${kind}/${id}`);
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) notFound();
    throw cause;
  }
  const href = itemPath(kind, item.id);
  return (
    <div className="product-page page-shell">
      <Link className="product-secondary" href={sections[kind].path}>
        ← Back to {sections[kind].label}
      </Link>
      <article className="product-detail">
        <div>
          <div className="product-detail-visual">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 600px) 100vw, 60vw"
                priority
              />
            ) : (
              <span className="discover-image-fallback" aria-hidden="true">
                {kind === "hubs" ? "◎" : "✳"}
              </span>
            )}
          </div>
          <div className="product-detail-gallery">
            {item.images
              ?.filter((url) => url !== item.image)
              .map((url, index) => (
                <div key={`${url}-${index}`}>
                  <Image
                    src={url}
                    alt={`${item.title}, photo ${index + 2}`}
                    fill
                    sizes="(max-width: 600px) 30vw, 20vw"
                  />
                </div>
              ))}
          </div>
        </div>
        <div>
          <p className="product-eyebrow">
            {item.category || sections[kind].label}
          </p>
          <h1>{item.title}</h1>
          {item.priceCents !== undefined ? (
            <p className="product-detail-price">
              {item.priceType === "quote"
                ? "Price by agreement"
                : `${item.priceType === "from" ? "From " : ""}${money(item.priceCents)}${item.priceType === "hourly" ? " / hour" : ""}`}
            </p>
          ) : null}
          <div className="product-detail-facts">
            <span>
              {[item.locality, item.state].filter(Boolean).join(", ") ||
                "Australia"}
            </span>
            {item.condition && kind === "items" ? (
              <span>Condition: {item.condition.replaceAll("_", " ")}</span>
            ) : null}
            {item.sellerUsername ? (
              <Link href={`/shops/${encodeURIComponent(item.sellerUsername)}`}>
                {item.businessName || `@${item.sellerUsername}`}
              </Link>
            ) : null}
          </div>
          <p className="product-detail-description">
            {item.description || "More details will be added soon."}
          </p>
          {item.guidelines?.length ? (
            <section>
              <h2>Before you join</h2>
              <ul>
                {item.guidelines.map((rule, index) => (
                  <li key={index}>{rule.text}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {kind === "services" && item.bookingEnabled ? (
            <ServiceBooking id={item.id} />
          ) : null}
          <AppHandoff
            title={
              kind === "hubs"
                ? "Join this Hub in the app"
                : kind === "services"
                  ? "Discuss this service in the app"
                  : "Contact the seller in the app"
            }
            appPath={
              kind === "hubs" ? `hubs/invite/${id}` : `details?productId=${id}`
            }
            webPath={href}
          />
          <p>
            <Link
              href={`/contact?${new URLSearchParams({ subject: `Report ${kind} ${id}` })}`}
            >
              Report a concern
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
