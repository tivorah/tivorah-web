import assert from "node:assert/strict";
import test from "node:test";
import { conditionLabel } from "../condition-label";

test("labels conditions plainly", () => {
  assert.equal(conditionLabel("used_good"), "Used, good");
  assert.equal(conditionLabel("like_new"), "Like new");
  assert.equal(conditionLabel("new"), "New");
  assert.equal(conditionLabel(null), null);
});
