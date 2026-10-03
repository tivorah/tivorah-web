import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { feeRateFromQuote, platformFee, rollAmount, ticketTotals } from "../ticket-pricing";

// Same cases as tivorah-api/src/services/stripe.test.ts, so the browser and server agree.
describe("platformFee", () => {
  it("applies basis points in integer cents", () => assert.equal(platformFee(10_000, { percentageBps: 500, fixedFeeCents: 0, chargedTo: "provider" }), 500));
  it("adds a fixed fee and rounds fractional cents deterministically", () => assert.equal(platformFee(999, { percentageBps: 500, fixedFeeCents: 50, chargedTo: "buyer" }), 100));
  it("never takes more than the subtotal from the provider", () => assert.equal(platformFee(100, { percentageBps: 0, fixedFeeCents: 500, chargedTo: "provider" }), 100));
  it("is zero for free orders", () => assert.equal(platformFee(0, { percentageBps: 500, fixedFeeCents: 50, chargedTo: "buyer" }), 0));
});

describe("ticketTotals", () => {
  const buyerRate = { percentageBps: 500, fixedFeeCents: 30, chargedTo: "buyer" as const };
  it("charges the fee once per order, not per ticket", () => {
    assert.deepEqual(ticketTotals(5_200, 3, buyerRate), { subtotalCents: 15_600, platformFeeCents: 810, buyerTotalCents: 16_410, chargedTo: "buyer" });
  });
  it("keeps the buyer total equal to the subtotal when the organiser pays the fee", () => {
    const totals = ticketTotals(5_200, 2, { ...buyerRate, chargedTo: "provider" });
    assert.equal(totals?.buyerTotalCents, 10_400);
    assert.equal(totals?.platformFeeCents, 550);
  });
  it("needs no rate for free tickets", () => {
    assert.deepEqual(ticketTotals(0, 4, null), { subtotalCents: 0, platformFeeCents: 0, buyerTotalCents: 0, chargedTo: "provider" });
  });
  it("waits for the rate before pricing a paid ticket", () => assert.equal(ticketTotals(5_200, 1, null), null));
  it("ignores fractional or negative quantities", () => {
    assert.equal(ticketTotals(1_000, 2.7, buyerRate)?.subtotalCents, 2_000);
    assert.equal(ticketTotals(1_000, -1, buyerRate)?.subtotalCents, 0);
  });
});

describe("feeRateFromQuote", () => {
  it("reads the rate returned with a paid quote", () => {
    assert.deepEqual(feeRateFromQuote({ percentageBps: 300, fixedFeeCents: 25, chargedTo: "buyer" }), { percentageBps: 300, fixedFeeCents: 25, chargedTo: "buyer" });
  });
  it("defaults safely for a free quote that carries no rate", () => {
    assert.deepEqual(feeRateFromQuote({ chargedTo: "provider" }), { percentageBps: 0, fixedFeeCents: 0, chargedTo: "provider" });
  });
});

describe("rollAmount", () => {
  it("starts at the old amount and always lands exactly on the new one", () => {
    assert.equal(rollAmount(5_200, 15_600, 0), 5_200);
    assert.equal(rollAmount(5_200, 15_600, 1), 15_600);
    assert.equal(rollAmount(5_200, 15_600, 1.4), 15_600);
  });
  it("moves monotonically toward the target", () => {
    const steps = [0.1, 0.3, 0.6, 0.9].map((progress) => rollAmount(0, 1_000, progress));
    assert.deepEqual([...steps].sort((a, b) => a - b), steps);
  });
});
