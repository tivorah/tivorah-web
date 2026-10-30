import { test } from "node:test";
import assert from "node:assert/strict";
import { newPackage, packagesPayload } from "../events/packages-editor";
import { AU_STATE_NAMES, venueSearchText, venuesInState } from "../events/event-venue-field";
import { quickHubs } from "../hub-share-field";
import { creationPayload } from "../create-payload";

test("create form: one currency, free prices and empty quantities follow the event", () => {
  const drafts = [
    newPackage({ name: "General admission", price: "25", quantity: "", currency: "NZD" }),
    newPackage({ name: "VIP", price: "80", quantity: "20" }),
  ];
  const paid = packagesPayload(drafts, { currency: "USD", paidAllowed: true, unlimited: 150 });
  assert.deepEqual(paid.map((ticket) => [ticket.currency, ticket.priceCents, ticket.quantity]), [["USD", 2500, 150], ["USD", 8000, 20]]);
  const free = packagesPayload(drafts, { currency: "AUD", paidAllowed: false, unlimited: 1000000 });
  assert.deepEqual(free.map((ticket) => [ticket.priceCents, ticket.quantity]), [[0, 1000000], [0, 20]]);
});

test("without options the drafts are read as they are (event workspace)", () => {
  assert.throws(() => packagesPayload([newPackage({ name: "General admission", quantity: "" })]), /available/);
  assert.throws(() => packagesPayload([newPackage({ name: "A", currency: "AUD" }), newPackage({ name: "B", currency: "NZD" })]), /one currency/);
  assert.equal(packagesPayload([newPackage({ name: "A", price: "0.4" })], { paidAllowed: false })[0].priceCents, 0);
  assert.throws(() => packagesPayload([newPackage({ name: "A", price: "0.4" })]), /at least \$0\.50/);
});

test("venue search stays inside the chosen state", () => {
  assert.equal(Object.keys(AU_STATE_NAMES).length, 8);
  assert.equal(venueSearchText(" 12 King William St ", "SA"), "12 King William St, South Australia");
  assert.equal(venueSearchText("Rundle Mall south australia", "SA"), "Rundle Mall south australia");
  const found = [{ id: "a", locality: { state: "SA" } }, { id: "b", locality: { state: "VIC" } }, { id: "c", locality: null }];
  assert.deepEqual(venuesInState(found, "SA").map((item) => item.id), ["a", "c"]);
});

test("three Hubs inline: chosen first, then owned, then joined", () => {
  const hubs = [{ id: 1, owner: false }, { id: 2, owner: true }, { id: 3, owner: false }, { id: 4, owner: true }, { id: 5, owner: false }];
  assert.deepEqual(quickHubs(hubs, [5], (hub) => hub.owner).map((hub) => hub.id), [5, 2, 4]);
  assert.deepEqual(quickHubs(hubs, [], (hub) => hub.owner).map((hub) => hub.id), [2, 4, 1]);
});

test("event capacity is only sent when limited, with the venue's map pin", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ mode: "venue", title: "Rooftop social", startsAt: "2030-01-01T10:00", endsAt: "2030-01-01T12:00", address: "12 King William St" })) form.set(key, value);
  const place = { suburb: "Adelaide", state: "SA", postcode: "5000", countryCode: "AU" };
  const tickets = [{ name: "General admission", priceCents: 0, quantity: 1000000, maxTicketsPerBuyer: 4 }, { name: "VIP", priceCents: 0, quantity: 1000000, maxTicketsPerBuyer: 4 }];
  const open = creationPayload(form, "event", place, ["https://example.test/e.jpg"], "key", tickets, undefined, { latitude: -34.92, longitude: 138.6 });
  assert.equal("capacity" in open, false);
  assert.ok("latitude" in open);
  assert.equal(open.latitude, -34.92);
  const limited = creationPayload(form, "event", place, ["https://example.test/e.jpg"], "key", [{ ...tickets[0], quantity: 100 }], undefined, { capacity: 100 });
  assert.ok("capacity" in limited);
  assert.equal(limited.capacity, 100);
  assert.equal("latitude" in limited, false);
});
