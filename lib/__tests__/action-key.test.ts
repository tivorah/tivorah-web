import assert from "node:assert/strict";
import test from "node:test";
import { createActionKey } from "../action-key";

test("keeps one key while the same action is resent", () => {
  const key = createActionKey();
  const first = key.for("order:1");
  assert.equal(key.for("order:1"), first);
  assert.notEqual(key.for("order:2"), first);
});

test("starts a new key once the action succeeded or was refused", () => {
  const key = createActionKey();
  const first = key.for("order:1");
  key.done();
  assert.notEqual(key.for("order:1"), first);
});
