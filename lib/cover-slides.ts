/**
 * Cover slides (Hubs, events, listings; tivorah-api services/coverSlides.ts): every slide is a
 * photo. Events, items and services take up to MAX_COVER_SLIDES; a Hub's cover takes up to
 * HUB_COVER_SLIDES (the app and API allow the same).
 */
export const MAX_COVER_SLIDES = 8;
export const HUB_COVER_SLIDES = 4;

export type CoverSlide = { id: string; kind: "photo"; file: File; preview: string };

export const coverRoom = (slides: CoverSlide[], max = MAX_COVER_SLIDES) => Math.max(0, max - slides.length);

export function moveCoverSlide<T>(slides: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return slides;
  const next = [...slides];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** What to send: one photo per slide, in order. */
export function coverUploadOrder(slides: CoverSlide[]) {
  return { photos: slides.map((slide) => slide.file) };
}
