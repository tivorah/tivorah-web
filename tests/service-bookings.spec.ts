import { expect, test } from "@playwright/test";
for (const width of [390, 768, 1440]) {
  test(`service booking recovery and provider details at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width === 768 ? "dark" : "light" });
    await page.route("**/api/v1/config/bootstrap**", r => r.fulfill({ json: { data: { features: { services: { enabled: true }, marketplace: { enabled: true }, service_bookings: { enabled: true } } } } }));
    await page.route("**/api/auth/get-session**", r => r.fulfill({ json: { session: { id: "session-test", userId: "1", expiresAt: "2030-01-01T00:00:00Z" }, user: { id: "1", name: "Member", email: "member@example.test", emailVerified: true } } }));
    await page.route("**/api/v1/web/account", r => r.fulfill({ json: { data: { id: 1, username: "member", firstName: "Member" } } }));
    const booking = { id: 23, product: { id: 17, title: "Personal training session", priceCents: 6500 }, startsAt: "2030-10-18T01:00:00Z", endsAt: "2030-10-18T02:00:00Z", timezone: "Australia/Adelaide", status: "pending_payment", currency: "GBP", totalCents: 6500, paymentAvailable: true, perspective: "customer", counterparty: { name: "Alex Trainer", username: "alex" }, customerNote: "First session; please bring a mat." };
    await page.route("**/api/v1/market/bookings/me", r => r.fulfill({ json: { data: { bookings: [booking, { ...booking, id: 24, perspective: "provider", status: "confirmed", counterparty: { name: "Jamie Customer", username: "jamie" } }] } } }));
    await page.route("**/api/v1/web/account/bookings/23/payment", r => r.fulfill({ status: 503, json: { message: "Try again" } }));
    await page.goto("/account/bookings");
    await page.getByRole("button", { name: /Personal training session/ }).first().click();
    await expect(page.getByRole("button", { name: "Continue payment" })).toBeVisible();
    await expect(page.getByText("Times shown in Australia/Adelaide")).toBeVisible();
    await expect(page.getByText(/65.00/)).toBeVisible();
    await expect(page.getByText(/First session/)).toBeVisible();
    await page.locator(".detail-sheet[open]").evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished))));
    await page.screenshot({ path: `/tmp/tivorah-service-customer-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Continue payment" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Please try again" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue payment" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 900) await page.getByRole("button", { name: "Close details" }).click();
    await page.goto("/account/bookings?role=provider");
    await expect(page.getByRole("button", { name: /Customer bookings/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Personal training session/ }).first().click();
    await expect(page.getByText("Jamie Customer", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue payment" })).toHaveCount(0);
    await page.locator(".detail-sheet[open]").evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished))));
    await page.screenshot({ path: `/tmp/tivorah-service-provider-${width}.png`, fullPage: true });
    if (width === 1440) {
      // A 200% browser zoom halves the CSS viewport while preserving physical pixels.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 720, height: 450, deviceScaleFactor: 2, mobile: false });
      await page.waitForFunction(() => window.matchMedia("(max-width: 900px)").matches);
      await expect.poll(async () => { const box = await page.locator(".account-booking-row").first().boundingBox(); return box ? box.x + box.width : 9999; }).toBeLessThanOrEqual(720);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(720);
      await page.screenshot({ path: "/tmp/tivorah-service-provider-zoom200.png", fullPage: true });
    }
  });
}
