import { expect, Page, test } from "@playwright/test";

async function signIn(page: Page) {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: { session: { id: "session", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "buyer@example.test", name: "Buyer" } } }));
  await page.route("**/api/v1/web/account", (route) => route.fulfill({ json: { data: { id: 1, username: "buyer", email: "buyer@example.test", firstName: "Buyer", lastName: null } } }));
}

test("a signed-in shopper can enquire and continue the conversation on web", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/public/discovery/items/349", (route) => route.fulfill({ json: { data: { id: 349, title: "Portable air conditioner", description: "Working unit", image: null, locality: "Melbourne", state: "VIC", priceCents: 19000, sellerUsername: "seller" } } }));
  let enquiry = "";
  await page.route("**/api/v1/market/products/349/contact", (route) => { enquiry = JSON.parse(route.request().postData() || "{}").message; return route.fulfill({ json: { data: { conversationId: 77 } } }); });
  await page.route("**/api/v1/chat/conversations/77", (route) => route.fulfill({ json: { data: { conversation: { id: 77, category: "enquiry", context: { source: { kind: "marketplace_item", sourceId: 349, title: "Portable air conditioner" } }, participants: [{ id: 1, username: "buyer" }, { id: 2, username: "seller" }] } } } }));
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

test("private chats are listed, read and answered on web like enquiries", async ({ page }) => {
  await signIn(page);
  const listed: string[] = [];
  await page.route("**/api/v1/chat/conversations?**", (route) => {
    const kind = new URL(route.request().url()).searchParams.get("kind") || "";
    listed.push(kind);
    const conversations = kind === "private"
      ? [{ id: 90, category: "private", context: null, participants: [{ id: 1, username: "buyer" }, { id: 3, username: "neighbour", firstName: "Sam" }], unreadCount: 1, lastMessage: { content: "See you at the market", createdAt: new Date().toISOString() } }]
      : [{ id: 77, category: "enquiry", context: { source: { kind: "marketplace_item", sourceId: 349, title: "Portable air conditioner" } }, participants: [{ id: 1, username: "buyer" }, { id: 2, username: "seller" }], lastMessage: { content: "Is this still available?", createdAt: new Date().toISOString() } }];
    return route.fulfill({ json: { data: { conversations, pagination: { isMoreData: false } } } });
  });
  await page.route("**/api/v1/chat/conversations/90", (route) => route.fulfill({ json: { data: { conversation: { id: 90, category: "private", context: null, participants: [{ id: 1, username: "buyer" }, { id: 3, username: "neighbour", firstName: "Sam" }] } } } }));
  const sent: Array<{ content?: string }> = [];
  await page.route("**/api/v1/chat/conversations/90/messages", (route) => { sent.push(JSON.parse(route.request().postData() || "{}")); return route.fulfill({ json: { data: { message: { id: 3 } } } }); });
  await page.route("**/api/v1/chat/conversations/90/messages?**", (route) => route.fulfill({ json: { data: { messages: [
    { id: 2, conversationId: 90, senderId: 3, content: null, viewOnce: true, attachments: [], createdAt: new Date().toISOString() },
    { id: 1, conversationId: 90, senderId: 3, content: "See you at the market", createdAt: new Date().toISOString() },
  ], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/chat/conversations/90/delivered", (route) => route.fulfill({ json: { data: {} } }));
  await page.route("**/api/v1/chat/conversations/90/read", (route) => route.fulfill({ json: { data: {} } }));

  await page.goto("/account/messages");
  await expect(page.getByRole("button", { name: "Chats", pressed: true })).toBeVisible();
  await expect(page.getByText("See you at the market")).toBeVisible();
  await page.getByRole("button", { name: "Enquiries" }).click();
  await expect(page).toHaveURL(/\/account\/messages\?tab=enquiries$/);
  await expect(page.getByText("Portable air conditioner")).toBeVisible();
  expect(listed).toEqual(expect.arrayContaining(["private", "enquiry"]));
  await page.getByRole("button", { name: "Chats" }).click();
  await page.getByRole("link", { name: /Sam/ }).click();

  await expect(page).toHaveURL(/\/account\/messages\/90$/);
  await expect(page.getByText("This conversation is available in the Tivorah app.")).toHaveCount(0);
  await expect(page.getByText("View once photo — open it in the Tivorah app")).toBeVisible();
  await page.getByLabel("Reply to Sam").fill("On my way");
  await page.getByRole("button", { name: "Send" }).click();
  await expect.poll(() => sent[0]?.content).toBe("On my way");
});
