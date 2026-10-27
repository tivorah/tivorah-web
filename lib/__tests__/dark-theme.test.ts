import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error plain JavaScript build script
import { build, convertStylesheet, darkColor } from "../../scripts/build-dark-theme.mjs";

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

test("a later reset still wins in dark, like it does in light", () => {
  const css = convertStylesheet(".hero { background: #eee7f6; }\n.hero, .other { background: transparent; border: 0; }\n.search { border: 1px solid #ddd; }\n.search { border: 0; }");
  // The coloured rule is converted, and the later resets follow it in the same order.
  assert.match(css, /\.hero \{\n  background: #[0-9a-f]{6};\n\}[\s\S]*\.hero,\n:root\[data-theme="dark"\] \.other \{\n  background: transparent;\n\}/);
  assert.match(css, /\.search \{\n  border: 0;\n\}/);
});

test("rules with no dark colour to override stay out, so CSS modules keep winning", () => {
  assert.equal(convertStylesheet("button { background: var(--purple); }"), "");
  assert.equal(convertStylesheet(".tag { color: #ffffff; }"), "");
});
