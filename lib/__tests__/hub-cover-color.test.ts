import assert from "node:assert/strict";
import test from "node:test";
import { hubCoverBackground } from "../hub-cover-color";

test("uses the Hub's stored colour, otherwise a steady one from its id (same order as the API and app)", () => {
  assert.equal(hubCoverBackground(1, "teal"), "linear-gradient(160deg, #2A9D8F, #1C6B62 55%, #0E2E2B)");
  assert.match(hubCoverBackground(9, null), /#2F7FC1/);
  assert.match(hubCoverBackground(4, "neon"), /#E07A4F/);
});
