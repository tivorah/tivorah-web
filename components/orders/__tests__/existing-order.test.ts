import assert from "node:assert/strict";
import test from "node:test";
import { defaultSellerNote, existingItemOrder, existingOrderMessage, sellerNoteFor } from "../existing-order";

const order = (id: number, productId: number, status: string) => ({ id, productId, status });

test("finds the newest order still going for the item", () => {
  assert.deepEqual(existingItemOrder([order(3, 7, "accepted"), order(2, 7, "requested")], 7), { order: order(3, 7, "accepted") });
  assert.deepEqual(existingItemOrder([order(4, 7, "ready")], 7), { order: order(4, 7, "ready") });
});

test("finished orders and other items don't count", () => {
  assert.equal(existingItemOrder([order(1, 7, "completed"), order(2, 7, "cancelled"), order(5, 8, "requested")], 7), null);
  assert.equal(existingItemOrder(undefined, 7), null);
});

test("says where the earlier order is and that another is fine", () => {
  assert.match(existingOrderMessage("requested"), /waiting for the seller.*still place another/);
  assert.match(existingOrderMessage("ready"), /is ready/);
});

test("the seller's default note thanks on accept and apologises on decline", () => {
  const note = defaultSellerNote("Sofia");
  assert.equal(sellerNoteFor("accept", note, "Sofia"), note);
  assert.equal(sellerNoteFor("decline", note, "Sofia"), "Sorry, Sofia, I can’t take this order right now.");
  assert.equal(sellerNoteFor("decline", " Sold out today ", "Sofia"), "Sold out today");
  assert.equal(sellerNoteFor("accept", "  ", "Sofia"), undefined);
});
