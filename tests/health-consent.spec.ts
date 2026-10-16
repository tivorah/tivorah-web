import { expect, test } from "@playwright/test";

// Health and care services ask for consent to share health details before booking.
const SERVICE_ID = Number(process.env.E2E_SERVICE_ID || 1);
const slots = [{ startsAt: "2030-10-18T00:00:00Z", endsAt: "2030-10-18T01:00:00Z" }];

test("a health or care booking needs the customer's consent first", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/auth/get-session**", (r) => r.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: "2031-01-01T00:00:00Z" }, user: { id: "1", name: "Member", email: "member@example.test", emailVerified: true } } }));
  await page.route("**/api/v1/web/account", (r) => r.fulfill({ json: { data: { id: 1, username: "member", firstName: "Member" } } }));
  await page.route(`**/api/v1/web/account/services/${SERVICE_ID}/availability`, (r) => r.fulfill({ json: { data: {
    slots, timezone: "Australia/Adelaide", currency: "AUD", paymentRequired: false, paymentAvailable: true, bookingApproval: "instant", priceType: "fixed",
    requiresAddress: false, acceptsAddress: false, healthConsentRequired: true, quote: { subtotalCents: 0, buyerTotalCents: 0, platformFeeCents: 0, chargedTo: "provider" },
  } } }));
  let booked: Record<string, unknown> | null = null;
  await page.route(`**/api/v1/market/products/${SERVICE_ID}/bookings`, (r) => { booked = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { data: { booking: { id: 9, status: "confirmed" }, checkoutUrl: null } } }); });
  await page.route("**/account/bookings**", (r) => r.fulfill({ body: "<h1>Your bookings</h1>", contentType: "text/html" }));

  await page.goto(`/services/${SERVICE_ID}`);
  const form = page.locator(".product-detail-booking");
  await form.locator(".appointment-calendar button:not([disabled])").first().click();
  await form.locator(".appointment-time-grid button").first().click();
  await expect(form.getByText("Health details stay private.")).toBeVisible();
  const book = form.getByRole("button", { name: "Book appointment" });
  await expect(book).toBeDisabled();
  await form.getByLabel("I agree to share health or care details with this provider for this booking.").check();
  await expect(book).toBeEnabled();
  await book.click();
  await expect.poll(() => (booked as { healthConsent?: boolean } | null)?.healthConsent).toBe(true);
});
