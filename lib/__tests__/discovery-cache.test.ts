import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createDiscoveryCache } from "../api/discovery-cache";

const page = (id: number) => ({ items: [{ id, title: `#${id}`, description: null, image: null, locality: null, state: null }], nextSkip: null });

describe("createDiscoveryCache", () => {
  beforeEach(() => mock.timers.enable({ apis: ["Date"], now: 0 }));
  afterEach(() => mock.timers.reset());

  it("returns a stored page until it expires after 30 seconds", () => {
    const cache = createDiscoveryCache();
    cache.set("a", page(1));
    mock.timers.tick(29_999);
    assert.equal(cache.get("a")?.items[0].id, 1);
    mock.timers.tick(1);
    assert.equal(cache.get("a"), null);
  });

  it("keeps at most 40 pages and evicts the least recently used", () => {
    const cache = createDiscoveryCache();
    for (let index = 0; index < 40; index += 1) cache.set(`k${index}`, page(index));
    assert.ok(cache.get("k0"));
    cache.set("k40", page(40));
    assert.ok(cache.get("k0"), "recently read page survives");
    assert.equal(cache.get("k1"), null, "oldest unread page is evicted");
  });

  it("clears everything", () => {
    const cache = createDiscoveryCache();
    cache.set("a", page(1));
    cache.clear();
    assert.equal(cache.get("a"), null);
  });
});
