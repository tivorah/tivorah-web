"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api/client";
import { ShopVideo } from "./video";
import { firstFrame } from "../../../lib/video-frame";

// The seller's shop, shown under their item / service details and an
// organiser's event. The API returns null unless the shop is published, the
// seller is eligible, and they left this placement on — then nothing renders.
type Card = {
  slug: string;
  name: string;
  about: string;
  locality: string;
  logo: string | null;
  cover: string | null;
  video: { url: string; captions: string } | null;
  gallery: { url: string; alt: string; kind?: "image" | "video" }[];
};

export function ShopCard({ username, surface }: { username: string; surface: "items" | "services" | "events" | "hubs" }) {
  const [card, setCard] = useState<Card | null>(null);
  const [watching, setWatching] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api<Card | null>(`/public/shops/${encodeURIComponent(username)}/card?surface=${surface}`, { signal: controller.signal })
      .then((value) => setCard(value ?? null))
      .catch(() => setCard(null)); // Optional extra: hide quietly on failure.
    return () => controller.abort();
  }, [username, surface]);
  if (!card) return null;
  const who = surface === "events" ? "the organiser" : surface === "services" ? "the provider" : "the seller";
  return <section className="shop-card" aria-labelledby="shop-card-title">
    <div className="shop-card-cover">
      {card.cover ? <Image src={card.cover} alt="" fill sizes="(max-width: 700px) 100vw, 560px" /> : null}
    </div>
    <div className="shop-card-body">
      <div className="shop-card-head">
        <span className="shop-card-logo">
          {card.logo ? <Image src={card.logo} alt="" width={56} height={56} /> : card.name.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="shop-card-eyebrow">Meet {who}</p>
          <h2 id="shop-card-title">{card.name}</h2>
          {card.locality ? <p className="shop-card-locality">{card.locality}</p> : null}
        </div>
      </div>
      {card.about ? <p className="shop-card-about">{card.about}</p> : null}
      {card.gallery.length ? <ul className="shop-card-gallery">
        {card.gallery.slice(0, 3).map((photo) => <li key={photo.url}>{photo.kind === "video" ? <video src={firstFrame(photo.url)} muted playsInline preload="metadata" aria-label={photo.alt} /> : <Image src={photo.url} alt={photo.alt} width={240} height={180} sizes="(max-width: 700px) 33vw, 180px" />}</li>)}
      </ul> : null}
      {card.video ? watching
        ? <div className="shop-card-video"><ShopVideo src={card.video.url} title={card.name} captions={card.video.captions} poster={card.cover || undefined} /></div>
        : <button type="button" className="shop-card-watch" onClick={() => setWatching(true)}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          Watch introduction
        </button> : null}
      <Link className="shop-card-link" href={`/shops/${encodeURIComponent(card.slug)}`}>Visit {card.name} <span aria-hidden="true">→</span></Link>
    </div>
  </section>;
}
