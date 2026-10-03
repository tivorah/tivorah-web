import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categorySummary, hubInterestTiers, selectedCategories, toggleCategory } from "../category-filter";

describe("multi-select category filter", () => {
  it("reads several choices from the URL value", () => {
    assert.deepEqual(selectedCategories("Careers, Fitness & wellbeing,,Careers"), ["Careers", "Fitness & wellbeing"]);
    assert.deepEqual(selectedCategories(null), []);
  });
  it("adds and removes one choice at a time", () => {
    assert.equal(toggleCategory("", "Careers"), "Careers");
    assert.equal(toggleCategory("Careers", "Sports"), "Careers,Sports");
    assert.equal(toggleCategory("Careers,Sports", "Careers"), "Sports");
  });
  it("clears every choice from the All option", () => assert.equal(toggleCategory("Careers,Sports", ""), ""));
  it("summarises the selection on the trigger", () => {
    assert.equal(categorySummary([], "All interests"), "All interests");
    assert.equal(categorySummary(["Careers"], "All interests"), "Careers");
    assert.equal(categorySummary(["Careers", "Sports", "Music"], "All interests"), "Careers +2");
  });
});

describe("hubInterestTiers", () => {
  it("treats the first interest as primary and limits secondary ones", () => {
    assert.deepEqual(hubInterestTiers(["Careers", "Networking", "Small business", "Mentoring"]), { primary: "Careers", secondary: ["Networking", "Small business"], more: 1 });
  });
  it("handles hubs with one or no interests", () => {
    assert.deepEqual(hubInterestTiers(["Careers"]), { primary: "Careers", secondary: [], more: 0 });
    assert.deepEqual(hubInterestTiers(undefined), { primary: null, secondary: [], more: 0 });
  });
});
