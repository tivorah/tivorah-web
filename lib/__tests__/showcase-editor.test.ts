import assert from "node:assert/strict";
import test from "node:test";
import { destinationLabel } from "../auth/handoff-destination";
import { moveItem } from "../../components/ui/use-sortable";

test("moveItem drops an entry at its new position without touching the original", () => {
  const list = ["a", "b", "c", "d"];
  assert.deepEqual(moveItem(list, 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveItem(list, 3, 0), ["d", "a", "b", "c"]);
  assert.deepEqual(moveItem(list, 1, 1), list);
  assert.deepEqual(list, ["a", "b", "c", "d"]);
});

test("the hand-off loader names where people are going", () => {
  assert.equal(destinationLabel("/business/showcase"), "your showcase");
  assert.equal(destinationLabel("/business/listings/12"), "your listing");
  assert.equal(destinationLabel("/business/events/4#tickets"), "your event");
  assert.equal(destinationLabel("/business"), "your business dashboard");
  assert.equal(destinationLabel("/somewhere"), "Tivorah");
});
