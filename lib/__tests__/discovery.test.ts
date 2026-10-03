import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { itemPath, money } from "../api/discovery";

describe("itemPath", () => {
  it("builds public detail URLs for each kind", () => {
    assert.equal(itemPath("events", 39), "/events/39");
    assert.equal(itemPath("items", 7), "/shop/items/7");
    assert.equal(itemPath("services", 4), "/services/4");
    assert.equal(itemPath("hubs", 2), "/hubs/2");
  });
});

describe("money", () => {
  it("formats integer cents with the currency code", () => {
    assert.match(money(5_200), /^AUD\s52\.00$/);
    assert.match(money(15_600, "NZD"), /^NZD\s156\.00$/);
  });
});
