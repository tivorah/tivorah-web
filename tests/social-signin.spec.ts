import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: null }));
  await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { data: { features: {} } } }));
});
for (const provider of ["Google", "Apple"]) {
  test(`${provider} uses Better Auth with a safe callback and recovers from failure`, async ({ page }) => {
    await page.route("**/api/v1/public/auth/providers", route => route.fulfill({ json: { data: { google: { enabled: true }, apple: { enabled: true } } } }));
    let requestBody: Record<string, string> = {};
    await page.route("**/api/auth/sign-in/social", route => {
      requestBody = route.request().postDataJSON();
      return route.fulfill({ status: 400, json: { message: "provider failed", code: "TEST_FAILURE" } });
    });
    await page.goto("/auth/signin?returnTo=https://untrusted.example");
    await page.getByRole("button", { name: `Continue with ${provider}` }).click();
    await expect(page.getByText("Could not start sign-in.", { exact: false })).toBeVisible();
    expect(requestBody.provider).toBe(provider.toLowerCase());
    const callback = new URL(requestBody.callbackURL);
    expect(callback.origin).toBe("http://localhost:7456");
    expect(callback.pathname).toBe("/auth/complete");
    expect(callback.searchParams.get("returnTo")).toBe("/account");
    await expect(page.getByRole("button", { name: `Continue with ${provider}` })).toBeEnabled();
  });
}
test("missing provider configuration hides OAuth without affecting email sign-in", async ({ page }) => {
  await page.route("**/api/v1/public/auth/providers", route => route.fulfill({ json: { data: { google: { enabled: false }, apple: { enabled: false } } } }));
  await page.goto("/auth/signin");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toHaveCount(0);
  await expect(page.locator(".auth-divider")).toHaveCount(0);
});
test("only configured providers are offered", async ({ page }) => {
  await page.route("**/api/v1/public/auth/providers", route => route.fulfill({ json: { data: { google: { enabled: true }, apple: { enabled: false } } } }));
  await page.goto("/auth/signin");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toHaveCount(0);
});
test("social callback requires server-confirmed age eligibility", async ({ page }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "test", userId: "1", token: "test-only", expiresAt: "2030-01-01" }, user: { id: "1", adultConfirmed: false } } }));
  let submitted = false;
  await page.route("**/api/v1/user/confirm-age", route => {
    submitted = true;
    return route.fulfill({ status: 400, json: { message: "You must be at least 18 years old to use Tivorah" } });
  });
  await page.goto("/auth/complete?returnTo=/account");
  // The calendar only offers adult dates, so pick one; the server still has the final say and
  // its refusal (mocked above) must be shown.
  await page.getByRole("button", { name: /^Date of birth/ }).click();
  await page.getByRole("dialog", { name: "Date of birth" }).locator(".rdp-day_button:not([disabled])").first().click();
  await expect(page.getByRole("button", { name: /^Date of birth: (?!not chosen)/ })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("You must be at least 18 years old to use Tivorah")).toBeVisible();
  expect(submitted).toBe(true);
  await expect(page).toHaveURL(/\/auth\/complete/);
});
