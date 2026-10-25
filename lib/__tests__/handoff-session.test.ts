import assert from "node:assert/strict";
import test from "node:test";
import { accountHint, continuesWithSession } from "../auth/handoff-session";

test("carries on with a sign-in for the same account", () => {
  assert.equal(continuesWithSession({ user: { id: 42 } }, "42"), true);
  assert.equal(continuesWithSession({ user: { id: "42" } }, null), true);
});

test("never carries on with another account or no sign-in", () => {
  assert.equal(continuesWithSession({ user: { id: 7 } }, "42"), false);
  assert.equal(continuesWithSession({ user: null }, "42"), false);
  assert.equal(continuesWithSession(null, null), false);
});

test("keeps only a numeric account id", () => {
  assert.equal(accountHint("42"), "42");
  assert.equal(accountHint("42; drop"), null);
  assert.equal(accountHint(null), null);
});
