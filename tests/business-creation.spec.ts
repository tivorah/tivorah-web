import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "session", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
  await page.route("**/api/v1/user/participant-agreements", route => route.fulfill({ json: { data: { version: "1", agreements: [{ kind: "organizer" }, { kind: "service_provider" }] } } }));
  await page.route("**/api/v1/events/mine?**", route => route.fulfill({ json: { data: { events: [], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/market/products/mine?**", route => route.fulfill({ json: { data: { products: [], pagination: { isMoreData: false } } } }));
});

test("member can reach each creation form from account and business", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Create on Tivorah" })).toBeVisible();
  await page.getByRole("link", { name: /Create an event Bring people together/ }).click();
  await expect(page).toHaveURL(/\/business\/create\?type=event$/);
  // Tickets are set up per ticket type now (limits live in each type's editor).
  await expect(page.getByRole("button", { name: "Add a ticket type" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Manage business" })).toBeVisible();
  await expect(page.getByLabel("What are you creating?")).toHaveCount(0);
  await page.goto("/business");
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening), Taylor$/ })).toBeVisible();
  // Offered in the header and in the empty shop section; either opens the same form.
  await page.getByRole("link", { name: "Offer a service", exact: true }).first().click();
  const serviceMode = page.getByRole("radiogroup", { name: "How do you provide this service?" });
  await expect(serviceMode).toBeVisible();
  await serviceMode.getByRole("radio", { name: "I travel" }).check();
  await expect(page.getByLabel("Travel distance (km)")).toBeVisible();
  await page.goto("/business/create?type=item");
  await expect(page.getByRole("textbox", { name: /^Pickup details/ })).toBeVisible();
});

test("event preview shows verified activity and clear actions", async ({ page }) => {
  await page.unroute("**/api/v1/events/mine?**");
  await page.route("**/api/v1/events/mine?**", route => route.fulfill({ json: { data: { events: [{ id: 24, title: "Adelaide Language Exchange", status: "draft" }], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/events/24/business-summary", route => route.fulfill({ json: { data: { bookings: 3, ticketsBooked: 7, enquiries: 2, messages: 4, latestEnquiryId: 37 } } }));
  await page.goto("/business?view=events");
  const preview = page.getByLabel("Adelaide Language Exchange details");
  await expect(preview).toContainText("7Tickets booked");
  await expect(preview).toContainText("4Messages received");
  await expect(preview.getByRole("link", { name: /Open latest enquiry/ })).toHaveAttribute("href", "/account/messages/37");
  await expect(preview.getByRole("button", { name: "Publish event" })).toBeVisible();
  await expect(preview.getByRole("link", { name: "Edit event details" })).toHaveAttribute("href", "/business/events/24");
});

test("business navigation switches between listings and events", async ({ page }) => {
  await page.goto("/business");
  await expect(page.getByRole("heading", { name: "Your listings" })).toBeVisible();
  await page.getByRole("navigation", { name: "Manage business" }).getByRole("link", { name: "Events" }).click();
  await expect(page.getByRole("heading", { name: "Your events" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your listings" })).toHaveCount(0);
});

test("phone workspace keeps creation and business views reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/business");
  await page.getByText("Create on Tivorah").click();
  await page.getByRole("link", { name: "Offer a service", exact: true }).click();
  await expect(page).toHaveURL(/\/business\/create\?type=service$/);
  await page.goto("/business");
  await page.getByRole("navigation", { name: "Business navigation on phones" }).getByRole("link", { name: "Events" }).click();
  await expect(page.getByRole("heading", { name: "Your events" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("selecting a business listing updates its management panel", async ({ page }) => {
  await page.unroute("**/api/v1/market/products/mine?**");
  await page.route("**/api/v1/market/products/*/business-summary", route => route.fulfill({ json: { data: { enquiries: 2, messages: 4, appointments: 0, upcomingAppointments: 0, latestEnquiryId: 37 } } }));
  await page.route("**/api/v1/market/products/mine?**", route => route.fulfill({ json: { data: { products: [
    { id: 358, title: "Cleaning service", status: "active", listingType: "service" },
    { id: 349, title: "Portable air conditioner", status: "reserved", listingType: "item" },
  ], pagination: { isMoreData: false } } } }));
  await page.goto("/business");
  await page.getByRole("button", { name: /Portable air conditioner Shop item reserved/i }).click();
  await expect(page.getByLabel("Portable air conditioner details")).toContainText("Portable air conditioner");
  await expect(page.getByLabel("Portable air conditioner details").getByRole("link", { name: "Manage listing" })).toHaveAttribute("href", "/business/listings/349");
  await expect(page.getByLabel("Portable air conditioner details").getByRole("link", { name: "View public listing" })).toHaveAttribute("href", "/shop/items/349");
  await expect(page.getByLabel("Portable air conditioner details")).toContainText("2Enquiries");
  await expect(page.getByLabel("Portable air conditioner details").getByRole("link", { name: /Open latest enquiry/ })).toHaveAttribute("href", "/account/messages/37");
});

test("events and listings each paginate ten at a time", async ({ page }) => {
  await page.unroute("**/api/v1/market/products/mine?**");
  await page.unroute("**/api/v1/events/mine?**");
  for (const [path, key, title] of [
    ["market/products", "products", "Listing"],
    ["events", "events", "Event"],
  ] as const) {
    await page.route(`**/api/v1/${path}/mine?**`, route => {
      const skip = Number(new URL(route.request().url()).searchParams.get("skip"));
      return route.fulfill({ json: { data: {
        [key]: skip === 0
          ? Array.from({ length: 10 }, (_, index) => ({ id: index + 1, title: `${title} ${index + 1}`, status: "active", listingType: "item" }))
          : [{ id: 11, title: `${title} 11`, status: "active", listingType: "item" }],
        pagination: { isMoreData: skip === 0 },
      } } });
    });
  }
  await page.goto("/business");
  await expect(page.getByRole("list", { name: "Your listings" }).getByRole("listitem")).toHaveCount(10);
  await page.getByRole("navigation", { name: "Listing pages" }).getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("list", { name: "Your listings" })).toContainText("Listing 11");
  await page.getByRole("navigation", { name: "Manage business" }).getByRole("link", { name: "Events" }).click();
  await expect(page.getByRole("list", { name: "Your events" }).getByRole("listitem")).toHaveCount(10);
  await page.getByRole("navigation", { name: "Event pages" }).getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("list", { name: "Your events" })).toContainText("Event 11");
});

test("event workspace stays focused across tabs and phone widths", async ({ page }) => {
  await page.route("**/api/v1/events/39", route => route.fulfill({ json: { data: { id: 39, organizerId: 1, title: "Sunset Rooftop Social Adelaide", status: "draft", description: "Music and conversation with city views.", startsAt: "2026-11-08T08:30:00Z", endsAt: "2026-11-08T11:30:00Z", category: "Social", locationType: "venue", suburb: "Adelaide", state: "SA", postcode: "5000", venueName: "Rooftop", images: [], ticketTypes: [{ id: 1, name: "General admission", priceCents: 2200, quantity: 60, sold: 0, maxTicketsPerBuyer: 4 }] } } }));
  await page.goto("/business/events/39");
  await expect(page.getByRole("heading", { name: "Sunset Rooftop Social Adelaide" })).toBeVisible();
  await expect(page.getByLabel("Business navigation", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish event", exact: true })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Event name" })).toHaveValue("Sunset Rooftop Social Adelaide");
  await expect(page.getByRole("textbox", { name: "Description" })).toHaveValue("Music and conversation with city views.");
  // Every section heading stays compact.
  const headingSizes = await page.locator(".event-manage-content h2").evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).fontSize)));
  expect(headingSizes.length).toBeGreaterThan(0);
  expect(Math.max(...headingSizes)).toBeLessThanOrEqual(24);
  await page.screenshot({ path: "/tmp/tivorah-event-workspace-desktop.png", fullPage: true });
  await page.getByRole("navigation", { name: "Manage event" }).getByRole("button", { name: "Tickets", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ticket packages" })).toBeVisible();
  await page.getByRole("button", { name: "Add a package" }).click();
  await expect(page.getByLabel("Tickets available", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/tivorah-event-workspace-phone.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("navigation", { name: "Manage event" }).getByRole("button", { name: "Check-in", exact: true }).click();
  await expect(page.getByText("Check-in opens when the event is published")).toBeVisible();
});

test("item availability dropdown locks scrolling and is absent for services", async ({ page }) => {
  await page.unroute("**/api/v1/market/products/mine?**");
  await page.route("**/api/v1/market/products/mine?**", route => route.fulfill({ json: { data: { products: [
    { id: 901, title: "Dining chairs", listingType: "item", status: "active" },
    { id: 902, title: "Home cleaning", listingType: "service", status: "active" },
  ], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/market/products/*/business-summary", route => route.fulfill({ json: { data: { enquiries: 0, messages: 0, appointments: 0, upcomingAppointments: 0, latestEnquiryId: null } } }));
  await page.goto("/business");
  await page.getByRole("button", { name: /Dining chairs Shop item/ }).click();
  const trigger = page.getByRole("button", { name: "Change availability" });
  await trigger.click();
  const dropdown = page.getByRole("dialog", { name: "Change availability" });
  await expect(dropdown).toBeVisible();
  await expect(dropdown.getByRole("button", { name: "Available" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  await page.screenshot({ path: "/tmp/tivorah-availability-desktop.png" });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await expect(dropdown).toBeVisible();
  await page.screenshot({ path: "/tmp/tivorah-availability-phone.png" });
  await page.mouse.click(2, 2);
  await expect(dropdown).not.toBeVisible();
  await page.getByRole("button", { name: /Home cleaning/ }).click();
  await expect(trigger).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Manage service", exact: true })).toBeVisible();
});

test("service appointments display and save the selected time zone", async ({ page }) => {
  let savedZone = "Australia/Adelaide";
  await page.route("**/api/v1/market/products/902", async route => {
    if (route.request().method() === "PATCH") savedZone = route.request().postDataJSON().availabilityTimezone;
    await route.fulfill({ json: { data: { product: { id: 902, sellerId: 1, listingType: "service", title: "Home cleaning", description: "A complete home cleaning service.", businessName: "Taylor", category: "Cleaning", images: ["https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg"], priceCents: 10000, priceType: "fixed", serviceMode: "online", state: "SA", bookingEnabled: true, paymentRequired: false, slotDurationMinutes: 60, bookingNoticeHours: 24, weeklyAvailability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }], availabilityTimezone: savedZone } } } });
  });
  await page.goto("/business/listings/902");
  const zone = page.getByLabel("Appointment time zone");
  await expect(zone).toHaveValue("Australia/Adelaide");
  await zone.selectOption("Australia/Perth");
  await expect(page.getByText(/Weekly times use Australia\/Perth/)).toBeVisible();
  await zone.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/tivorah-service-timezone-desktop.png" });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Listing updated.", { exact: true })).toBeVisible();
  expect(savedZone).toBe("Australia/Perth");
  await page.reload();
  await expect(zone).toHaveValue("Australia/Perth");
  await page.setViewportSize({ width: 390, height: 844 });
  await zone.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/tivorah-service-timezone-phone.png" });
});
