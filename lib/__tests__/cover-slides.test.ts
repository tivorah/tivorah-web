import assert from "node:assert/strict";
import test from "node:test";
import { coverVideoSlide } from "../cover-slides";

test("the cover video plays on its own slide", () => {
  assert.equal(coverVideoSlide(2, 4), 2);
  assert.equal(coverVideoSlide(3, 2), 1);
});

test("older covers, and anything unexpected, use the first slide", () => {
  for (const value of [undefined, null, -1, 1.5]) assert.equal(coverVideoSlide(value as number | null | undefined, 3), 0);
});

import { coverRoom, coverUploadOrder, MAX_COVER_SLIDES, moveCoverSlide, type CoverSlide } from "../cover-slides";

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });
const photo = (name: string): CoverSlide => ({ id: name, kind: "photo", file: file(name), preview: name });
const video: CoverSlide = { id: "v", kind: "video", file: new File(["x"], "clip.mp4", { type: "video/mp4" }), preview: "v", frame: file("frame.jpg"), framePreview: "f", seconds: 12, upload: Promise.resolve("upload-1") };

test("four slides at most, e.g. three photos and a video", () => {
  assert.equal(MAX_COVER_SLIDES, 4);
  assert.equal(coverRoom([photo("a"), photo("b"), photo("c"), video]), 0);
});

test("the video's first frame is sent on its slide, with that slide", async () => {
  const slides = moveCoverSlide([photo("a"), photo("b"), video], 2, 1);
  const order = coverUploadOrder(slides);
  assert.deepEqual(order.photos.map((item) => item.name), ["a", "frame.jpg", "b"]);
  assert.equal(order.videoPosition, 1);
  assert.equal(await order.videoUpload, "upload-1");
  assert.equal(coverUploadOrder([photo("a")]).videoUpload, null);
});
