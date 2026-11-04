import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blockConfirmText, blockedPersonName } from "../blocks";

describe("blocking copy", () => {
  it("asks about the named person and says where to unblock", () => {
    const text = blockConfirmText("Priya Sharma");
    assert.match(text, /^Block Priya Sharma\?/);
    assert.match(text, /won’t be able to message or call you/);
    assert.match(text, /Blocked people/);
  });

  it("names people by name, falling back to their username", () => {
    assert.equal(blockedPersonName({ firstName: "Priya", lastName: "Sharma", username: "priya_cooks" }), "Priya Sharma");
    assert.equal(blockedPersonName({ firstName: null, lastName: null, username: "priya_cooks" }), "@priya_cooks");
  });
});
