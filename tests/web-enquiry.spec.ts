import { expect, test } from "@playwright/test";

test("a signed-in shopper can enquire and continue the conversation on web", async ({ page }) => {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: { session: { id: "session", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "buyer@example.test", name: "Buyer" } } }));
  await page.route("**/api/v1/web/account", (route) => route.fulfill({ json: { data: { id: 1, username: "buyer", email: "buyer@example.test", firstName: "Buyer", lastName: null } } }));
  await page.route("**/api/v1/public/discovery/items/349", (route) => route.fulfill({ json: { data: { id: 349, title: "Portable air conditioner", description: "Working unit", image: null, locality: "Melbourne", state: "VIC", priceCents: 19000, sellerUsername: "seller" } } }));
  let enquiry = "";
  await page.route("**/api/v1/market/products/349/contact", (route) => { enquiry = JSON.parse(route.request().postData() || "{}").message; return route.fulfill({ json: { data: { conversationId: 77 } } }); });
  await page.route("**/api/v1/chat/conversations/77", (route) => route.fulfill({ json: { data: { conversation: { id: 77, category: "enquiry", context: { source: { kind: "marketplace_item", sourceId: 349, title: "Portable air conditioner" } }, participants: [{ id: 1, username: "buyer" }, { id: 2, username: "seller" }], e2eeRequired: false } } } }));
  await page.route("**/api/v1/chat/conversations/77/messages?**", (route) => route.fulfill({ json: { data: { messages: [{ id: 1, senderId: 1, content: "Is this still available?", createdAt: new Date().toISOString() }], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/chat/conversations/77/read", (route) => route.fulfill({ json: { data: {} } }));
  await page.goto("/shop/items/349");
  await page.getByLabel("Message", { exact: true }).fill("Is this still available?");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page).toHaveURL(/\/account\/messages\/77$/);
  await expect(page.getByText("Portable air conditioner", { exact: true })).toBeVisible();
  await expect(page.getByText("Is this still available?")).toBeVisible();
  expect(enquiry).toBe("Is this still available?");
});
