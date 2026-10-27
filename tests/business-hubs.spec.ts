import { expect, test, type Page } from "@playwright/test";

// Your Hubs in the business workspace: the business overview on top (Hubs counted), then the Hubs
// list with the chosen Hub's numbers beside it, like Your events and Your listings.
const shots = process.env.TIVORAH_SHOTS_DIR;
const hubs = [
  { id: 4, name: "Adelaide Igbo Network", username: "adl-igbo", slogan: "Culture, food and family in Adelaide", description: null, avatar: null, banner: null, isPrivate: false, isOwner: true, currentUserRole: "creator", memberCount: "48" },
  { id: 9, name: "Norwood Runners", username: "norwood-run", slogan: null, description: "Saturday 5ks.", avatar: null, banner: null, isPrivate: true, isOwner: false, currentUserRole: "admin", memberCount: "12" },
  { id: 11, name: "Just a member", username: "member-only", slogan: null, description: null, avatar: null, banner: null, isPrivate: false, isOwner: false, currentUserRole: "member", memberCount: "300" },
];

async function open(page: Page, managedHubs = hubs) {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
  await page.route("**/api/v1/web/business/summary", route => route.fulfill({ json: { data: { hubs: { managed: 2, members: 60, pendingRequests: 3 }, listings: { items: 0, services: 0 }, events: { upcoming: 2, drafts: 1 }, appointments: { upcoming: 0 }, shop: { status: "none", slug: null }, payouts: { status: "not_started" } } } }));
  await page.route("**/api/v1/community/fetch/user/communities**", route => route.fulfill({ json: { data: { allCommunity: managedHubs } } }));
  await page.route("**/api/v1/community/request-list", route => route.fulfill({ json: { data: { communityRequestsList: [1, 2, 3].map(id => ({ request: { id, communityId: 4, requestUserId: id, createdAt: "2026-10-27T00:00:00Z" }, user: { id, username: `u${id}`, profile: { firstName: null, lastName: null, photo: null, bio: null, city: null } }, community: { id: 4, name: "Adelaide Igbo Network" } })) } } }));
  await page.route("**/api/v1/community/*/business-summary", route => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    return route.fulfill({ json: { data: id === 4 ? { members: 48, newMembers: 6, pendingRequests: 3, posts: 21, upcomingEvents: 2 } : { members: 12, newMembers: 1, pendingRequests: 0, posts: 4, upcomingEvents: 0 } } });
  });
  await page.goto("/business/hubs");
}

test("Your Hubs has the business overview and each Hub's numbers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  await expect(page.getByRole("heading", { level: 1, name: /Taylor/ })).toBeVisible();
  const stat = page.locator(".biz-stat", { hasText: "Your Hubs" });
  await expect(stat).toContainText("2");
  await expect(stat).toContainText("3 join requests");
  // Only Hubs this person owns or moderates.
  const list = page.getByRole("list", { name: "Your Hubs" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  // Newest first, so the first Hub shown is the newest one.
  const activity = page.getByLabel("Hub activity");
  await expect(activity).toContainText("12Members");
  await list.getByRole("button", { name: /Adelaide Igbo Network/ }).click();
  await expect(activity).toContainText("48Members");
  await expect(activity).toContainText("21Posts in the last 30 days");
  await expect(page.getByRole("link", { name: "Manage Hub" })).toHaveAttribute("href", "/business/hubs/4");
  await expect(page.getByRole("link", { name: "Join requests (3)" })).toHaveAttribute("href", "/business/hubs/4?tab=requests");
  if (shots) await page.screenshot({ path: `${shots}/business-hubs-desktop.png`, fullPage: true });

  await page.getByRole("searchbox", { name: "Search Hubs" }).fill("adelaide");
  await expect(list.getByRole("listitem")).toHaveCount(1);
});

test("on phones the Hub's numbers open in a sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("list", { name: "Your Hubs" }).getByRole("button", { name: /Adelaide Igbo Network/ }).click();
  await expect(page.getByLabel("Hub activity")).toContainText("6Joined in the last 30 days");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (shots) await page.screenshot({ path: `${shots}/business-hubs-phone.png` });
});

test("an empty Hub workspace matches the business event empty state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, []);
  const empty = page.locator(".product-empty", { hasText: "You don’t manage a Hub yet" });
  await expect(empty.getByRole("heading", { name: "You don’t manage a Hub yet" })).toBeVisible();
  await expect(empty.getByRole("link", { name: "Create your first Hub" })).toBeVisible();
  await page.screenshot({ path: "/tmp/tivorah-business-hubs-empty.png", fullPage: true });
});
