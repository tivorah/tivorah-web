/**
 * Cover slides (Hubs, events, listings; tivorah-api services/coverSlides.ts): every slide is a
 * photo and an approved video plays on its own slide, over the photo stored there (its first
 * frame). Covers from before slides had positions show the video on the first slide.
 */
export function coverVideoSlide(position: number | null | undefined, slideCount: number) {
  if (typeof position !== "number" || !Number.isInteger(position) || position < 0) return 0;
  return Math.min(position, Math.max(0, slideCount - 1));
}

/** Up to four cover slides, at most one of them a video (the app and API allow the same). */
export const MAX_COVER_SLIDES = 4;
/** Hub and event cover videos: 15 seconds; a listing's video: 30. Both up to 100 MB. */
export type CoverVideoPurpose = "hub-cover" | "event-cover" | "listing";
export const coverVideoMaxSeconds = (purpose: CoverVideoPurpose) => (purpose === "listing" ? 30 : 15);
export const COVER_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export type CoverSlide =
  | { id: string; kind: "photo"; file: File; preview: string }
  | { id: string; kind: "video"; file: File; preview: string; frame: File; framePreview: string; seconds: number; upload: Promise<string> };

export const coverRoom = (slides: CoverSlide[]) => Math.max(0, MAX_COVER_SLIDES - slides.length);
export const hasCoverVideo = (slides: CoverSlide[]) => slides.some((slide) => slide.kind === "video");

export function moveCoverSlide<T>(slides: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return slides;
  const next = [...slides];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** What to send: one photo per slide (the video's first frame on its slide) and the video's slide. */
export function coverUploadOrder(slides: CoverSlide[]) {
  const photos = slides.map((slide) => (slide.kind === "photo" ? slide.file : slide.frame));
  const videoAt = slides.findIndex((slide) => slide.kind === "video");
  const video = videoAt >= 0 ? slides[videoAt] : null;
  return { photos, videoPosition: Math.max(0, videoAt), videoUpload: video && video.kind === "video" ? video.upload : null };
}
