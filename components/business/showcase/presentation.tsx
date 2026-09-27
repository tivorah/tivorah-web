import Image from "next/image";
import { ShowcaseContent, ShowcaseAsset } from "./types";
import { ShowcaseVideo } from "./video";
export function ShowcasePresentation({
  content,
  assets,
  preview = false,
}: {
  content: Partial<ShowcaseContent>;
  assets: ShowcaseAsset[];
  preview?: boolean;
}) {
  const asset = (id: number | null | undefined) =>
    assets.find(
      (item) => item.id === id && (preview || item.status === "approved"),
    );
  const logo = asset(content.logoId);
  const cover = asset(content.coverId);
  const video = asset(content.videoId);
  return (
    <article className="showcase-presentation">
      {preview ? (
        <p className="product-notice">
          Draft preview — only you can see this version.
        </p>
      ) : null}
      {cover?.url ? (
        <div className="showcase-cover">
          <Image
            src={cover.url}
            alt={`${content.name} cover`}
            fill
            sizes="(max-width: 600px) 100vw, 1280px"
          />
        </div>
      ) : null}
      <header className="account-heading">
        <div>
          {logo?.url ? (
            <Image
              src={logo.url}
              alt={`${content.name} logo`}
              width={88}
              height={88}
            />
          ) : null}
          <p className="product-eyebrow">
            {content.locality || "TIVORAH SELLER"}
          </p>
          <h1>{content.name || "Your business name"}</h1>
          <p>{content.about}</p>
        </div>
        {!preview && <a className="product-primary" href="#offerings">
          Browse offerings
        </a>}
      </header>
      {content.story ? (
        <section>
          <h2>About the business</h2>
          <p className="product-detail-description">{content.story}</p>
        </section>
      ) : null}
      <div className="showcase-gallery">
        {content.gallery?.map((item) => {
          const photo = asset(item.assetId);
          return photo?.url ? (
            <figure key={item.assetId}>
              <Image
                src={photo.url}
                alt={item.alt}
                width={640}
                height={480}
                sizes="(max-width:600px) 100vw, 33vw"
              />
              <figcaption>{item.alt}</figcaption>
            </figure>
          ) : null;
        })}
      </div>
      {video?.url ? (
        <section>
          <h2>Meet the business</h2>
          {preview && video.status !== "approved" ? (
            <p>Video review: {video.status}</p>
          ) : null}
          <ShowcaseVideo src={video.url} title={content.name || "Business"} captions={content.videoCaptions} poster={cover?.url || undefined} />
          {content.videoTranscript ? (
            <details>
              <summary>Read video transcript</summary>
              <p className="product-detail-description">
                {content.videoTranscript}
              </p>
            </details>
          ) : null}
        </section>
      ) : null}
      <div className="account-grid">
        {(
          [
            ["hours", "Opening hours"],
            ["serviceArea", "Service area"],
            ["fulfilment", "Pickup & delivery"],
            ["bookingPolicy", "Bookings & cancellations"],
          ] as const
        )
          .filter(([key]) => content[key])
          .map(([key, title]) => (
            <section key={key} className="account-panel">
              <h2>{title}</h2>
              <p className="product-detail-description">{content[key]}</p>
            </section>
          ))}
      </div>
    </article>
  );
}
