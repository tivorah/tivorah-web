import { expect, test } from "@playwright/test";

// A service's category decides what creating it asks: food asks for a menu and how customers get
// their order; other categories keep the default booking (one price).
const templates = {
  "Catering & baking": { menuLabel: "Menu", menuQuestion: "What’s on your menu?", menuHint: "Add dishes with a price.", itemPlaceholder: "e.g. Jollof rice tray", modeQuestion: "How do customers get their order?", modeLabels: { at_provider: "Pickup", mobile: "I deliver", flexible: "Pickup or delivery" }, addressLabel: "Delivery address" },
};

test("food services ask for a menu; other categories keep one price", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/auth/get-session**", (r) => r.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: "2031-01-01T00:00:00Z" }, user: { id: "1", name: "Ada", email: "ada@example.test", emailVerified: true } } }));
  await page.route("**/api/v1/web/account", (r) => r.fulfill({ json: { data: { id: 1, username: "ada", firstName: "Ada" } } }));
  await page.route("**/api/v1/user/participant-agreements", (r) => r.fulfill({ json: { data: { version: "1", agreements: [{ kind: "service_provider" }] } } }));
  await page.route("**/api/v1/market/service-templates", (r) => r.fulfill({ json: { data: { templates } } }));
  await page.goto("/business/create?type=service");

  const category = page.getByRole("combobox", { name: /Category/ }).first();
  await category.click();
  await page.getByRole("option", { name: "Catering & baking", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What’s on your menu?" })).toBeVisible();
  await expect(page.getByText("How do customers get their order?")).toBeVisible();
  await expect(page.getByRole("radio", { name: "I deliver" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "At my place" })).toHaveCount(0);

  await page.getByRole("button", { name: "+ Add an item" }).click();
  await page.getByLabel("Item 1 name").fill("Jollof rice tray");
  await page.getByLabel("Item 1 price").fill("45");
  // With menu items, the single price field goes away: the items carry the prices.
  await expect(page.locator('input[name="price"][type="number"]')).toHaveCount(0);
  await page.locator(".menu-editor").screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/menu-editor.png` : "/tmp/menu-editor.png" });

  await category.click();
  await page.getByRole("option", { name: "Cleaning", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What’s on your menu?" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "At my place" })).toBeVisible();
  await expect(page.locator('input[name="price"][type="number"]')).toHaveCount(1);
});

test("the service category picker covers trades, care, tech and food, with search", async ({ page }) => {
  await page.route("**/api/auth/get-session**", (r) => r.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: "2031-01-01T00:00:00Z" }, user: { id: "1", name: "Ada", email: "ada@example.test", emailVerified: true } } }));
  await page.route("**/api/v1/web/account", (r) => r.fulfill({ json: { data: { id: 1, username: "ada", firstName: "Ada" } } }));
  await page.route("**/api/v1/user/participant-agreements", (r) => r.fulfill({ json: { data: { version: "1", agreements: [{ kind: "service_provider" }] } } }));
  await page.route("**/api/v1/market/service-templates", (r) => r.fulfill({ json: { data: { templates } } }));
  await page.goto("/business/create?type=service");
  await page.getByRole("combobox", { name: /Category/ }).first().click();
  for (const name of ["Plumbing", "Carpentry", "Support workers", "Web development", "IT support & networking", "Catering & baking"]) {
    await expect(page.getByRole("option", { name, exact: true })).toHaveCount(1);
  }
  await page.keyboard.type("plumb");
  await expect(page.getByRole("option", { name: "Plumbing", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Carpentry", exact: true })).toHaveCount(0);
});
