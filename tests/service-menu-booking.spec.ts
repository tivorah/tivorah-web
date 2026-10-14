import { expect, test } from "@playwright/test";

// The service page itself comes from the running API (service 1 in the dev data); the booking
// form's data is mocked here so the menu, quote and booking request can be checked.
const SERVICE_ID = Number(process.env.E2E_SERVICE_ID || 1);
const slots = [0, 1, 2].map((hour) => ({ startsAt: `2030-10-18T0${hour}:00:00Z`, endsAt: `2030-10-18T0${hour}:30:00Z` }));

test("customers pick menu items, see the server's total and book a time", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/auth/get-session**", (r) => r.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: "2031-01-01T00:00:00Z" }, user: { id: "1", name: "Member", email: "member@example.test", emailVerified: true } } }));
  await page.route("**/api/v1/web/account", (r) => r.fulfill({ json: { data: { id: 1, username: "member", firstName: "Member" } } }));
  await page.route(`**/api/v1/web/account/services/${SERVICE_ID}/availability`, (r) => r.fulfill({ json: { data: {
    slots, timezone: "Australia/Adelaide", currency: "AUD", paymentRequired: true, paymentTiming: "upfront", paymentAvailable: true, bookingApproval: "instant", priceType: "from",
    requiresAddress: true, acceptsAddress: true, refundPolicyLabel: "Free cancellation until the appointment starts",
    template: { menuLabel: "Menu", menuQuestion: "What’s on your menu?", menuHint: "", itemPlaceholder: "", modeQuestion: "How do customers get their order?", modeLabels: { at_provider: "Pickup", mobile: "I deliver" }, addressLabel: "Delivery address" },
    menu: [{ id: "jollof", name: "Jollof rice", description: "Smoky party jollof", priceCents: 1800 }, { id: "suya", name: "Beef suya", priceCents: 1200 }],
    quote: { subtotalCents: 1200, buyerTotalCents: 1200, platformFeeCents: 0, chargedTo: "provider" },
  } } }));
  let quoteBody: unknown = null;
  await page.route(`**/api/v1/market/products/${SERVICE_ID}/booking-quote`, (r) => { quoteBody = r.request().postDataJSON(); return r.fulfill({ json: { data: { quote: { subtotalCents: 4800, buyerTotalCents: 5100, platformFeeCents: 300, chargedTo: "buyer" } } } }); });
  let booked: { selections?: unknown; startsAt?: string } | null = null;
  await page.route(`**/api/v1/market/products/${SERVICE_ID}/bookings`, (r) => { booked = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { data: { booking: { id: 9, status: "confirmed" }, checkoutUrl: null } } }); });
  await page.route("**/account/bookings**", (r) => r.fulfill({ body: "<h1>Your bookings</h1>", contentType: "text/html" }));

  await page.goto(`/services/${SERVICE_ID}`);
  const form = page.locator(".product-detail-booking");
  await expect(form.getByText("Menu", { exact: true })).toBeVisible();
  const book = form.getByRole("button", { name: /Continue to payment|Book appointment/ });
  await expect(book).toBeDisabled();
  await expect(form.getByText("Add at least one item from the menu.")).toBeVisible();

  await form.getByRole("button", { name: "Add Jollof rice" }).click();
  await form.getByRole("button", { name: "One more Jollof rice" }).click();
  await form.getByRole("button", { name: "Add Beef suya" }).click();
  await expect(form.getByText("2 × Jollof rice")).toBeVisible();
  await expect(form.getByText(/51\.00/)).toBeVisible();
  expect(quoteBody).toEqual({ selections: [{ itemId: "jollof", quantity: 2 }, { itemId: "suya", quantity: 1 }] });

  await form.locator(".appointment-calendar button:not([disabled])").first().click();
  await form.locator(".appointment-time-grid button").first().click();
  await expect(form.getByText("Delivery address", { exact: true })).toBeVisible();
  await form.getByLabel("Street address").fill("12 King William St");
  await form.getByLabel("Suburb").fill("Adelaide");
  await form.locator("#booking-address-state").click();
  await page.getByRole("option", { name: "SA" }).click();
  await form.getByLabel("Postcode").fill("5000");
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/booking-menu.png` : "/tmp/booking-menu.png", fullPage: true });
  await book.click();
  await expect.poll(() => booked?.selections).toEqual([{ itemId: "jollof", quantity: 2 }, { itemId: "suya", quantity: 1 }]);
  expect((booked as { startsAt?: string } | null)?.startsAt).toBe(slots[0].startsAt);
});
