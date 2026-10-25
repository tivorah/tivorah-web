import { expect, test, type Page } from "@playwright/test";

// A tiny PNG so thumbnails render without the network.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const content = (gallery: number[]) => ({
  name: "Taylor’s Studio", slug: "tivorahdemo", about: "Handmade ceramics and pottery classes in Adelaide.", story: "", locality: "", hours: "", serviceArea: "",
  fulfilment: "", bookingPolicy: "", logoId: null, coverId: null, gallery: gallery.map((assetId) => ({ assetId, alt: "" })), videoId: null, videoTranscript: "", videoCaptions: "",
});
const assets = [11, 12, 13].map((id) => ({ id, kind: "image", status: "approved", url: `https://images.unsplash.com/photo-${id}.png`, mimeType: "image/png" }));

async function openEditor(page: Page) {
  await page.route("https://images.unsplash.com/**", (route) => route.fulfill({ body: png, contentType: "image/png" }));
  await page.route("**/_next/image**", (route) => route.fulfill({ body: png, contentType: "image/png" }));
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", (route) => route.fulfill({ json: { data: { id: 1, username: "tivorahdemo", firstName: "Taylor" } } }));
  await page.route("**/api/v1/web/business/shop", (route) => route.request().method() === "GET"
    ? route.fulfill({ json: { data: { shop: { draft: content([11, 12, 13]), published: content([11, 12, 13]), version: 3, slug: "tivorahdemo" }, assets, eligibility: { items: 2, services: 1, eligible: true } } } })
    : route.fulfill({ json: { data: { shop: { draft: JSON.parse(route.request().postData() ?? "{}").content, published: content([11, 12, 13]), version: 4, slug: "tivorahdemo" } } } }));
  await page.goto("/business/shop");
  await expect(page.getByRole("heading", { name: "Your shop" })).toBeVisible();
}
const order = (page: Page) => page.locator(".shop-media-row strong").evaluateAll((rows) => rows.map((row) => row.firstChild?.textContent));
const altInputs = (page: Page) => page.locator(".shop-media-row input").evaluateAll((inputs) => inputs.map((input) => input.getAttribute("aria-label")));

test("gallery rows reorder by dragging the handle", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openEditor(page);
  const handles = page.locator(".shop-media-row .shop-sort-handle");
  await expect(handles).toHaveCount(3);
  await page.locator(".shop-media-list").scrollIntoViewIfNeeded();
  const first = await handles.nth(0).boundingBox();
  const third = await handles.nth(2).boundingBox();
  await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2 + ((third!.y - first!.y + 20) * step) / 12);
  await page.mouse.up();
  // Photo descriptions follow the rows: the photo that was first is now last.
  expect(await altInputs(page)).toEqual(["Describe photo 1 for screen readers", "Describe photo 2 for screen readers", "Describe photo 3 for screen readers"]);
  const ids = await page.locator(".shop-media-row img").evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
  expect(ids.map((src) => decodeURIComponent(src).match(/(\d+)\.png/)?.[1])).toEqual(["12", "13", "11"]);
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/editor-phone.png` : "/tmp/editor-phone.png", fullPage: true });
});

test("arrow keys on the handle move a row", async ({ page }) => {
  await openEditor(page);
  await page.locator(".shop-media-row .shop-sort-handle").nth(0).focus();
  await page.keyboard.press("ArrowDown");
  const ids = await page.locator(".shop-media-row img").evaluateAll((images) => images.map((image) => decodeURIComponent((image as HTMLImageElement).src).match(/(\d+)\.png/)?.[1]));
  expect(ids).toEqual(["12", "11", "13"]);
  await expect(page.locator(".shop-media-row .shop-sort-handle").nth(1)).toBeFocused();
});

test("gallery rows reorder with a finger on a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await openEditor(page);
  await page.locator(".shop-media-list").scrollIntoViewIfNeeded();
  const handles = page.locator(".shop-media-row .shop-sort-handle");
  const first = (await handles.nth(0).boundingBox())!;
  const third = (await handles.nth(2).boundingBox())!;
  const x = first.x + first.width / 2;
  const y = first.y + first.height / 2;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 12; step += 1) await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + ((third.y - first.y + 20) * step) / 12 }] });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const ids = await page.locator(".shop-media-row img").evaluateAll((images) => images.map((image) => decodeURIComponent((image as HTMLImageElement).src).match(/(\d+)\.png/)?.[1]));
  expect(ids).toEqual(["12", "13", "11"]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/editor-top.png` : "/tmp/editor-top.png" });
  await page.locator(".shop-media-list").scrollIntoViewIfNeeded();
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/editor-gallery.png` : "/tmp/editor-gallery.png" });
  // Details is an open section now (no "More details" fold).
  await page.locator("#shop-details").scrollIntoViewIfNeeded();
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/editor-more.png` : "/tmp/editor-more.png" });
  await context.close();
});

test("the end of the editor is fully visible above the save bar and bottom bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openEditor(page);
  for (let i = 0; i < 6; i += 1) { await page.mouse.wheel(0, 1200); await page.waitForTimeout(120); }
  await page.waitForTimeout(400);
  // The bottom bar stays put on this page (it has a save bar), so nothing jumps at the end.
  expect(await page.evaluate(() => document.documentElement.dataset.bottomBar)).toBe("shown");
  const box = (selector: string) => page.locator(selector).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
  // The last section of the form (the shop card placements) ends above the save bar.
  const more = await box("#shop-placements");
  const save = await box(".shop-actions");
  const nav = await box(".app-bottom-bar");
  expect(more.bottom).toBeLessThanOrEqual(save.top + 1);
  expect(Math.abs(save.bottom - nav.top)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/editor-end.png` : "/tmp/editor-end.png" });
});
