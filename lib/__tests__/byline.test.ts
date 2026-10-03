import { test } from "node:test";
import assert from "node:assert/strict";
import { discoveryByline } from "../byline";

test("listings prefer the business name, then the seller's name, then @username", () => {
  assert.equal(discoveryByline("items", { businessName: "Sam's Kitchen", ownerName: "Sam Lee" }), "Sam's Kitchen");
  assert.equal(discoveryByline("services", { businessName: " ", ownerName: "Sam Lee" }), "Sam Lee");
  assert.equal(discoveryByline("items", { sellerUsername: "sam" }), "@sam");
});

test("events prefer the organiser's display name", () => {
  assert.equal(discoveryByline("events", { displayName: "Adelaide Socials", ownerName: "Sam Lee" }), "Adelaide Socials");
  assert.equal(discoveryByline("events", { ownerName: "Sam Lee" }), "Sam Lee");
  assert.equal(discoveryByline("events", { ownerUsername: "sam" }), "@sam");
});

test("hubs have no byline here (they show their creator separately)", () => {
  assert.equal(discoveryByline("hubs", { ownerName: "Sam" }), "");
});
