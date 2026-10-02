import { expect, test } from "@playwright/test";

test("creation invitation favours the current section and appears once per session", async ({ page }) => {
  await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { data: { features: Object.fromEntries(["events", "marketplace", "services", "communities"].map(key => [key, { enabled: true }])) } } }));
  await page.route("**/api/v1/public/discovery/**", route => route.fulfill({ json: { status: true, data: { items: [], nextSkip: null } } }));
  await page.goto("/shop");
  const dialog = page.getByRole("dialog", { name: "Bring your idea to Tivorah." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link").first()).toContainText("Sell an item");
  await expect(dialog.getByRole("link", { name: /Sell an item/ })).toHaveAttribute("href", "/business/create?type=item");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.goto("/events");
  await page.waitForTimeout(2200);
  await expect(page.getByRole("dialog", { name: "Bring your idea to Tivorah." })).not.toBeVisible();
  await page.getByRole("button", { name: "Create on Tivorah" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link").first()).toContainText("Create an event");
});

test("creation invitation does not interrupt someone using search", async ({ page }) => {
  await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { data: { features: Object.fromEntries(["events", "marketplace", "services", "communities"].map(key => [key, { enabled: true }])) } } }));
  await page.route("**/api/v1/public/discovery/**", route => route.fulfill({ json: { status: true, data: { items: [], nextSkip: null } } }));
  await page.goto("/services");
  await page.getByLabel("What are you looking for?").fill("cleaning");
  await page.waitForTimeout(2100);
  await expect(page.getByRole("dialog", { name: "Bring your idea to Tivorah." })).not.toBeVisible();
});
