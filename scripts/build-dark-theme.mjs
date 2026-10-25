#!/usr/bin/env node
/**
 * Builds app/theme-dark.css: the dark version of every colour in the site's stylesheets, applied
 * only under <html data-theme="dark"> (lib/theme.ts sets it from the app's theme or the phone's).
 *
 * The stylesheets use plain colours, so instead of hand-writing a dark rule for each one, this reads
 * every rule and maps its colours by what they're for: backgrounds become dark surfaces, text becomes
 * light ink, borders become dark lines, brand purples stay readable, white text on a purple button
 * stays white, and near-black button fills become the brand purple (the app's "purple on dark").
 *
 *   node scripts/build-dark-theme.mjs          # regenerate after changing any stylesheet
 *   node scripts/build-dark-theme.mjs --check  # fail if app/theme-dark.css is out of date (tests)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(root, "app/theme-dark.css");

/** Stylesheets in the order the site loads them (app/layout.tsx first, then component styles). */
export const SOURCES = [
  "app/product.css", "app/discovery-filters.css", "app/styles.css", "app/brand.css", "app/product-tour.css",
  "app/centered-layout.css", "app/journey-polish.css", "app/legal.css", "app/home-polish.css", "app/date-field.css",
  "app/select-field.css", "app/shop.css", "app/refine.css", "app/sheet.css", "app/form-shape.css", "app/shop-editor.css",
  "app/mobile-app.css", "app/events/events.css", "app/media-gallery.css", "app/hub-preview.css",
  "components/ui/bottom-bar.css", "components/discovery/service-highlights.css", "components/discovery/checkout-hold-banner.css",
  "components/orders/item-orders.css", "components/bookings/bookings.css", "components/account/booking-help.css",
  "components/business/hubs/hubs.css",
].filter((file) => existsSync(join(root, file)));
// app/controls.css themes itself (CSS variables set in the header below), so it isn't converted.
const SKIP = ["app/theme-dark.css", "app/controls.css"];
// Any other stylesheet (not CSS modules, whose class names are hashed) follows, so none is missed.
const walk = (dir) => readdirSync(join(root, dir)).flatMap((name) => { const path = `${dir}/${name}`; return statSync(join(root, path)).isDirectory() ? (name === "node_modules" || name.startsWith(".") ? [] : walk(path)) : [path]; });
for (const file of [...walk("app"), ...walk("components")].filter((f) => f.endsWith(".css") && !f.endsWith(".module.css") && !SKIP.includes(f)).sort()) if (!SOURCES.includes(file)) SOURCES.push(file);

// ---- colours ---------------------------------------------------------------------------------
const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };
const COLOR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;

