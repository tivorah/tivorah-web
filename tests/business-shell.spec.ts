import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: {
    session: { id: "session", userId: "1", expiresAt: "2030-01-01T00:00:00.000Z" },
    user: { id: "1", email: "taylor@example.test", name: "Taylor" },
  } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: {
    id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null,
  } } }));
  await page.route("**/api/v1/user/participant-agreements", route => route.fulfill({ json: { data: {
    version: "1", agreements: [{ kind: "organizer" }, { kind: "service_provider" }],
  } } }));
  await page.route("**/api/v1/events/mine?**", route => route.fulfill({ json: { data: { events: [], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/market/products/mine?**", route => route.fulfill({ json: { data: { products: [], pagination: { isMoreData: false } } } }));
});

test("business workspace uses the Tivorah navigation rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/business");

  const rail = page.getByRole("complementary", { name: "Business workspace navigation" });
  await expect(rail.getByText("Business workspace")).toBeVisible();
  await expect(rail.getByRole("link", { name: "Listings" })).toHaveAttribute("aria-current", "page");
  await expect(rail.getByRole("link", { name: "Item orders" })).toHaveAttribute("href", "/business/orders");
  await expect(rail.getByRole("link", { name: "Appointments" })).toHaveAttribute("href", "/business/appointments");
  await expect(rail.getByRole("link", { name: "Your account" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical"), JSON.stringify(accessibility.violations, null, 1)).toEqual([]);
  await page.screenshot({ path: "/tmp/tivorah-business-workspace.png", fullPage: true });

  await page.goto("/business?theme=dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "/tmp/tivorah-business-workspace-dark.png", fullPage: true });
});
