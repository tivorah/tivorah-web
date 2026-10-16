import { expect, test } from "@playwright/test";

// During a sign-in attack the API asks unknown devices for a Turnstile check; the form shows it,
// then signs in again with the token without the person retyping anything.
test("sign-in passes the security check and retries with the token", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).turnstile = { render: (_el: HTMLElement, options: any) => { setTimeout(() => options.callback("turnstile-test-token"), 50); return "widget-1"; }, remove: () => undefined };
  });
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: null }));
  const tokens: (string | undefined)[] = [];
  await page.route("**/api/auth/sign-in/email", (route) => {
    const token = route.request().headers()["x-turnstile-token"];
    tokens.push(token);
    if (!token) return route.fulfill({ status: 403, json: { code: "CAPTCHA_REQUIRED", message: "Please confirm you’re human to sign in.", siteKey: "1x00000000000000000000AA" } });
    return route.fulfill({ json: { redirect: false, token: "session", user: { id: "1", email: "ada@example.test" } } });
  });
  await page.route("**/account**", (route) => route.fulfill({ body: "<h1>Your account</h1>", contentType: "text/html" }));

  await page.goto("/auth/signin");
  await page.getByLabel("Email or username").fill("ada@example.test");
  await page.locator("#auth-password").fill("CorrectHorse!42");
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens).toEqual([undefined, "turnstile-test-token"]);
});
