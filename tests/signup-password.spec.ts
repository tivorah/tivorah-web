import { expect, test } from "@playwright/test";

// Someone reported that a strong password was refused at sign-up: the meter said "Strong" for a
// password that missed a requirement (e.g. a browser-generated one without a symbol), and the form
// only showed a browser bubble. The meter now agrees with the rules and the form says what to add.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: null }));
  await page.route("**/api/v1/public/auth/username-availability**", (route) => route.fulfill({ json: { data: { available: true, username: "ada.lovelace", suggestions: [] } } }));
});

async function fillDetails(page: import("@playwright/test").Page, password: string) {
  await page.goto("/auth/signup");
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Last name").fill("Lovelace");
  await page.getByLabel("Email").fill("ada@example.test");
  await page.locator("#auth-password").fill(password);
  // The picker opens about 25 years back; any day there is old enough.
  await page.getByRole("button", { name: /Date of birth/ }).click();
  await page.locator(".rdp-day_button").filter({ hasText: /^15$/ }).first().click();
}

test("a password missing a requirement is never shown as Strong, and the form says what to add", async ({ page }) => {
  let signUps = 0;
  await page.route("**/api/auth/sign-up/email", (route) => { signUps += 1; return route.fulfill({ json: { token: null, user: { id: "1" } } }); });
  await fillDetails(page, "Kt8mPq2vXzR4nWbLx9");
  await expect(page.locator(".password-meter-label")).not.toHaveText(/Good|Strong/);
  await expect(page.locator(".password-hint")).toContainText("Add a symbol");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/Your password needs a little more: add a symbol/)).toBeVisible();
  expect(signUps).toBe(0);
});

test("a password that meets every requirement goes through", async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/auth/sign-up/email", (route) => { body = route.request().postDataJSON(); return route.fulfill({ json: { token: null, user: { id: "1" } } }); });
  await fillDetails(page, "Kt8mPq2v-XzR4nWb");
  await expect(page.locator(".password-hint")).toContainText("Meets all requirements");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: /create account/i }).click();
  await expect.poll(() => body?.password).toBe("Kt8mPq2v-XzR4nWb");
});
