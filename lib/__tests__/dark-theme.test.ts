import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error plain JavaScript build script
import { build, darkColor } from "../../scripts/build-dark-theme.mjs";

test("app/theme-dark.css matches the stylesheets (run npm run theme:dark after changing CSS)", () => {
  assert.equal(readFileSync("app/theme-dark.css", "utf8"), build());
});

test("maps colours by what they're for", () => {
  const page = darkColor("#ffffff", "surface");                        // page and card backgrounds go dark,
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(page.slice(i, i + 2), 16));
  assert.ok(r < 30 && g < 30 && b < 30 && b > g, page);                // with the app's slight purple tint
  assert.match(darkColor("#211d23", "surface"), /^#6840ad$/);         // near-black buttons become brand purple
  assert.equal(darkColor("#6941b4", "surface"), "#6941b4");            // purple fills stay
  assert.match(darkColor("rgba(20, 14, 26, .34)", "surface"), /^rgba\(8, 6, 10,/); // backdrops stay dark
  assert.equal(darkColor("#ffffff", "text"), "#ffffff");               // light text stays light
  const ink = darkColor("#17131f", "text");                            // dark text becomes light
  assert.ok(parseInt(ink.slice(1, 3), 16) > 200, ink);
});
