import { expect, test } from "@playwright/test";

// Optional usage analytics asks first: nothing goes to PostHog until the visitor chooses Allow,
// both answers look the same, the choice is remembered, and Settings / the Cookie Notice match it.
test.use({ storageState: { cookies: [], origins: [] } });

test("nothing is sent to PostHog until the visitor allows it", async ({ page }) => {
  const sent: string[] = [];
  await page.route("**/*posthog.com/**", (route) => { sent.push(route.request().url()); return route.fulfill({ status: 200, body: "" }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/events");
  const banner = page.getByRole("region", { name: "Usage analytics choice" });
  await expect(banner).toBeVisible();
  await page.waitForTimeout(1500);
  expect(sent).toEqual([]);
  // Same size and look for both answers.
  const [no, yes] = [banner.getByRole("button", { name: "No thanks" }), banner.getByRole("button", { name: "Allow" })];
  const [noBox, yesBox] = [await no.boundingBox(), await yes.boundingBox()];
  expect(Math.round(noBox!.width)).toBe(Math.round(yesBox!.width));
  await no.click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("region", { name: "Usage analytics choice" })).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(sent).toEqual([]);
  // The Cookie Notice switch shows the answer and can change it.
  await page.goto("/cookies");
  const toggle = page.getByRole("switch", { name: /Usage analytics/ });
  await expect(toggle).not.toBeChecked();
  await page.locator("label.shop-switch", { hasText: "Usage analytics" }).click();
  await expect(toggle).toBeChecked();
  await expect.poll(() => sent.length, { timeout: 5000 }).toBeGreaterThan(0);
});

test("a browser that asks not to be tracked is never asked and never tracked", async ({ page }) => {
  const sent: string[] = [];
  await page.route("**/*posthog.com/**", (route) => { sent.push(route.request().url()); return route.fulfill({ status: 200, body: "" }); });
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));
  await page.goto("/events");
  await page.waitForTimeout(1500);
  await expect(page.getByRole("region", { name: "Usage analytics choice" })).toHaveCount(0);
  expect(sent).toEqual([]);
});
