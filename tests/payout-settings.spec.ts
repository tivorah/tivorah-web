import { expect, test } from "@playwright/test";

test("payout loading matches its layout and Stripe opens in a separate tab", async ({ page, context }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "session", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, firstName: "Taylor" } } }));
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/v1/payments/connect/account", async route => { await held; await route.fulfill({ json: { data: { connected: true, chargesEnabled: true, payoutsEnabled: true, currentPartnerAgreementVersion: "1.0", partnerAgreementVersion: "1.0" } } }); });
  await page.goto("/business/payouts");
  await expect(page.getByRole("status", { name: "Loading payout settings" })).toHaveCount(1);
  await expect(page.getByText("Loading your listings…")).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "Customer payments" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.screenshot({ path: "/tmp/tivorah-payouts-desktop.png" });
  await page.route("**/api/v1/payments/connect/dashboard", route => route.fulfill({ json: { data: { url: "https://dashboard.stripe.com/test" } } }));
  await context.route("https://dashboard.stripe.com/**", route => route.fulfill({ body: "Stripe test page" }));
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open Stripe dashboard" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://dashboard.stripe.com/test");
  await expect(page).toHaveURL(/\/business\/payouts$/);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/tivorah-payouts-phone.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
