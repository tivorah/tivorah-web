import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { generateStrongPassword, passwordHint, passwordMeetsRules, SUGGESTED_PASSWORD_LENGTH } from "../password-policy";

// Mirrors tivorah-mobile/utils/__tests__/passwordPolicy.test.ts.
const secureBytes = (count: number) => new Uint8Array(randomBytes(count));

describe("passwordHint", () => {
  it("summarises every requirement in one line before typing", () => {
    assert.deepEqual(passwordHint(""), { met: false, text: "Use 10+ characters with upper & lower case, a number and a symbol." });
  });
  it("names only what is still missing", () => {
    assert.equal(passwordHint("abcdefghij").text, "Add upper & lower case, a number and a symbol");
    assert.equal(passwordHint("Abcdefghij1").text, "Add a symbol");
    assert.equal(passwordHint("Ab1!").text, "Add 6 more characters");
    assert.equal(passwordHint("Abcdefgh1").text, "Add 1 more character and a symbol");
  });
  it("confirms when all requirements are met", () => {
    assert.deepEqual(passwordHint("Tivorah#2026"), { met: true, text: "Meets all requirements" });
  });
});

describe("passwordMeetsRules", () => {
  for (const [value, expected] of [["short", false], ["alllowercase1!", false], ["NoSymbols12345", false], ["Tivorah#2026", true]] as const) {
    it(`${value} → ${expected}`, () => assert.equal(passwordMeetsRules(value), expected));
  }
});

describe("generateStrongPassword", () => {
  it("always satisfies every rule and avoids misreadable characters", () => {
    for (let run = 0; run < 500; run += 1) {
      const password = generateStrongPassword(secureBytes);
      assert.equal(password.length, SUGGESTED_PASSWORD_LENGTH);
      assert.ok(passwordMeetsRules(password), password);
      assert.doesNotMatch(password, /[0O1lI]/);
    }
  });
  it("produces different passwords on each call", () => {
    assert.equal(new Set(Array.from({ length: 50 }, () => generateStrongPassword(secureBytes))).size, 50);
  });
});
