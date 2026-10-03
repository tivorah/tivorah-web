import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { keyboardInset, shouldDismissSheet } from "../sheet-gesture";

describe("shouldDismissSheet", () => {
  it("closes after a long drag or a quick flick", () => {
    assert.equal(shouldDismissSheet(140, 0.2), true);
    assert.equal(shouldDismissSheet(40, 1.6), true);
  });
  it("springs back after a short, slow drag or a tiny accidental flick", () => {
    assert.equal(shouldDismissSheet(60, 0.3), false);
    assert.equal(shouldDismissSheet(10, 3), false);
  });
});

describe("keyboardInset", () => {
  it("measures how much the iOS keyboard covers the bottom of the page", () => {
    assert.equal(keyboardInset(844, 508, 0), 336);
  });
  it("is zero when the browser already resized for the keyboard or none is shown", () => {
    assert.equal(keyboardInset(508, 508, 0), 0);
    assert.equal(keyboardInset(844, 844, 0), 0);
  });
  it("accounts for the visual viewport being scrolled", () => assert.equal(keyboardInset(844, 508, 40), 296));
});
