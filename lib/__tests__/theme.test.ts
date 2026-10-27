import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { resolveTheme, SAVED_THEME_KEY, THEME_KEY, themeBootScript } from "../theme";

/** Runs the real pre-paint script against a fake page and returns the theme it shows. */
function boot({ search = "", tab, saved }: { search?: string; tab?: string; saved?: string }) {
  const session = new Map<string, string>(tab ? [[THEME_KEY, tab]] : []);
  const local = new Map<string, string>(saved ? [[SAVED_THEME_KEY, saved]] : []);
  const attributes = new Map<string, string>();
  const bar = { content: "", setAttribute: (_name: string, value: string) => { bar.content = value; } };
  const storage = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } });
  runInNewContext(themeBootScript, {
    URLSearchParams,
    location: { search },
    sessionStorage: storage(session),
    localStorage: storage(local),
    document: {
      documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) },
      querySelectorAll: () => [bar],
      addEventListener: () => undefined,
    },
  });
  return { theme: attributes.get("data-theme"), tab: session.get(THEME_KEY), bar: bar.content };
}

test("the site is light unless someone chooses otherwise (not the phone's setting)", () => {
  assert.equal(resolveTheme({}), "light");
  assert.deepEqual(boot({}), { theme: "light", tab: undefined, bar: "#fbf9f5" });
});

test("opened from the app, the page matches the app's theme for that tab", () => {
  assert.equal(resolveTheme({ query: "dark", saved: "light" }), "dark");
  assert.deepEqual(boot({ search: "?theme=dark", saved: "light" }), { theme: "dark", tab: "dark", bar: "#151217" });
  // Later pages in the same tab no longer carry ?theme= but keep the app's theme.
  assert.equal(boot({ tab: "dark", saved: "light" }).theme, "dark");
  assert.equal(boot({ search: "?theme=light", saved: "dark" }).theme, "light");
});

test("otherwise the dashboard toggle's choice is used", () => {
  assert.equal(resolveTheme({ saved: "dark" }), "dark");
  assert.equal(boot({ saved: "dark" }).theme, "dark");
});

test("unknown values are ignored", () => {
  assert.equal(resolveTheme({ query: "purple", tab: "x", saved: "system" }), "light");
  assert.equal(boot({ search: "?theme=purple", saved: "system" }).theme, "light");
});
