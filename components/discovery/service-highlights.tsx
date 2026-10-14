import type { DiscoveryItem } from "../../lib/api/discovery";
import "./service-highlights.css";

// Service page sections shared with mobile (components/marketplace/ServiceHighlights.tsx):
// rating, the essentials at a glance, pinned testimonials, reviews and the cancellation policy.

const stars = (rating: number) => "★★★★★".slice(0, Math.round(rating)) + "☆☆☆☆☆".slice(0, 5 - Math.round(rating));

export function ServiceRating({ item }: { item: DiscoveryItem }) {
  if (!item.rating?.count || item.rating.average == null) return <p className="service-rating service-rating-new">New on Tivorah · no reviews yet</p>;
  return <a className="service-rating" href="#reviews"><span aria-hidden="true">{stars(item.rating.average)}</span> <strong>{item.rating.average.toFixed(1)}</strong> <span>({item.rating.count} review{item.rating.count === 1 ? "" : "s"})</span></a>;
}

export function ServiceGlance({ item }: { item: DiscoveryItem }) {
  const where = item.serviceMode === "online" ? "Online" : item.serviceMode === "mobile" ? `Comes to you${item.serviceAreaKm ? ` · within ${item.serviceAreaKm} km` : ""}` : item.serviceMode === "flexible" ? "At their place or yours" : "At the provider’s location";
  const rows = [
    ["Where", where],
    item.slotDurationMinutes && item.priceType !== "quote" ? ["Appointment length", `${item.slotDurationMinutes} minutes`] : null,
    ["How booking works", item.priceType === "quote" ? "Ask for a quote, then accept it and choose a time" : item.bookingApproval === "request" ? "You request a time; the provider approves within 48 hours. You’re only charged once approved." : "Choose a time and it’s booked straight away"],
    ["Payment", item.paymentRequired ? item.paymentTiming === "after_service" ? "Paid securely on Tivorah after the appointment" : item.paymentTiming === "customer_choice" ? "Paid securely on Tivorah, when booked or after the appointment" : "Paid securely on Tivorah when booked" : "Arranged with the provider"],
  ].filter((row): row is string[] => !!row);
  return <section className="service-glance" aria-label="At a glance"><h2>At a glance</h2><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}

export function ServiceTestimonials({ item }: { item: DiscoveryItem }) {
  if (!item.testimonials?.length) return null;
  return <section className="service-testimonials"><h2>What clients say</h2><p className="service-section-note">Shared by the provider.</p><div>{item.testimonials.map((testimonial, index) => <figure key={index}><blockquote>“{testimonial.quote}”</blockquote><figcaption>— {testimonial.author}{testimonial.context ? `, ${testimonial.context}` : ""}</figcaption></figure>)}</div></section>;
}

export function ServiceReviews({ item }: { item: DiscoveryItem }) {
  const reviews = item.reviews ?? [];
  return <section className="service-reviews" id="reviews"><h2>Reviews{item.rating?.count ? ` (${item.rating.count})` : ""}</h2>
    {reviews.length ? <ul>{reviews.map((review) => <li key={review.id}>
      <div className="service-review-head"><strong>{review.author.firstName}</strong><span aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</span></div>
      <p className="service-review-date">Verified booking · {new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(new Date(review.createdAt))}</p>
      {review.comment ? <p>{review.comment}</p> : null}
      {review.providerReply ? <div className="service-review-reply"><span>Provider reply</span><p>{review.providerReply}</p></div> : null}
    </li>)}</ul> : <p className="service-section-note">Only people who completed a booking can leave a review.</p>}
  </section>;
}

export function ServicePolicy({ item }: { item: DiscoveryItem }) {
  if (!item.refundPolicyLabel) return null;
  return <section className="service-policy"><h2>Cancellation policy</h2><p><strong>{item.refundPolicyLabel}</strong></p>{item.refundPolicyNote ? <p>{item.refundPolicyNote}</p> : null}<p className="service-section-note">Inside this window you can cancel for a full refund or reschedule from your appointments. Your rights under Australian Consumer Law still apply.</p></section>;
}
