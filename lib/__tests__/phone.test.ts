import { test } from "node:test";
import assert from "node:assert/strict";
import { COUNTRIES, signupPhone } from "../phone";

test("leaving the phone blank is fine", () => {
  assert.equal(signupPhone("AU", ""), null);
  assert.equal(signupPhone("AU", "  "), null);
});

test("formats an Australian mobile like the app does", () => {
  assert.deepEqual(signupPhone("AU", "0412 345 678"), { phone: "412345678", phoneCountryCode: "AU_+61", fullPhoneNumber: "+61412345678" });
});

test("uses the chosen country's dial code", () => {
  assert.deepEqual(signupPhone("NZ", "021 123 4567"), { phone: "211234567", phoneCountryCode: "NZ_+64", fullPhoneNumber: "+64211234567" });
});

test("rejects numbers that are too short or too long", () => {
  assert.deepEqual(signupPhone("AU", "123"), { error: "Check the phone number, or leave it blank" });
  assert.deepEqual(signupPhone("AU", "1".repeat(16)), { error: "Check the phone number, or leave it blank" });
});

test("ships the same country list as mobile", () => {
  assert.ok(COUNTRIES.length > 200);
  assert.ok(COUNTRIES.every((country) => /^\+\d+$/.test(country.dial)));
});
