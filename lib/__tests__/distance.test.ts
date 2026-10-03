import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceLabel } from "../distance";

test("matches the mobile wording at every range", () => {
  assert.equal(distanceLabel(0), "Nearby");
  assert.equal(distanceLabel(0.45), "500 m away");
  assert.equal(distanceLabel(0.94), "900 m away");
  assert.equal(distanceLabel(0.96), "1 km away");
  assert.equal(distanceLabel(2.34), "2.3 km away");
  assert.equal(distanceLabel(9.96), "10 km away");
  assert.equal(distanceLabel(12.4), "12 km away");
});

test("shows nothing without a usable distance", () => {
  assert.equal(distanceLabel(null), null);
  assert.equal(distanceLabel(undefined), null);
  assert.equal(distanceLabel(-1), null);
});
