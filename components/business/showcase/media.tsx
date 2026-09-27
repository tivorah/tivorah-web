"use client";
import { useState } from "react";
import { api } from "../../../lib/api/client";
import { ShowcaseAsset, ShowcaseContent } from "./types";
export function ShowcaseMedia({
  content,
  assets,
  onChange,
  onUpload,
  onBusy,
  disabled,
}: {
  content: ShowcaseContent;
  assets: ShowcaseAsset[];
  onChange: (v: ShowcaseContent) => void;
  onUpload: (asset: ShowcaseAsset) => void;
  onBusy: (value: boolean) => void;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file || busy || disabled) return;
    setError("");
    if (file.size > 25 * 1024 * 1024) {
      setError("Choose a file smaller than 25 MB.");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await api<{ asset: ShowcaseAsset }>(
        "/web/business/showcase/media",
        { method: "POST", body: form },
      );
      onUpload(result.asset);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  const images = assets.filter(
    (asset) => asset.kind === "image" && asset.status === "approved",
  );
  const videos = assets.filter((asset) => asset.kind === "video");
  return (
    <fieldset disabled={busy || disabled}>
      <legend>Photos & introduction video</legend>
      <label>
        Upload media
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <p>
        Up to 25 MB per file. Photos are screened. Videos stay private until
        reviewed by Tivorah; you can publish the rest of your shop without a
        video while you wait.
      </p>
      {busy ? <p role="status">Uploading and checking media…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {(["logoId", "coverId"] as const).map((key) => (
        <label key={key}>
          {key === "logoId" ? "Logo" : "Cover photo"}
          <select
            value={content[key] || ""}
            onChange={(e) =>
              onChange({ ...content, [key]: Number(e.target.value) || null })
            }
          >
            <option value="">None</option>
            {images.map((asset, index) => (
              <option key={asset.id} value={asset.id}>
                Photo {index + 1} · #{asset.id}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="showcase-media-list">
        {images.map((asset, index) => (
          <div className="account-actions" key={asset.id}>
            <a
              href={asset.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              View photo {index + 1}
            </a>
            <button
              className="product-secondary"
              type="button"
              disabled={
                content.gallery.length >= 8 ||
                content.gallery.some((item) => item.assetId === asset.id)
              }
              onClick={() =>
                onChange({
                  ...content,
                  gallery: [...content.gallery, { assetId: asset.id, alt: "" }],
                })
              }
            >
              Add to gallery
            </button>
          </div>
        ))}
      </div>
      {content.gallery.map((item, index) => (
        <div className="showcase-gallery-editor" key={item.assetId}>
          <label>
            Photo {index + 1} description
            <input
              value={item.alt}
              required
              minLength={2}
              maxLength={200}
              onChange={(e) =>
                onChange({
                  ...content,
                  gallery: content.gallery.map((row) =>
                    row.assetId === item.assetId
                      ? { ...row, alt: e.target.value }
                      : row,
                  ),
                })
              }
            />
          </label>
          <div className="account-actions">
            <button
              className="product-secondary"
              type="button"
              disabled={index === 0}
              onClick={() => {
                const gallery = [...content.gallery];
                [gallery[index - 1], gallery[index]] = [
                  gallery[index],
                  gallery[index - 1],
                ];
                onChange({ ...content, gallery });
              }}
            >
              Move earlier
            </button>
            <button
              className="product-secondary"
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  gallery: content.gallery.filter(
                    (row) => row.assetId !== item.assetId,
                  ),
                })
              }
            >
              Remove from gallery
            </button>
          </div>
        </div>
      ))}
      <label>
        Introduction video
        <select
          value={content.videoId || ""}
          onChange={(e) =>
            onChange({ ...content, videoId: Number(e.target.value) || null })
          }
        >
          <option value="">None</option>
          {videos.map((asset) => (
            <option key={asset.id} value={asset.id}>
              Video #{asset.id} · {asset.status}
            </option>
          ))}
        </select>
      </label>
      {videos.map((asset) => (
        <p key={asset.id}>
          <a
            href={asset.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview video #{asset.id}
          </a>{" "}
          · {asset.status}
          {asset.reviewNote ? ` — ${asset.reviewNote}` : ""}
        </p>
      ))}
      {content.videoId ? (
        <>
        <label>
          Video transcript
          <textarea
            rows={5}
            required
            value={content.videoTranscript}
            maxLength={10000}
            onChange={(e) =>
              onChange({ ...content, videoTranscript: e.target.value })
            }
          />
        </label>
        <label>
          Timed captions (WebVTT)
          <textarea rows={6} value={content.videoCaptions || ""} maxLength={100000} placeholder={'WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nWelcome to our shop.'} onChange={e => onChange({ ...content, videoCaptions: e.target.value })} />
          <span>Paste plain-text captions with timings for speech and meaningful sounds. Captions and a transcript are required to publish a video.</span>
        </label>
        </>
      ) : null}
    </fieldset>
  );
}
