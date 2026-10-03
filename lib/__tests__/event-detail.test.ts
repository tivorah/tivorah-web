import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiscoveryItem } from "../api/discovery";
import { eventPhotos, galleryLayout, hiddenPhotoCount, isEventOrganiser, primaryCategory, relatedEvents, wrapIndex } from "../event-detail";

const item = (id: number): DiscoveryItem => ({ id, title: `Event ${id}`, description: null, image: null, locality: null, state: null });

describe("eventPhotos", () => {
  it("puts the cover first, removes duplicates and drops unsafe or empty values", () => {
    assert.deepEqual(
      eventPhotos("https://cdn/a.jpg", ["https://cdn/b.jpg", "https://cdn/a.jpg", "", "javascript:alert(1)", "/local.jpg"]),
      ["https://cdn/a.jpg", "https://cdn/b.jpg"],
    );
  });
  it("handles a missing cover or image list", () => {
    assert.deepEqual(eventPhotos(null, ["https://cdn/b.jpg"]), ["https://cdn/b.jpg"]);
    assert.deepEqual(eventPhotos(null, null), []);
  });
});

describe("galleryLayout", () => {
  it("adapts to the number of photos", () => {
    assert.equal(galleryLayout(0), "none");
    assert.equal(galleryLayout(1), "single");
    assert.equal(galleryLayout(2), "pair");
    assert.equal(galleryLayout(3), "mosaic");
    assert.equal(galleryLayout(12), "mosaic");
  });
  it("counts photos beyond the three mosaic tiles", () => {
    assert.equal(hiddenPhotoCount(3), 0);
    assert.equal(hiddenPhotoCount(7), 4);
  });
});

describe("wrapIndex", () => {
  it("wraps forwards and backwards", () => {
    assert.equal(wrapIndex(3, 3), 0);
    assert.equal(wrapIndex(-1, 3), 2);
    assert.equal(wrapIndex(1, 0), 0);
  });
});

describe("primaryCategory", () => {
  it("takes the first listed category", () => {
    assert.equal(primaryCategory("Music | Food"), "Music");
    assert.equal(primaryCategory("  | Sport"), "Sport");
    assert.equal(primaryCategory(null), null);
  });
});

describe("relatedEvents", () => {
  it("prefers same-category events, tops up from upcoming, and never repeats or shows the current event", () => {
    const result = relatedEvents(5, [item(5), item(1), item(2)], [item(2), item(3), item(4), item(6)], 4);
    assert.deepEqual(result.map((event) => event.id), [1, 2, 3, 4]);
  });
  it("returns nothing when the only event is the current one", () => {
    assert.deepEqual(relatedEvents(5, [item(5)], [item(5)]), []);
  });
});

describe("isEventOrganiser", () => {
  it("matches the signed-in username case-insensitively", () => {
    assert.equal(isEventOrganiser("taylor", "Taylor"), true);
  });
  it("is false when signed out, for other members, or when the organiser is unknown", () => {
    assert.equal(isEventOrganiser(null, "taylor"), false);
    assert.equal(isEventOrganiser("sam_cooks", "taylor"), false);
    assert.equal(isEventOrganiser("taylor", null), false);
  });
});

import { directionsUrl } from "../event-detail";
describe("directionsUrl", () => {
  it("routes to the venue and lets Google Maps start from the device when no position is shared", () => {
    const url = new URL(directionsUrl("Bar 9, 91 Hindley St, Adelaide SA"));
    assert.equal(url.origin + url.pathname, "https://www.google.com/maps/dir/");
    assert.equal(url.searchParams.get("destination"), "Bar 9, 91 Hindley St, Adelaide SA");
    assert.equal(url.searchParams.get("origin"), null);
  });
  it("starts from the shared position, rounded to about a metre", () => {
    const url = new URL(directionsUrl("Venue", { latitude: -34.928494123, longitude: 138.600742987 }));
    assert.equal(url.searchParams.get("origin"), "-34.92849,138.60074");
  });
});
