import { test } from "node:test";
import assert from "node:assert/strict";
import { maskEmail } from "../mask-email";

test("masks emails the same way as the app", () => {
  assert.equal(maskEmail("godwin.obi@gmail.com"), "god•••bi@gmail.com");
  assert.equal(maskEmail("ada@tivorah.com.au"), "a••@ti•••.com.au");
  assert.equal(maskEmail("jo@gmail.com"), "j•@gmail.com");
  assert.equal(maskEmail(""), "");
});
