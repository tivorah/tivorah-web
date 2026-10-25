import { expect, test } from "@playwright/test";

// Signing in from the app (components/auth/session-handoff.tsx). The API is mocked; the destination
// page is stubbed so only the handoff itself is tested.
const destination = "/business/shop";
async function stubDestination(page: import("@playwright/test").Page) {
  await page.route(`**${destination}`, (route) => route.request().resourceType() === "document" ? route.fulfill({ contentType: "text/html", body: "<h1>Your shop</h1>" }) : route.continue());
}

test("a fresh token signs in and opens the page", async ({ page }) => {
  await stubDestination(page);
  let verified = 0;
  await page.route("**/api/auth/one-time-token/verify", (route) => { verified += 1; return route.fulfill({ json: { session: { id: "s" }, user: { id: "42" } } }); });
  await page.goto(`/auth/handoff?token=abc&returnTo=${encodeURIComponent(destination)}&fromApp=1&account=42`);
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  expect(verified).toBe(1);
});

test("a used token still opens the page when this browser is signed in to the same account", async ({ page }) => {
  await stubDestination(page);
  await page.route("**/api/auth/one-time-token/verify", (route) => route.fulfill({ status: 400, json: { message: "Invalid token" } }));
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: { session: { id: "s" }, user: { id: "42" } } }));
  await page.goto(`/auth/handoff?token=used&returnTo=${encodeURIComponent(destination)}&fromApp=1&account=42`);
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
});

test("a reloaded page (no token) never carries on as another account", async ({ page }) => {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: { session: { id: "s" }, user: { id: "7" } } }));
  await page.route("**/api/auth/one-time-token/verify", (route) => route.fulfill({ status: 400, json: { message: "Invalid token" } }));
  await page.goto(`/auth/handoff?token=used&returnTo=${encodeURIComponent(destination)}&fromApp=1&account=42`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Let’s try that again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the app" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", `/auth/signin?returnTo=${encodeURIComponent(destination)}`);
});
