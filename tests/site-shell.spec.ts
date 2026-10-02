import { expect, test } from "@playwright/test";
for (const signedIn of [false, true]) {
  test(`homepage footer and shared width with signedIn=${signedIn}`, async ({ page }) => {
    await page.route("**/api/auth/get-session**", route => route.fulfill({ json: signedIn ? { session: { id: "shell-session", userId: "1", expiresAt: "2030-01-01T00:00:00Z" }, user: { id: "1", name: "Member", email: "member@example.test" } } : null }));
    await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, firstName: "Member" } } }));
    await page.setViewportSize({ width: 1670, height: 950 });
    await page.goto("/");
    const homeHeader = await page.locator(".nav-inner").boundingBox();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/tivorah-home-footer-${signedIn}.png` });
    await page.goto("/marketplace-partner-agreement");
    const legalHeader = await page.locator(".nav-inner").boundingBox();
    const article = await page.locator("article.content").boundingBox();
    expect(legalHeader?.width).toBe(homeHeader?.width);
    expect(article?.width).toBe(1040);
    expect(article?.x).toBe((1670 - 1040) / 2);
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await page.screenshot({ path: "/tmp/tivorah-legal-width.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: "/tmp/tivorah-legal-phone.png" });
  });
}
