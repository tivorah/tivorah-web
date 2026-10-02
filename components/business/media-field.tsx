"use client";
import { useState } from "react";
import Image from "next/image";
import { api } from "../../lib/api/client";
export function MediaField({
  context,
  initialUrls = [],
  onChange,
  onBusy,
}: {
  initialUrls?: string[];
  context: "item" | "service" | "event";
  onChange: (urls: string[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    if (files.length + urls.length > 5) {
      setError("Choose up to five photos.");
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("context", context);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
          throw new Error("Choose images smaller than 10 MB each.");
        form.append("files", file);
      }
      const result = await api<{ images: { url: string }[] }>(
        "/utility/uploads/images",
        { method: "POST", body: form, signal: AbortSignal.timeout(120000) },
      );
      const next = [...urls, ...result.images.map((image) => image.url)];
      setUrls(next);
      onChange(next);
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
  return (
    <div className="business-media-field">
      <p className="business-media-label">Photos</p>
      <label className="business-media-picker">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || urls.length >= 5}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="business-media-picker-icon" aria-hidden="true">＋</span>
        <strong>{busy ? "Uploading photos…" : urls.length >= 5 ? "Five photos added" : "Add photos"}</strong>
        <span>Choose up to five images</span>
      </label>
      <p className="event-help">
        Up to five photos, 10 MB each. Photos are checked before publishing.
      </p>
      {busy ? <p role="status">Uploading and checking photos…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {urls.length ? <div className="business-media-preview">{urls.map((url, index) => (
        <div className="business-media-photo" key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`View photo ${index + 1}`}>
            <Image src={url} alt={`Uploaded photo ${index + 1}`} width={112} height={92} />
          </a>
          <span>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</span>
          {index > 0 ? <button type="button" className="product-secondary" disabled={busy} onClick={() => { const next = [url, ...urls.filter((_, i) => i !== index)]; setUrls(next); onChange(next); }}>Make cover</button> : null}
          <button
            type="button"
            className="product-secondary"
            disabled={busy}
            onClick={() => {
              const next = urls.filter((_, i) => i !== index);
              setUrls(next);
              onChange(next);
            }}
          >
            Remove
          </button>
        </div>
      ))}</div> : null}
    </div>
  );
}
