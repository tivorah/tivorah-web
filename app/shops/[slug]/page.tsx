import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "../../../lib/api/client";
import { DiscoveryItem } from "../../../lib/api/discovery";
import { ShowcasePresentation } from "../../../components/business/showcase/presentation";
import {
  ShowcaseAsset,
  ShowcaseContent,
} from "../../../components/business/showcase/types";
import { DiscoveryCard } from "../../../components/discovery/card";
import { pageMetadata } from "../../../lib/site";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return pageMetadata(
  "Seller showcase",
  "Discover items, services and the business behind them on Tivorah.",
  `/shops/${encodeURIComponent(slug)}`,
);
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ skip?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const skip = Math.max(0, Math.min(10000, Number(query.skip) || 0));
  let data: {
    content: ShowcaseContent;
    assets: ShowcaseAsset[];
    offerings: (DiscoveryItem & { listingType: string })[];
    nextSkip: number | null;
  };
  try {
    data = await api(`/public/shops/${encodeURIComponent(slug)}?skip=${skip}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <div className="product-page page-shell">
      <Link className="product-secondary" href="/shop">
        ← Browse Shop
      </Link>
      <ShowcasePresentation content={data.content} assets={data.assets} />
      <section id="offerings">
        <h2>Available items & services</h2>
        <div className="discover-grid">
          {data.offerings.map((item) => (
            <DiscoveryCard
              key={item.id}
              kind={item.listingType === "service" ? "services" : "items"}
              item={item}
            />
          ))}
        </div>
        {!data.offerings.length ? (
          <p>No public offerings are available right now.</p>
        ) : null}
        <div className="account-actions">
          {skip > 0 ? (
            <Link
              className="product-secondary"
              href={`/shops/${encodeURIComponent(slug)}?skip=${Math.max(0, skip - 18)}#offerings`}
            >
              Previous
            </Link>
          ) : null}
          {data.nextSkip !== null ? (
            <Link
              className="product-secondary"
              href={`/shops/${encodeURIComponent(slug)}?skip=${data.nextSkip}#offerings`}
            >
              Next
            </Link>
          ) : null}
        </div>
      </section>
      <p>
        <Link
          href={`/contact?${new URLSearchParams({ subject: `Report shop ${slug}` })}`}
        >
          Report a concern
        </Link>
      </p>
    </div>
  );
}
