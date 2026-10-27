import { test } from "node:test";
import assert from "node:assert/strict";
import { ANALYTICS_CHOICE_KEY, ANALYTICS_OFF_KEY, analyticsAllowed, analyticsChoice, analyticsTurnedOff, browserAsksNotToTrack, rememberAnalyticsChoice, shouldAskForAnalytics } from "../analytics-choice";

const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), removeItem: (key: string) => void values.delete(key) };
};

test("analytics is off until the visitor says yes, and we ask once", () => {
  const store = memory();
  assert.equal(analyticsAllowed(true, store, {}), false);
  assert.equal(shouldAskForAnalytics(true, store, {}), true);
  rememberAnalyticsChoice(true, store);
  assert.equal(store.getItem(ANALYTICS_CHOICE_KEY), "on");
  assert.equal(analyticsAllowed(true, store, {}), true);
  assert.equal(shouldAskForAnalytics(true, store, {}), false);
  assert.equal(analyticsAllowed(false, store, {}), false);
});

test("saying no is remembered and nothing runs", () => {
  const store = memory();
  rememberAnalyticsChoice(false, store);
  assert.equal(analyticsChoice(store), "off");
  assert.equal(analyticsTurnedOff(store), true);
  assert.equal(analyticsAllowed(true, store, {}), false);
  assert.equal(shouldAskForAnalytics(true, store, {}), false);
});

test("the browser's privacy signals win, even after a yes, and we don't ask", () => {
  const store = memory();
  rememberAnalyticsChoice(true, store);
  assert.equal(analyticsAllowed(true, store, { globalPrivacyControl: true }), false);
  assert.equal(analyticsAllowed(true, store, { doNotTrack: "1" }), false);
  assert.equal(shouldAskForAnalytics(true, memory(), { globalPrivacyControl: true }), false);
  assert.equal(browserAsksNotToTrack({ doNotTrack: "0" }), false);
  assert.equal(browserAsksNotToTrack(undefined), false);
});

test("an earlier 'off' (before analytics asked first) still counts as no", () => {
  const store = memory();
  store.setItem(ANALYTICS_OFF_KEY, "1");
  assert.equal(analyticsChoice(store), "off");
  assert.equal(shouldAskForAnalytics(true, store, {}), false);
});

test("a blocked browser storage never breaks the page, and analytics stays off", () => {
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  assert.equal(analyticsAllowed(true, broken, {}), false);
  assert.doesNotThrow(() => rememberAnalyticsChoice(false, broken));
});
