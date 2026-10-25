import { expect, test, type Page } from "@playwright/test";

async function openCreateHub(page: Page) {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
  await page.route("**/api/v1/utility/interests**", route => route.fulfill({ json: { data: { interests: ["Football", "Cooking", "Igbo culture", "Music", "Running", "Startups", "Faith", "Parenting"].map((name, index) => ({ id: index + 1, name })) } } }));
  await page.route("**/api/v1/community/rules/catalogue**", route => route.fulfill({ json: { data: { baseRules: [{ key: "respect", text: "Be respectful" }], presets: [{ key: "no-spam", text: "No spam or selling" }] } } }));
  await page.goto("/business/hubs/new");
  await expect(page.getByRole("heading", { level: 1, name: "Create a Hub" })).toBeVisible();
}

test("interests are chosen in a sheet, up to six, and shown on the form", async ({ page }) => {
  await openCreateHub(page);
  await page.getByRole("button", { name: "Choose interests" }).click();
  const sheet = page.getByRole("dialog", { name: "Interests" });
  await expect(sheet).toBeVisible();
  for (const name of ["Football", "Cooking", "Igbo culture", "Music", "Running", "Startups"]) await sheet.getByRole("button", { name }).click();
  await expect(sheet.getByText("You’ve picked six.")).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Faith" })).toBeDisabled();
  await sheet.getByRole("button", { name: "Done · 6 of 6" }).click();
  const picked = page.getByRole("list", { name: "Chosen interests" });
  await expect(picked.getByRole("button")).toHaveCount(6);
  await picked.getByRole("button", { name: "Remove Cooking" }).click();
  await expect(picked.getByRole("button")).toHaveCount(5);
  await expect(page.locator(".hub-interests-count")).toHaveText("5 of 6");
});

test("who can join is two readable cards, and phones get a Create Hub bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCreateHub(page);
  const privateCard = page.getByRole("radio", { name: /Private/ });
  await privateCard.check();
  await expect(privateCard).toBeChecked();
  const radio = await privateCard.boundingBox();
  expect(radio!.width).toBeLessThanOrEqual(24);
  await expect(page.locator(".create-mobile-bar").getByRole("button", { name: "Create Hub" })).toBeVisible();
});
