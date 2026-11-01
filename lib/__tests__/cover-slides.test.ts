import assert from "node:assert/strict";
import test from "node:test";
import { coverRoom, coverUploadOrder, HUB_COVER_SLIDES, MAX_COVER_SLIDES, moveCoverSlide, type CoverSlide } from "../cover-slides";

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });
const photo = (name: string): CoverSlide => ({ id: name, kind: "photo", file: file(name), preview: name });
const photos = (count: number) => Array.from({ length: count }, (_, index) => photo(`p${index}`));

test("events and listings take eight photo slides, Hubs four", () => {
  assert.equal(MAX_COVER_SLIDES, 8);
  assert.equal(HUB_COVER_SLIDES, 4);
  assert.equal(coverRoom(photos(8)), 0);
  assert.equal(coverRoom(photos(3)), 5);
  assert.equal(coverRoom(photos(4), HUB_COVER_SLIDES), 0);
  assert.equal(coverRoom(photos(5), HUB_COVER_SLIDES), 0);
});

test("slides are sent as photos in the order arranged", () => {
  const slides = moveCoverSlide([photo("a"), photo("b"), photo("c")], 2, 0);
  assert.deepEqual(coverUploadOrder(slides).photos.map((item) => item.name), ["c", "a", "b"]);
  assert.equal(moveCoverSlide([photo("a")], 0, 3).length, 1);
});
