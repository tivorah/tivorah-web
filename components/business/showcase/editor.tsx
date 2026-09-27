"use client";
import { LoadingState } from "../../ui/loading-state";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api } from "../../../lib/api/client";
import { ShowcaseMedia } from "./media";
import {
  ShowcaseAsset,
  ShowcaseContent,
  ShowcaseRecord,
  emptyShowcase,
} from "./types";
import { ShowcasePresentation } from "./presentation";
const fields = [
  ["name", "Shop or business name", 100],
  ["slug", "Web address", 60],
  ["about", "Short introduction", 240],
  ["story", "Your story", 5000],
  ["locality", "Public locality", 120],
  ["hours", "Opening hours", 500],
  ["serviceArea", "Service area", 500],
  ["fulfilment", "Pickup and delivery information", 1000],
  ["bookingPolicy", "Booking and cancellation information", 1000],
] as const;
function Editor({
  record,
  media,
  username,
}: {
  record: ShowcaseRecord | null;
  media: ShowcaseAsset[];
  username: string;
}) {
  const [content, setContent] = useState<ShowcaseContent>(
    record?.draft ?? emptyShowcase(username),
  );
  const [assets, setAssets] = useState(media);
  const [version, setVersion] = useState(record?.version ?? 0);
  const [published, setPublished] = useState(!!record?.published);
  const [publishedSlug, setPublishedSlug] = useState(record?.published?.slug || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uploading) return;
    const action =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ||
      "draft";
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api<{ showcase: ShowcaseRecord }>(
        "/web/business/showcase",
        { method: "PUT", body: JSON.stringify({ version, content, action }) },
      );
      setVersion(result.showcase.version);
      setPublished(!!result.showcase.published);
      setPublishedSlug(result.showcase.published?.slug || "");
      setNotice(
        action === "publish"
          ? "Your showcase is published."
          : action === "unpublish"
            ? "Your showcase is now private."
            : "Draft saved.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your showcase.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="product-secondary" href="/business">
        ← Your business
      </Link>
      <header className="account-heading">
        <div>
          <p className="product-eyebrow">{published ? "PUBLISHED" : "DRAFT"}</p>
          <h1>Your seller showcase</h1>
          <p>A home for your business story, photos and offerings.</p>
        </div>
        <button
          className="product-secondary"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? "Back to editing" : "Preview draft"}
        </button>
      </header>
      {preview ? (
        <ShowcasePresentation content={content} assets={assets} preview />
      ) : (
        <section className="product-form business-create">
          <form onSubmit={save}>
            <fieldset disabled={busy}>
              {fields.map(([key, label, max]) => (
                <label key={key}>
                  {label}
                  {max > 240 ? (
                    <textarea
                      rows={key === "story" ? 5 : 3}
                      value={content[key]}
                      maxLength={max}
                      onChange={(e) =>
                        setContent({ ...content, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      value={content[key]}
                      required={key === "name" || key === "slug"}
                      minLength={key === "slug" ? 3 : undefined}
                      maxLength={max}
                      pattern={
                        key === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined
                      }
                      onChange={(e) =>
                        setContent({ ...content, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
              <p>
                Use a suburb or service area publicly. Keep private home
                addresses out of your showcase.
              </p>
            </fieldset>
            <ShowcaseMedia
              content={content}
              assets={assets}
              onChange={setContent}
              onUpload={(asset) => setAssets((rows) => [asset, ...rows])}
              onBusy={setUploading}
              disabled={busy}
            />
            <div className="account-actions">
              <button
                className="product-secondary"
                value="draft"
                disabled={busy || uploading}
              >
                Save draft
              </button>
              <button
                className="product-primary"
                value="publish"
                disabled={busy || uploading}
              >
                {busy ? "Saving…" : "Publish showcase"}
              </button>
              {published ? (
                <button
                  className="product-secondary"
                  value="unpublish"
                  disabled={busy || uploading}
                >
                  Unpublish
                </button>
              ) : null}
            </div>
          </form>
        </section>
      )}
      {error ? (
        <p className="product-notice" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="product-notice" role="status">
          {notice}
        </p>
      ) : null}
      {published ? (
        <Link href={`/shops/${encodeURIComponent(publishedSlug)}`}>
          View public showcase
        </Link>
      ) : null}
    </>
  );
}
function Load({ username }: { username: string }) {
  const { data, loading, error, retry } = usePrivateResource<{
    showcase: ShowcaseRecord | null;
    assets: ShowcaseAsset[];
  }>("/web/business/showcase");
  if (loading && !data) return <LoadingState label="Loading your showcase…" variant="form" />;
  if (error || !data)
    return (
      <div className="product-notice" role="alert">
        <p>{error || "Showcase unavailable."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  return (
    <Editor record={data.showcase} media={data.assets} username={username} />
  );
}
export function ShowcaseEditor() {
  return (
    <AccountGate>
      {(account) => <Load username={account.username} />}
    </AccountGate>
  );
}
