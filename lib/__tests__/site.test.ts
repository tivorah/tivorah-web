import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, socialImage } from "../site";

describe("pageMetadata", () => {
  it("sets the canonical path and matching social previews", () => {
    const metadata = pageMetadata("Events | Tivorah", "Find events", "/events");
    assert.deepEqual(metadata.alternates, { canonical: "/events" });
    assert.equal((metadata.openGraph as { url?: string }).url, "/events");
    assert.deepEqual((metadata.twitter as { images?: unknown }).images, [socialImage]);
  });
});
