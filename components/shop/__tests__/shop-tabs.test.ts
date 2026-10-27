import assert from "node:assert/strict";
import test from "node:test";
import { shopOpeningTab, shopTabKeys } from "../shop-tabs";
import type { ShopData } from "../shop-view";

const shop = (content: Partial<ShopData["content"]> = {}, extra: Partial<ShopData> = {}): ShopData => ({
  hasShop: true,
  content: { name: "Ada's Kitchen", slug: "adas-kitchen", about: "", story: "", locality: "", hours: "", serviceArea: "", fulfilment: "", bookingPolicy: "", logoId: null, coverId: null, gallery: [{ assetId: 1, alt: "Jollof" }], videoId: null, videoTranscript: "", videoCaptions: "", ...content },
  assets: [{ id: 1, kind: "image", status: "approved", url: "https://media.example/1.jpg" } as ShopData["assets"][number]],
  offerings: [], events: [], hubs: [], nextSkip: null,
  counts: { items: 9, services: 0, events: 0, hubs: 0 },
  ...extra,
});

const stocked = { counts: { items: 9, services: 3, events: 2, hubs: 0 } };
test("tabs follow the seller's order, without hidden or empty sections (as in the app)", () => {
  assert.deepEqual(shopTabKeys(shop({ sectionOrder: ["items", "gallery", "services", "events", "hubs"] }, stocked)), ["items", "gallery", "services", "events"]);
  assert.deepEqual(shopTabKeys(shop({ hiddenSections: ["gallery", "events"] }, stocked)), ["items", "services"]);
  assert.deepEqual(shopTabKeys(shop({ gallery: [] }, stocked)), ["items", "services", "events"]);
  assert.deepEqual(shopTabKeys(shop()), ["gallery", "items"]);
});

test("a section switched off in Admin → Features (sent empty by the API) loses its tab, whatever the seller named it", () => {
  const off = shop({ sectionTitles: { items: "Menu" } }, { counts: { items: 0, services: 3, events: 2, hubs: 0 } });
  assert.deepEqual(shopTabKeys(off), ["gallery", "services", "events"]);
  assert.equal(shopOpeningTab(shop({ openTab: "items" }, { counts: { items: 0, services: 0, events: 0, hubs: 0 } })), "all");
});

test("the shop opens on the seller's chosen tab", () => {
  assert.equal(shopOpeningTab(shop()), "all");
  assert.equal(shopOpeningTab(shop({ openTab: "overview" })), "all");
  assert.equal(shopOpeningTab(shop({ openTab: "items" })), "items");
  assert.equal(shopOpeningTab(shop({ openTab: "gallery" })), "gallery");
});

test("a hidden or empty choice opens on Overview instead", () => {
  assert.equal(shopOpeningTab(shop({ openTab: "items", hiddenSections: ["items"] })), "all");
  assert.equal(shopOpeningTab(shop({ openTab: "services" })), "all");
  assert.equal(shopOpeningTab(shop({ openTab: "gallery", gallery: [] })), "all");
  assert.equal(shopOpeningTab(shop({ openTab: "items" }, { hasShop: false })), "all");
});
