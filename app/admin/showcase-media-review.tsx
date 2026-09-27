"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
type Asset = { id: number; url: string; mimeType: string };
export function ShowcaseMediaReview({
  request,
}: {
  request: (path: string, init?: RequestInit) => Promise<{ assets?: Asset[] }>;
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request("/api/v1/admin/showcase-media");
      setAssets(result.assets || []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load videos.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function review(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(id);
    setError("");
    try {
      await request(`/api/v1/admin/showcase-media/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
            "value",
          ),
          note: f.get("note"),
        }),
      });
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save review.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="panel">
      <h3>Seller introduction videos</h3>
      <p>
        Videos remain private until an owner or administrator approves them.
        Review the complete video against Tivorah’s content rules.
      </p>
      {loading ? <p role="status">Loading videos…</p> : null}
      {error ? (
        <p role="alert">
          {error} <button onClick={() => void load()}>Try again</button>
        </p>
      ) : null}
      {!loading && !error && !assets.length ? (
        <p>No videos awaiting review.</p>
      ) : null}
      {assets.map((asset) => (
        <article className="panel" key={asset.id}>
          <h4>Video #{asset.id}</h4>
          <video
            src={asset.url}
            controls
            preload="metadata"
            style={{ width: "100%", maxHeight: 400 }}
          />
          <form onSubmit={(e) => review(e, asset.id)}>
            <label>
              Review note
              <input name="note" required minLength={2} maxLength={500} />
            </label>
            <label>
              <input type="checkbox" required />I reviewed the complete video.
            </label>
            <div className="admin-actions">
              <button disabled={busy !== null} value="approved">
                Approve
              </button>
              <button disabled={busy !== null} value="rejected">
                Reject
              </button>
            </div>
          </form>
        </article>
      ))}
    </section>
  );
}
