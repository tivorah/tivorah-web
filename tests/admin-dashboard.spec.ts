import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const dashboard = {
  compliance: { actionNeeded: 2 },
  totals: {
    users: 1284,
    activeUsers: 1252,
    suspendedUsers: 4,
    communities: 86,
    events: 143,
    itemsForSale: 218,
    serviceListings: 97,
    serviceProviders: 61,
    organizers: 72,
    orders: 309,
    waitlist: 46,
  },
  involvement: [],
  health: { api: "operational", database: "operational" },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session", route => route.fulfill({
    json: {
      session: { id: "staff-session", userId: 1, expiresAt: "2030-01-01T00:00:00.000Z" },
      user: { id: 1, email: "staff@tivorah.test", role: "admin" },
    },
  }));
  await page.route("**/api/v1/user/identity", route => route.fulfill({
    json: { data: { user: { id: 1, role: "admin", twoFactorEnabled: true } } },
  }));
  await page.route("**/api/v1/admin/dashboard", route => route.fulfill({ json: { data: dashboard } }));
  await page.route("**/api/v1/admin/reports**", route => route.fulfill({ json: { data: [{ id: 1, status: "open" }, { id: 2, status: "reviewing" }] } }));
  await page.route("**/api/v1/admin/push-deliveries", route => route.fulfill({ json: { data: [{ id: 1, status: "failed", attemptedAt: "2026-10-28T01:00:00Z" }] } }));
});

async function expectDashboardFits(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tivorah summary" }).getByText("1,284")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open reports/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("admin dashboard is focused, responsive and usable in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await expectDashboardFits(page);
  await expect(page.getByLabel("Admin section")).toBeVisible();
  await page.screenshot({ path: "/tmp/tivorah-admin-dashboard-phone.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expectDashboardFits(page);
  await expect(page.getByRole("complementary", { name: "Admin navigation" })).toBeVisible();
  const shell = await page.locator(".admin-portal.page-shell").boundingBox();
  expect(Math.round(shell?.x ?? -1)).toBe(40);
  expect(Math.round(shell?.width ?? -1)).toBe(1360);
  await page.screenshot({ path: "/tmp/tivorah-admin-dashboard-desktop.png", fullPage: true });

  await page.goto("/admin?theme=dark");
  await expectDashboardFits(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical"), JSON.stringify(accessibility.violations, null, 1)).toEqual([]);
  await page.screenshot({ path: "/tmp/tivorah-admin-dashboard-dark.png", fullPage: true });

  // A 720 CSS-pixel viewport is the 1440px desktop layout at 200% browser zoom.
  await page.setViewportSize({ width: 720, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
});

test("admin loading state keeps the dashboard card structure", async ({ page }) => {
  await page.unroute("**/api/v1/admin/dashboard");
  await page.route("**/api/v1/admin/dashboard", async route => {
    await new Promise(resolve => setTimeout(resolve, 800));
    await route.fulfill({ json: { data: dashboard } });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");

  const loading = page.getByRole("region", { name: "Loading dashboard summary" });
  await expect(loading).toBeVisible();
  await expect(loading.locator(".metric-skeleton")).toHaveCount(4);
  await expect(loading.locator(".tivorah-shimmer")).toHaveCount(8);
  await page.screenshot({ path: "/tmp/tivorah-admin-dashboard-loading.png", fullPage: true });
  await expect(page.getByRole("region", { name: "Tivorah summary" })).toBeVisible();
});
