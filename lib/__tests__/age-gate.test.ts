import { test } from "node:test";
import assert from "node:assert/strict";
import { adultFrom, isUnderage } from "../age-gate";

const now = new Date("2026-10-26T12:00:00Z");

test("works out the day someone turns 18", () => {
  assert.equal(adultFrom("2010-03-15"), "2028-03-15");
  assert.equal(adultFrom("2010-02-30"), null);
  assert.equal(adultFrom(""), null);
});

test("only a real birth date under 18 counts as under age", () => {
  assert.equal(isUnderage("2010-03-15", now), true);
  assert.equal(isUnderage("2008-10-26", now), false); // 18 today
  assert.equal(isUnderage("1990-01-01", now), false);
  // An invalid or half-typed date is not "under 18", so it never blocks anyone.
  assert.equal(isUnderage("0201-01-01", now), false);
  assert.equal(isUnderage("2010-13-01", now), false);
});
