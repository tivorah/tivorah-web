import assert from "node:assert/strict";
import test from "node:test";
import data from "../category-icons.json";
import { categoryVisual } from "../category-visuals";

test("uses the app's icon and colour for each kind of category", () => {
  assert.deepEqual(categoryVisual("events", "Music"), { path: data.paths["music-note"], light: "#7443A7", dark: "#C39BE9" });
  assert.equal(categoryVisual("hubs", "Animals & pets").path, data.paths.paw);
  assert.equal(categoryVisual("hubs", "Sunday football crew").path, data.paths.soccer); // keyword match, like the app
  assert.equal(categoryVisual("items", "Some new category").path, data.paths["tag-outline"]);
  assert.equal(categoryVisual("services", "Some new service").path, data.paths["briefcase-outline"]);
  assert.equal(categoryVisual("events", "").path, data.paths["shape-outline"]);
});

test("every icon the app uses has an SVG path", () => {
  for (const [name, path] of Object.entries(data.paths)) assert.ok(typeof path === "string" && path.startsWith("M"), name);
});
