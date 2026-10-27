import { expect, test, type Page } from "@playwright/test";

// Your account and the business workspace use a side nav with icons (wider screens) and put the
// same links at the top of the header menu on phones. The web has no bottom bar.
const shots = process.env.TIVORAH_SHOTS_DIR;

async function signIn(page: Page) {
  await page.route("**/api/v1/**", route => route.fulfill({ json: { data: {} } }));
  const on = { enabled: true, presentation: "hidden", message: null, config: {}, version: 1 };
  await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { status: true, data: { environment: "test", platform: "web", features: Object.fromEntries(["events", "communities", "chat", "marketplace", "services", "service_bookings"].map(key => [key, on])) } } }));
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
}

for (const theme of ["light", "dark"] as const) {
  test(`Your account has a side nav on wider screens (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1440, height: 960 });
    await signIn(page);
    await page.goto("/account");
    const nav = page.getByRole("navigation", { name: "Your account" });
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Appointments" })).toHaveAttribute("href", "/account/bookings");
    await expect(nav.getByRole("link", { name: "Your orders" })).toHaveAttribute("href", "/account/item-orders");
    await expect(nav.locator("svg.bar-icon")).not.toHaveCount(0);
    await expect(page.locator(".app-bottom-bar")).toHaveCount(0);
    if (shots) await page.screenshot({ path: `${shots}/account-side-nav-${theme}.png` });
    await nav.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/account\/settings$/);
    await expect(nav.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  });

  test(`on phones the account links sit at the top of the header menu (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto("/account");
    await expect(page.locator(".app-bottom-bar")).toHaveCount(0);
    await expect(page.locator(".section-sidebar")).toBeHidden();
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const menu = page.getByRole("navigation", { name: "Your account" });
    await expect(menu.getByRole("link", { name: "Messages" })).toBeVisible();
    await page.waitForTimeout(350);
    if (shots) await page.screenshot({ path: `${shots}/account-menu-phone-${theme}.png` });
    await menu.getByRole("link", { name: "Tickets" }).click();
    await expect(page).toHaveURL(/\/account\/tickets$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}
