import { expect, test } from "@playwright/test";

test("account ticket uses the established pass, downloads and preserves input after an invitation failure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { data: { features: { events: { enabled: true } } } } }));
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "session-test", userId: "1", token: "test-only", expiresAt: "2030-01-01T00:00:00Z" }, user: { id: "1", name: "Member", email: "member@example.test", emailVerified: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "member", firstName: "Member", email: "member@example.test" } } }));
  let attendeeName: string | null = null;
  const ticket = { publicId: "47105f94-b675-4ed5-887b-92996f1e74bb", orderId: 23, shortCode: "123456", status: "valid", checkedInAt: null, qrPayload: "signed-test-entry", canManage: true, event: { title: "Sunday gathering", startsAt: "2026-10-18T01:00:00Z", location: "Adelaide" }, ticketType: { name: "General admission" } };
  await page.route("**/api/v1/events/tickets/me", route => route.fulfill({ json: { data: { tickets: [{ ...ticket, attendeeName }] } } }));
  await page.route("**/api/v1/events/tickets/*/attendee", route => {
    attendeeName = route.request().postDataJSON().name;
    return route.fulfill({ json: { status: true, data: { attendeeName } } });
  });
  await page.route("**/api/v1/events/tickets/*/invite", route => route.fulfill({ status: 503, json: { status: false } }));
  await page.goto("/account/tickets");
  await expect(page.getByText("TIVORAH EVENT PASS")).toBeVisible();
  await expect(page.getByRole("img", { name: "Entry code for Sunday gathering" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ticket" }).click();
  expect((await download).suggestedFilename()).toBe("Tivorah-ticket-23-123456.png");
  await page.getByRole("button", { name: "Name on ticket" }).click();
  await page.getByLabel("Name on ticket", { exact: true }).fill("Alex Member");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByText("General admission · Alex Member")).toBeVisible();
  await page.getByRole("button", { name: "Send to a friend" }).click();
  await page.getByLabel("Friend’s email").fill("friend@example.test");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.locator(".event-pass").getByRole("alert")).toContainText("Please try again");
  await expect(page.getByLabel("Friend’s email")).toHaveValue("friend@example.test");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/tmp/tivorah-account-ticket-390.png", fullPage: true });
});
