"use client";
import { useState } from "react";
import { api } from "../../lib/api/client";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { LoadingState } from "../ui/loading-state";

type Kind = "event" | "service" | "item";
type Video = { assetId: number; status: string; url: string | null; reviewNote?: string | null; transcript: string; captions: string };
const path = (kind: Kind, id: number) => `/utility/offerings/${kind}/${id}/videos`;

export function OfferingVideosEditor({ kind, id }: { kind: Kind; id: number }) {
  const { data, loading, error, retry } = usePrivateResource<{ videos: Video[] }>(path(kind, id));
  const [draft, setDraft] = useState<Video[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const videos = draft ?? data?.videos ?? [];
  async function upload(file: File | undefined) {
    if (!file || busy) return;
    if (file.size > 25 * 1024 * 1024) { setSaveError("Choose a video smaller than 25 MB."); return; }
    setBusy(true); setSaveError(""); setNotice("");
    try {
      const body = new FormData(); body.set("file", file); body.set("kind", kind);
      const result = await api<{ asset: { id: number; status: string; url: string | null } }>("/utility/uploads/offering-video", { method: "POST", body, signal: AbortSignal.timeout(120000) });
      setDraft([...videos, { assetId: result.asset.id, status: result.asset.status, url: result.asset.url, transcript: "", captions: "" }]);
      setNotice("Video uploaded. Save it to submit for review. You can add a transcript and captions now or later.");
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Video upload failed."); }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setSaveError(""); setNotice("");
    try {
      await api(path(kind, id), { method: "PUT", body: JSON.stringify({ videos: videos.map(({ assetId, transcript, captions }) => ({ assetId, transcript, captions })) }) });
      setDraft(null); retry(); setNotice("Videos saved. Approved videos will appear on this page.");
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Could not save videos."); }
    finally { setBusy(false); }
  }
  return <section className="showcase-step offering-videos-editor">
    <h2>Videos</h2><p className="showcase-hint">Add up to three short videos for this specific {kind}. Videos are reviewed before visitors can see them. A transcript and timed WebVTT captions are optional and help more people follow along.</p>
    {loading && !data ? <LoadingState label="Loading videos…" /> : null}
    {error ? <p role="alert">{error} <button type="button" className="product-secondary" onClick={retry}>Try again</button></p> : null}
    {data ? <>
      {videos.map((video, index) => <div className="offering-video-edit" key={video.assetId}>
        <div className="offering-video-edit-head"><strong>Video {index + 1} · {video.status === "approved" ? "Approved" : video.status === "rejected" ? "Needs attention" : "In review"}</strong><button type="button" className="product-secondary" disabled={busy} onClick={() => setDraft(videos.filter((_, i) => i !== index))}>Remove</button></div>
        {video.status === "rejected" ? <p role="status">{video.reviewNote || "This video was not approved. Remove it and upload a revised version."}</p> : null}
        {video.url ? <video controls preload="metadata" src={video.url} aria-label={`Preview video ${index + 1}`} /> : null}
        <label>Transcript (optional)<textarea rows={3} maxLength={10000} value={video.transcript} onChange={event => setDraft(videos.map((row, i) => i === index ? { ...row, transcript: event.target.value } : row))} /></label>
        <label>Timed captions (WebVTT, optional)<textarea rows={4} maxLength={100000} value={video.captions} onChange={event => setDraft(videos.map((row, i) => i === index ? { ...row, captions: event.target.value } : row))} placeholder={"WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nWelcome"} /></label>
      </div>)}
      {videos.length < 3 ? <label className="product-secondary offering-video-upload">{busy ? "Uploading…" : "Add video"}<input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></label> : null}
      {draft ? <button type="button" className="product-primary" disabled={busy || videos.some(video => !!video.captions.trim() && (!video.captions.trim().startsWith("WEBVTT") || !video.captions.includes("-->")))} onClick={() => void save()}>{busy ? "Saving…" : "Save videos"}</button> : null}
    </> : null}
    {notice ? <p role="status">{notice}</p> : null}{saveError ? <p role="alert" className="product-error">{saveError}</p> : null}
  </section>;
}

export function PublicOfferingVideos({ kind, id }: { kind: Kind; id: number }) {
  const { data, error, retry } = usePrivateResource<{ videos: Array<{ id: number; url: string | null; transcript: string; captions: string }> }>(`${path(kind, id)}/public`);
  if (error && !data) return <p role="alert">Videos are unavailable. <button type="button" className="product-secondary" onClick={retry}>Try again</button></p>;
  if (!data?.videos.length) return null;
  return <section className="offering-videos-public" aria-label="Videos"><h2>Videos</h2><div>{data.videos.filter(video => !!video.url).map((video, index) => <figure key={video.id}><video controls preload="metadata" src={video.url!} aria-label={`${kind} video ${index + 1}`}>{video.captions?.trim() ? <track kind="captions" src={`data:text/vtt;charset=utf-8,${encodeURIComponent(video.captions)}`} srcLang="en" label="English" default /> : null}</video>{video.transcript?.trim() ? <figcaption><details><summary>Read transcript</summary><p>{video.transcript}</p></details></figcaption> : null}</figure>)}</div></section>;
}
