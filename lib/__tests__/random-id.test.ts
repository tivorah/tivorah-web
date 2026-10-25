import assert from "node:assert/strict";
import test from "node:test";
import { randomId } from "../random-id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("makes a v4 UUID, even where crypto.randomUUID is missing (http pages)", () => {
  assert.match(randomId(), UUID);
  const original = globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
  try {
    const ids = new Set(Array.from({ length: 50 }, () => randomId()));
    assert.equal(ids.size, 50);
    for (const id of ids) assert.match(id, UUID);
  } finally {
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: original, configurable: true });
  }
});
