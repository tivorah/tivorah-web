import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMoneyToCents } from "../money";

test("parses typed prices straight into whole cents", () => {
  for (const [input, cents] of [["26", 2600], ["26.42", 2642], [".5", 50], ["1,299.50", 129950], ["$26.42", 2642], ["0.29", 29], ["4.35", 435]] as const) {
    assert.equal(parseMoneyToCents(input), cents, input);
  }
});

test("rejects anything that isn't a plain amount with at most two decimals", () => {
  for (const input of ["", "1.005", "1e3", "-5", "abc", "1.2.3", "."]) assert.equal(parseMoneyToCents(input), null, input);
});
