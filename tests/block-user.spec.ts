import { expect, Page, test } from "@playwright/test";

// Block and unblock on web (App Store 1.2 / Google Play UGC parity with the app). API is mocked.
async function signIn(page: Page) {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: { session: { id: "session", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "buyer@example.test", name: "Buyer" } } }));
  await page.route("**/api/v1/web/account", (route) => route.fulfill({ json: { data: { id: 1, username: "buyer", email: "buyer@example.test", firstName: "Buyer", lastName: null } } }));
}

const shots = process.env.BLOCK_SHOTS_DIR;

test("someone can be blocked from a conversation, after confirming", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/chat/conversations?**", (route) => route.fulfill({ json: { data: { conversations: [], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/chat/conversations/90", (route) => route.fulfill({ json: { data: { conversation: { id: 90, category: "private", context: null, participants: [{ id: 1, username: "buyer" }, { id: 3, username: "neighbour", firstName: "Sam" }] } } } }));
  await page.route("**/api/v1/chat/conversations/90/messages?**", (route) => route.fulfill({ json: { data: { messages: [{ id: 1, conversationId: 90, senderId: 3, content: "See you at the market", createdAt: new Date().toISOString() }], pagination: { isMoreData: false } } } }));
  await page.route("**/api/v1/chat/conversations/90/delivered", (route) => route.fulfill({ json: { data: {} } }));
  await page.route("**/api/v1/chat/conversations/90/read", (route) => route.fulfill({ json: { data: {} } }));
  const blocked: unknown[] = [];
  await page.route("**/api/v1/blocks", (route) => { blocked.push(JSON.parse(route.request().postData() || "{}")); return route.fulfill({ json: { data: { userId: 3, blocked: true } } }); });

  await page.goto("/account/messages/90");
  const button = page.getByRole("button", { name: "Block Sam" });
  await expect(button).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/web-block-thread-${test.info().project.name}.png` });

  // Cancelling the question sends nothing.
  page.once("dialog", (dialog) => { expect(dialog.message()).toContain("Block Sam?"); void dialog.dismiss(); });
  await button.click();
  expect(blocked).toEqual([]);

  page.once("dialog", (dialog) => void dialog.accept());
  await button.click();
  await expect(page).toHaveURL(/\/account\/messages(\?tab=chats)?$/);
  expect(blocked).toEqual([{ userId: 3 }]);
});

test("blocked people are listed in settings and can be unblocked", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/web/account/profile", (route) => route.fulfill({ json: { data: { firstName: "Buyer", lastName: null, bio: null } } }));
  let unblocked = false;
  await page.route("**/api/v1/blocks", (route) => route.fulfill({ json: { data: { blocked: unblocked ? [] : [{ userId: 3, username: "neighbour", firstName: "Sam", lastName: "Lee", blockedAt: new Date().toISOString() }] } } }));
  await page.route("**/api/v1/blocks/3", (route) => { unblocked = route.request().method() === "DELETE"; return route.fulfill({ json: { data: { userId: 3, blocked: false } } }); });

  await page.goto("/account/settings");
  await expect(page.getByRole("heading", { name: "Blocked people" })).toBeVisible();
  await expect(page.getByText("Sam Lee")).toBeVisible();
  if (shots) { await page.getByRole("heading", { name: "Blocked people" }).scrollIntoViewIfNeeded(); await page.screenshot({ path: `${shots}/web-blocked-people-${test.info().project.name}.png` }); }
  await page.getByRole("button", { name: "Unblock" }).click();
  await expect(page.getByText("Sam Lee is unblocked.")).toBeVisible();
  await expect(page.getByText("You haven’t blocked anyone.")).toBeVisible();
  expect(unblocked).toBe(true);
});
