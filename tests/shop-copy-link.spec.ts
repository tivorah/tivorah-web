import { expect, test } from "@playwright/test";

// A public shop page has Copy link, which copies the shop's own address (not the tab or page).
// Uses the running local API's demo shop (tivorahdemo).
test("Copy link copies the shop's address", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only here");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/shops/tivorahdemo?tab=events");
  test.skip(response?.status() !== 200, "the demo shop isn't available from the local API");
  const copy = page.getByRole("button", { name: /^Copy link to / });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(page.getByRole("button", { name: /copied$/ })).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/shops\/tivorahdemo$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  if (process.env.TIVORAH_SHOTS_DIR) await page.locator(".shop-hero").screenshot({ path: `${process.env.TIVORAH_SHOTS_DIR}/shop-copy-phone.png` });
});