function parseColor(text) {
  if (text.startsWith("#")) {
    let hex = text.slice(1);
    if (hex.length <= 4) hex = [...hex].map((c) => c + c).join("");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return { r, g, b, a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1 };
  }
  if (NAMED[text]) { const [r, g, b] = NAMED[text]; return { r, g, b, a: 1 }; }
  const parts = text.replace(/rgba?\(|\)/g, "").split(/[\s,/]+/).filter(Boolean);
  const [r, g, b] = parts.slice(0, 3).map((p) => p.endsWith("%") ? parseFloat(p) * 2.55 : parseFloat(p));
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  return { r, g, b, a };
}
function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}
function fromHsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return [f(0), f(8), f(4)];
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const print = ([r, g, b], a) => a >= 1 ? `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}` : `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;

// The app's dark palette is a cool purple-grey (#151217, #211e24); creams, greys and near-whites
// take that hue so the page never turns brown.
const NEUTRAL_HUE = 285;

/** The dark version of one colour, given what it's for. */
export function darkColor(text, role) {
  const c = parseColor(text.toLowerCase());
  let { h, s, l } = toHsl(c);
  const chroma = (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255;
  if (chroma < .1) { h = NEUTRAL_HUE; s = .1; }
  if (role === "shadow") return c.r + c.g + c.b < 120 ? print([0, 0, 0], Math.min(1, c.a * 1.6)) : print(fromHsl(h, s * .6, .12), c.a * .8);
  if (role === "text") {
    if (l >= .55) return print([c.r, c.g, c.b], c.a);                       // already light (white on a button)
    return print(fromHsl(h, Math.min(s, .7), clamp(.94 - l * .45, .62, .94)), c.a);
  }
  if (role === "line") {
    if (l < .5) return print(fromHsl(h, s * .6, clamp(.3 + l * .2, .25, .45)), c.a);
    return print(fromHsl(h, Math.min(s, .25), clamp(.18 + (1 - l) * .9, .2, .34)), c.a);
  }
  // surface
  if (l < .22 && c.a < 1) return print([8, 6, 10], Math.min(1, c.a * 1.4)); // a see-through dark overlay (backdrop, scrim): stays dark
  if (l < .22 && s < .3) return print([0x68, 0x40, 0xad], c.a);              // near-black fill (a button): brand purple
  if (l <= .62 && s >= .3) return print([c.r, c.g, c.b], c.a);               // a brand colour fill: keep
  if (l <= .5) return print(fromHsl(h, s * .7, clamp(l * .9, .16, .3)), c.a);
  return print(fromHsl(h, Math.min(s, .22), clamp(.075 + (1 - l) * 1.1, .075, .24)), c.a);
}

// ---- properties ------------------------------------------------------------------------------
const TEXT = /^(color|fill|stroke|caret-color|text-decoration-color|-webkit-text-fill-color|accent-color|text-emphasis-color)$/;
const LINE = /^(border|border-(top|right|bottom|left|block|inline)(-(start|end))?(-color)?|border-color|outline|outline-color|column-rule(-color)?)$/;
const SURFACE = /^(background|background-color|background-image)$/;
const SHADOW = /^(box-shadow|text-shadow|filter|-webkit-box-shadow)$/;
function roleFor(prop) {
  if (TEXT.test(prop)) return "text";
  if (LINE.test(prop)) return "line";
  if (SURFACE.test(prop)) return "surface";
  if (SHADOW.test(prop)) return "shadow";
  if (prop.startsWith("--")) {
    if (/line|border|stroke/.test(prop)) return "line";
    if (/ink|text|muted|subtle|fg|color-text|purple|brand|accent/.test(prop)) return "text";
    if (/shadow/.test(prop)) return "shadow";
    return "surface";
  }
  return null;
}

// ---- css -------------------------------------------------------------------------------------
function blocks(css) {
  // Splits a stylesheet into top-level { prelude, body } blocks (comments removed).
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let depth = 0, start = 0, prelude = "", quote = null;
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (quote) { if (ch === quote && css[i - 1] !== "\\") quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{") { if (depth === 0) { prelude = css.slice(start, i).trim(); start = i + 1; } depth += 1; }
    else if (ch === "}") { depth -= 1; if (depth === 0) { out.push({ prelude, body: css.slice(start, i) }); start = i + 1; } }
    else if (ch === ";" && depth === 0) start = i + 1; // @import / @charset
  }
  return out;
}
function declarations(body) {
  const out = []; let depth = 0, start = 0, quote = null;
  for (let i = 0; i <= body.length; i += 1) {
    const ch = body[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "(") depth += 1; else if (ch === ")") depth -= 1;
    else if ((ch === ";" || i === body.length) && depth === 0) { const text = body.slice(start, i).trim(); if (text) out.push(text); start = i + 1; }
  }
  return out.map((text) => { const at = text.indexOf(":"); return { prop: text.slice(0, at).trim().toLowerCase(), value: text.slice(at + 1).trim() }; }).filter((d) => d.prop && d.value);
}
function scope(selectorList) {
  return selectorList.split(/,(?![^(]*\))/).map((sel) => {
    sel = sel.trim();
    if (/^html\b/.test(sel)) return sel.replace(/^html/, 'html[data-theme="dark"]');
    if (/^:root\b/.test(sel)) return sel.replace(/^:root/, ':root[data-theme="dark"]');
    return `:root[data-theme="dark"] ${sel}`;
  }).join(",\n");
}
function convertRule(selector, body) {
  const decls = declarations(body);
  const background = decls.find((d) => /^background(-color)?$/.test(d.prop));
  const fillsColour = background && [...background.value.matchAll(COLOR)].some(([m]) => { const { s, l } = toHsl(parseColor(m.toLowerCase())); return l <= .62 && (s >= .3 || l < .22); });
  const out = [];
  for (const { prop, value } of decls) {
    const role = roleFor(prop);
    if (!role || !COLOR.test(value)) { COLOR.lastIndex = 0; continue; }
    COLOR.lastIndex = 0;
    // White (or light) text on a coloured fill stays light; everything else follows its role.
    const mapped = value.replace(COLOR, (m) => (role === "text" && fillsColour) ? m : darkColor(m, role));
    if (mapped !== value) out.push(`  ${prop}: ${mapped};`);
  }
  return out.length ? `${scope(selector)} {\n${out.join("\n")}\n}` : "";
}
function convert(css) {
  const out = [];
  for (const { prelude, body } of blocks(css)) {
    if (/^@(media|supports|layer|container)\b/.test(prelude)) { const inner = convert(body); if (inner) out.push(`${prelude} {\n${inner}\n}`); }
    else if (prelude.startsWith("@")) continue; // keyframes, font-face, page
    else { const rule = convertRule(prelude, body); if (rule) out.push(rule); }
  }
  return out.join("\n");
}

export function build() {
  const header = `/* GENERATED by scripts/build-dark-theme.mjs from the site's stylesheets. Do not edit by hand:
   change the source stylesheet (or the mapping in the script) and run npm run theme:dark. */
html[data-theme="dark"] { color-scheme: dark; --toggle-off: #4a4152; --toggle-on: #8f5fed; }
html[data-theme="dark"], html[data-theme="dark"] body { background: #151217; color: #f4f0f5; }
`;
  return header + SOURCES.map((file) => { const css = convert(readFileSync(join(root, file), "utf8")); return css ? `\n/* ${file} */\n${css}\n` : ""; }).join("");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const css = build();
  if (process.argv.includes("--check")) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
    if (current !== css) { console.error("app/theme-dark.css is out of date: run npm run theme:dark"); process.exit(1); }
    console.log("app/theme-dark.css is up to date");
  } else {
    writeFileSync(OUTPUT, css);
    console.log(`wrote app/theme-dark.css (${css.split("\n").length} lines from ${SOURCES.length} stylesheets)`);
  }
}
