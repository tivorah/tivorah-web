import { expect, test, type Page } from "@playwright/test";

const order = (overrides: Record<string, unknown>) => ({
  id: 41, productId: 7, productTitle: "Party jollof rice", image: null, quantity: 2, fulfilment: "delivery", deliveryAddress: "10 Main St, Mawson Lakes SA",
  note: "Medium spice", unitPriceCents: 1800, deliveryFeeCents: 600, totalCents: 4200, currency: "AUD", status: "requested", responseNote: null, cancelledBy: null,
  createdAt: "2030-01-01T10:00:00Z", reviewed: false, counterparty: { username: "sofia", firstName: "Sofia" }, ...overrides,
});

async function signIn(page: Page) {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "ada@example.test", name: "Ada" } } }));
  await page.route("**/api/v1/web/account", (route) => route.fulfill({ json: { data: { id: 1, username: "adaskitchen", email: "ada@example.test", firstName: "Ada", lastName: null } } }));
}

test("a seller accepts a new order with a note for the buyer", async ({ page }) => {
  await signIn(page);
  let current = order({});
  const actions: { action: string; body: unknown }[] = [];
  await page.route("**/api/v1/market/item-orders?role=seller", (route) => route.fulfill({ json: { data: { orders: [current] } } }));
  await page.route("**/api/v1/market/item-orders/41/*", (route) => {
    const action = route.request().url().split("/").pop()!;
    actions.push({ action, body: route.request().postDataJSON() });
    current = order({ status: action === "accept" ? "accepted" : current.status, responseNote: "Ready at 6pm" });
    return route.fulfill({ json: { data: { order: current } } });
  });
  await page.goto("/business/orders");
  await expect(page.getByRole("heading", { level: 1, name: "Your orders" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Orders I received" })).toHaveAttribute("aria-pressed", "true");
  const card = page.locator(".item-order-card");
  await expect(card).toContainText("2 × Party jollof rice");
  await expect(card).toContainText("$42.00 (incl. $6.00 delivery)");
  await expect(card).toContainText("Medium spice");
  await card.getByPlaceholder("e.g. Ready at 6pm").fill("Ready at 6pm");
  await card.getByRole("button", { name: "Accept" }).click();
  await expect.poll(() => actions).toEqual([{ action: "accept", body: { note: "Ready at 6pm" } }]);
  await page.getByRole("button", { name: /In progress/ }).click();
  await expect(page.locator(".item-order-card").getByRole("button", { name: "Mark ready" })).toBeVisible();
});

test("the seller opens the order's enquiry chat once they've answered", async ({ page }) => {
  await signIn(page);
  let opened = 0;
  await page.route("**/api/v1/market/item-orders?role=seller", (route) => route.fulfill({ json: { data: { orders: [order({ id: 40 }), order({ status: "accepted" })] } } }));
  await page.route("**/api/v1/market/item-orders/41/chat", (route) => { opened += 1; return route.fulfill({ json: { data: { conversationId: 12 } } }); });
  await page.route("**/account/messages/12", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Chat</h1>" }));
  await page.goto("/business/orders");
  // A new request shows only Accept and Decline.
  await expect(page.locator(".item-order-card")).toHaveCount(1);
  await expect(page.locator(".item-order-card").getByRole("button", { name: /Message/ })).toHaveCount(0);
  await page.getByRole("button", { name: /In progress/ }).click();
  await page.locator(".item-order-card").getByRole("button", { name: /Message .* about this order/ }).click();
  await expect(page).toHaveURL(/\/account\/messages\/12$/);
  expect(opened).toBe(1);
});

test("a notification opens the exact order: its tab, highlighted", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/market/item-orders?role=seller", (route) => route.fulfill({ json: { data: { orders: [order({ id: 40 }), order({ id: 41, status: "ready" })] } } }));
  await page.goto("/business/orders?order=41");
  await expect(page.getByRole("button", { name: /In progress/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".item-order-card.is-highlighted")).toHaveCount(1);
  await expect(page.locator(".item-order-card.is-highlighted")).toContainText("Ready");
});

test("one item's orders, with a way back to all", async ({ page }) => {
  await signIn(page);
  let asked = "";
  await page.route("**/api/v1/market/item-orders?role=seller&productId=7", (route) => { asked = route.request().url(); return route.fulfill({ json: { data: { orders: [order({})] } } }); });
  await page.goto("/business/orders?product=7");
  await expect(page.locator(".item-orders-filter")).toContainText("Orders for Party jollof rice");
  await expect(page.getByRole("link", { name: "Show all" })).toHaveAttribute("href", "/business/orders");
  expect(asked).toContain("productId=7");
});

test("a buyer reviews a completed order once", async ({ page }) => {
  await signIn(page);
  let reviewed = false;
  let posted: unknown = null;
  await page.route("**/api/v1/market/item-orders?role=buyer", (route) => route.fulfill({ json: { data: { orders: [order({ status: "completed", reviewed })] } } }));
  await page.route("**/api/v1/market/item-orders/41/review", (route) => { posted = route.request().postDataJSON(); reviewed = true; return route.fulfill({ status: 201, json: { data: { review: { id: 3, rating: 5 } } } }); });
  await page.goto("/account/item-orders");
  await expect(page.getByRole("heading", { level: 1, name: "Your orders" })).toBeVisible();
  const post = page.getByRole("button", { name: "Post review" });
  await expect(post).toBeDisabled();
  await page.getByRole("button", { name: "5 stars" }).click();
  await page.getByPlaceholder("What did you like?").fill("Smoky and delicious.");
  await post.click();
  await expect.poll(() => posted).toEqual({ rating: 5, comment: "Smoky and delicious." });
  await expect(page.getByText("Thanks for your review.")).toBeVisible();
});

test("orders sent and received share one clear screen", async ({ page }) => {
  await signIn(page);
  await page.route("**/api/v1/market/item-orders?role=buyer", (route) => route.fulfill({ json: { data: { orders: [order({ productTitle: "Kids bike", counterparty: { username: "taylor", firstName: "Taylor" } })] } } }));
  await page.route("**/api/v1/market/item-orders?role=seller", (route) => route.fulfill({ json: { data: { orders: [order({ productTitle: "Indoor plant bundle", counterparty: { username: "priya", firstName: "Priya" } })] } } }));
  await page.goto("/account/item-orders");

  const sent = page.getByRole("button", { name: "Orders I sent" });
  const received = page.getByRole("button", { name: "Orders I received" });
  await expect(sent).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Kids bike")).toBeVisible();

  await received.click();
  await expect(received).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Indoor plant bundle")).toBeVisible();
  await expect(page.getByText("Kids bike")).toHaveCount(0);
});

test("phones show orders without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.route("**/api/v1/market/item-orders?role=seller", (route) => route.fulfill({ json: { data: { orders: [order({})] } } }));
  await page.goto("/business/orders");
  await expect(page.locator(".item-order-card")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
