"use client";
import { useState } from "react";
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
    <div>
      <label>
        Photos
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
      </label>
      <p className="event-help">
        Up to five photos, 10 MB each. Photos are checked before publishing.
      </p>
      {busy ? <p role="status">Uploading and checking photos…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {urls.map((url, index) => (
        <div className="account-actions" key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            View photo {index + 1}
          </a>
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
            Remove photo {index + 1}
          </button>
        </div>
      ))}
    </div>
  );
}
