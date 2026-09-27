"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { useMutation } from "../../hooks/use-mutation";
import { Locality, LocalityField } from "./locality-field";
import { MediaField } from "./media-field";
import { ServiceSettings, ServiceSettingsValue } from "./service-settings";
type Listing = ServiceSettingsValue & {
  id: number;
  sellerId: number;
  listingType: "item" | "service";
  title: string;
  description: string;
  businessName: string | null;
  category: string;
  images: string[];
  priceCents: number;
  priceType: string;
  condition: string;
  serviceMode: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  pickupNotes: string | null;
};
function Editor({ item, refresh }: { item: Listing; refresh: () => void }) {
  const [images, setImages] = useState(item.images);
  const [uploading, setUploading] = useState(false);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [settings, setSettings] = useState<ServiceSettingsValue>({
    bookingEnabled: item.bookingEnabled,
    paymentRequired: item.paymentRequired,
    slotDurationMinutes: item.slotDurationMinutes,
    bookingNoticeHours: item.bookingNoticeHours,
    weeklyAvailability: item.weeklyAvailability,
  });
  const mutation = useMutation(refresh);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await mutation.run(
      `/market/products/${item.id}`,
      "PATCH",
      {
        title: f.get("title"),
        description: f.get("description"),
        businessName: f.get("businessName"),
        category: f.get("category"),
        categories: [f.get("category")],
        images,
        priceCents: Math.round(Number(f.get("price")) * 100),
        priceType: f.get("priceType"),
        ...(locality || {}),
        ...(item.listingType === "service"
          ? {
              ...settings,
              serviceMode: f.get("serviceMode"),
              availableOnline: f.get("serviceMode") === "online",
            }
          : {
              condition: f.get("condition"),
              pickupNotes: f.get("pickupNotes"),
            }),
      },
      "Listing updated.",
    );
  }
  return (
    <>
      <Link className="product-secondary" href="/business">
        ← Your business
      </Link>
      <section className="product-form business-create">
        <h1>Edit {item.listingType === "service" ? "service" : "listing"}</h1>
        <form onSubmit={submit}>
          <fieldset disabled={mutation.busy || uploading}>
            <label>
              Title
              <input
                name="title"
                defaultValue={item.title}
                minLength={3}
                maxLength={160}
                required
              />
            </label>
            <label>
              Business name
              <input
                name="businessName"
                defaultValue={item.businessName || ""}
                maxLength={100}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={item.description}
                minLength={10}
                maxLength={10000}
                rows={5}
                required
              />
            </label>
            <label>
              Category
              <input
                name="category"
                defaultValue={item.category}
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              Price (AUD)
              <input
                name="price"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                defaultValue={item.priceCents / 100}
                required
              />
            </label>
            <label>
              Price basis
              <select name="priceType" defaultValue={item.priceType}>
                <option value="fixed">Fixed price</option>
                {item.listingType === "service" ? (
                  <>
                    <option value="from">Starting from</option>
                    <option value="hourly">Per hour</option>
                    <option value="quote">Quote required</option>
                  </>
                ) : null}
              </select>
            </label>
            {item.listingType === "service" ? (
              <>
                <label>
                  Service location
                  <select
                    name="serviceMode"
                    defaultValue={item.serviceMode || "at_provider"}
                  >
                    <option value="at_provider">At the provider</option>
                    <option value="mobile">At the customer</option>
                    <option value="online">Online</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </label>
                <ServiceSettings value={settings} onChange={setSettings} />
              </>
            ) : (
              <>
                <label>
                  Condition
                  <select name="condition" defaultValue={item.condition}>
                    <option value="new">New</option>
                    <option value="like_new">Like new</option>
                    <option value="used_good">Used — good</option>
                    <option value="used_fair">Used — fair</option>
                  </select>
                </label>
                <label>
                  Pickup details
                  <textarea
                    name="pickupNotes"
                    maxLength={1000}
                    defaultValue={item.pickupNotes || ""}
                  />
                </label>
              </>
            )}
            <p>
              Locality:{" "}
              {[item.suburb, item.state, item.postcode]
                .filter(Boolean)
                .join(", ") || "Online"}
            </p>
            <details>
              <summary>Change locality</summary>
              <LocalityField required={false} onChange={setLocality} />
            </details>
          </fieldset>
          <MediaField
            initialUrls={item.images}
            context={item.listingType}
            onChange={setImages}
            onBusy={setUploading}
          />
          <button
            className="product-primary"
            disabled={mutation.busy || uploading || !images.length}
          >
            {mutation.busy
              ? "Saving…"
              : uploading
                ? "Uploading…"
                : "Save changes"}
          </button>
        </form>
        {mutation.error ? <p role="alert">{mutation.error}</p> : null}
        {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
      </section>
    </>
  );
}
function LoadEditor({ id, accountId }: { id: string; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<{
    product: Listing;
  }>(`/market/products/${id}`);
  if (loading && !data) return <LoadingState label="Loading listing…" variant="form" />;
  if (error || !data)
    return (
      <div role="alert">
        <p>{error || "Listing unavailable."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (data.product.sellerId !== accountId)
    return <p>You can edit only your own listings.</p>;
  return <Editor item={data.product} refresh={retry} />;
}
export function ListingEditor({ id }: { id: string }) {
  return (
    <AccountGate>
      {(account) => <LoadEditor id={id} accountId={account.id} />}
    </AccountGate>
  );
}
