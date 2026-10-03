import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath } from "../auth/return-path";

describe("safeReturnPath (open-redirect protection after sign-in)", () => {
  it("keeps same-site product destinations with their query and hash", () => {
    assert.equal(safeReturnPath("/events/39?ticket=2&quantity=3#tickets"), "/events/39?ticket=2&quantity=3#tickets");
    assert.equal(safeReturnPath("/business/events/39"), "/business/events/39");
    assert.equal(safeReturnPath("/account"), "/account");
  });
  for (const value of [
    "https://evil.example/account",
    "//evil.example/account",
    "/\\evil.example",
    "\\\\evil.example",
    "/events\u0000/1",
    "/ events",
    "javascript:alert(1)",
    "/admin",
    "/auth/signin",
    "/eventsx/1",
    "",
    null,
    undefined,
  ]) {
    it(`falls back to /account for ${JSON.stringify(value)}`, () => assert.equal(safeReturnPath(value), "/account"));
  }
  it("normalises dot segments before checking the destination", () => {
    assert.equal(safeReturnPath("/events/../admin"), "/account");
    assert.equal(safeReturnPath("/account/../events/5"), "/events/5");
  });
});
