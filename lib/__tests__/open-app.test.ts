import assert from "node:assert/strict";
import test from "node:test";
import { appLinkFor, appPlatform } from "../open-app";

test("profiles, events and Hubs opened from a link have an app screen", () => {
  assert.equal(appLinkFor("/u/ada.lovelace")?.appPath, "u/ada.lovelace");
  assert.match(appLinkFor("/u/ada.lovelace")!.title, /@ada\.lovelace/);
  assert.equal(appLinkFor("/events/evt_123")?.appPath, "events/evt_123");
  assert.equal(appLinkFor("/hubs/invite/hub-9")?.appPath, "hubs/invite/hub-9");
  // The web Hub page opens the app's invite screen, like its own Open in Tivorah button.
  assert.equal(appLinkFor("/hubs/hub-9")?.appPath, "hubs/invite/hub-9");
});

test("other pages, lists and odd paths aren't offered in the app", () => {
  for (const path of ["/", "/events", "/hubs", "/hubs/invite", "/u", "/u/ada/extra", "/account", "/events/a%2Fb", "/u/<script>"]) assert.equal(appLinkFor(path), null, path);
});

test("tells phones from computers", () => {
  assert.equal(appPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Instagram 400", 5), "ios");
  assert.equal(appPlatform("Mozilla/5.0 (Linux; Android 16; Pixel 9)", 5), "android");
  assert.equal(appPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 5), "ios");
  assert.equal(appPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 0), "desktop");
});
