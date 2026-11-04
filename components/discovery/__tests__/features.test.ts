import { test } from "node:test";
import assert from "node:assert/strict";
import { featuresForPath } from "../features";

// Which switches (Admin → Features) a page or link needs: with Shop off, its business pages and
// links (Listings, Your shop, Orders) go from the side nav and header menu.
test("business links follow the Shop switch", () => {
  assert.deepEqual(featuresForPath("/business?view=listings"), ["marketplace"]);
  assert.deepEqual(featuresForPath("/business/shop"), ["marketplace"]);
  assert.deepEqual(featuresForPath("/business/orders"), ["marketplace"]);
  assert.deepEqual(featuresForPath("/business?view=events"), ["events"]);
  assert.deepEqual(featuresForPath("/business/hubs"), ["communities"]);
  // The workspace itself and payouts stay.
  assert.deepEqual(featuresForPath("/business"), []);
  assert.deepEqual(featuresForPath("/business/payouts"), []);
});

// /account/orders/[id] is an event ticket order (and where web event checkout returns), so it
// follows Events, not Shop; item orders live under /account/item-orders.
test("ticket order pages follow the Events switch", () => {
  assert.deepEqual(featuresForPath("/account/orders/42"), ["events"]);
  assert.deepEqual(featuresForPath("/account/tickets"), ["events"]);
  assert.deepEqual(featuresForPath("/account/item-orders/7"), ["marketplace"]);
});
