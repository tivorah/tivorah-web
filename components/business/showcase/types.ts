export type ShowcaseContent = {
  name: string;
  slug: string;
  about: string;
  story: string;
  locality: string;
  hours: string;
  serviceArea: string;
  fulfilment: string;
  bookingPolicy: string;
  logoId: number | null;
  coverId: number | null;
  gallery: { assetId: number; alt: string }[];
  videoId: number | null;
  videoTranscript: string;
  videoCaptions: string;
};
export type ShowcaseAsset = {
  id: number;
  kind: "image" | "video";
  status: string;
  url: string | null;
  mimeType: string;
  reviewNote?: string | null;
};
export type ShowcaseRecord = {
  draft: ShowcaseContent;
  published: ShowcaseContent | null;
  version: number;
  slug: string;
};
export const emptyShowcase = (username: string): ShowcaseContent => ({
  name: "",
  slug: username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  about: "",
  story: "",
  locality: "",
  hours: "",
  serviceArea: "",
  fulfilment: "",
  bookingPolicy: "",
  logoId: null,
  coverId: null,
  gallery: [],
  videoId: null,
  videoTranscript: "",
  videoCaptions: "",
});
