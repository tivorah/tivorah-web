import { test } from "node:test";
import assert from "node:assert/strict";
import { ANALYTICS_OFF_KEY, analyticsAllowed, analyticsTurnedOff, browserAsksNotToTrack, rememberAnalyticsChoice } from "../analytics-choice";

const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), removeItem: (key: string) => void values.delete(key) };
};

test("analytics runs only when set up, not turned off and not refused by the browser", () => {
  const store = memory();
  assert.equal(analyticsAllowed(true, store, {}), true);
  assert.equal(analyticsAllowed(false, store, {}), false);
  assert.equal(analyticsAllowed(true, store, { globalPrivacyControl: true }), false);
  assert.equal(analyticsAllowed(true, store, { doNotTrack: "1" }), false);
});

test("turning analytics off is remembered, and turning it back on clears the choice", () => {
  const store = memory();
  rememberAnalyticsChoice(false, store);
  assert.equal(store.getItem(ANALYTICS_OFF_KEY), "1");
  assert.equal(analyticsTurnedOff(store), true);
  assert.equal(analyticsAllowed(true, store, {}), false);
  rememberAnalyticsChoice(true, store);
  assert.equal(analyticsTurnedOff(store), false);
});

test("reads the browser's privacy signals", () => {
  assert.equal(browserAsksNotToTrack({ globalPrivacyControl: true }), true);
  assert.equal(browserAsksNotToTrack({ doNotTrack: "1" }), true);
  assert.equal(browserAsksNotToTrack({ doNotTrack: "0" }), false);
  assert.equal(browserAsksNotToTrack(undefined), false);
});

test("a blocked browser storage never breaks the page", () => {
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  assert.equal(analyticsTurnedOff(broken), false);
  assert.doesNotThrow(() => rememberAnalyticsChoice(false, broken));
});
