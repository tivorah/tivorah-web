import { expect, test, type Page } from "@playwright/test";

// A 1×1 PNG: enough for a cover photo in the form.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const photo = (name: string) => ({ name, mimeType: "image/png", buffer: png });

async function openCreateHub(page: Page) {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
  await page.route("**/api/v1/utility/interests**", route => route.fulfill({ json: { data: { interests: [{ id: 1, name: "Running" }] } } }));
  await page.route("**/api/v1/community/rules/catalogue**", route => route.fulfill({ json: { data: { baseRules: [], presets: [] } } }));
  await page.goto("/business/hubs/new");
  await expect(page.getByRole("heading", { level: 1, name: "Create a Hub" })).toBeVisible();
}

test("a Hub cover takes up to four photos, in the order chosen, and no video", async ({ page }) => {
  await openCreateHub(page);
  await page.getByLabel("Add cover").setInputFiles([photo("one.png"), photo("two.png")]);
  const strip = page.getByRole("list", { name: "Cover slides, in order" });
  await expect(strip.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByLabel(/^Add video/)).toHaveCount(0);
  // Only two more fit on a Hub's cover.
  await page.getByLabel("Add photos").setInputFiles([photo("three.png"), photo("four.png"), photo("five.png")]);
  await expect(page.locator(".cover-slides [role=alert]")).toContainText("Only 2 more slides fit");
  await expect(strip.getByRole("listitem")).toHaveCount(4);
  await expect(page.getByLabel("Add photos")).toHaveCount(0);
  // Put the third photo second.
  await page.getByRole("button", { name: "Move slide 3 earlier" }).click();

  let sent: { banners: number; video: string | null } | null = null;
  await page.route("**/api/v1/community/create", async route => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    sent = {
      banners: (body.match(/name="banner"/g) ?? []).length,
      video: /name="coverVideoUploadId"\r\n\r\n([^\r]+)/.exec(body)?.[1] ?? null,
    };
    await route.fulfill({ json: { data: { community: { id: 9 } } } });
  });
  await page.getByLabel("Add Hub photo").setInputFiles(photo("avatar.png"));
  await page.getByLabel("Hub name").fill("Adelaide Runners");
  await page.getByRole("button", { name: "Choose interests" }).click();
  await page.getByRole("dialog", { name: "Interests" }).getByRole("button", { name: "Running" }).click();
  await page.getByRole("dialog", { name: "Interests" }).getByRole("button", { name: /^Done/ }).click();
  await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect.poll(() => sent).toEqual({ banners: 4, video: null });
});

test("a video is turned away from a Hub cover", async ({ page }) => {
  await openCreateHub(page);
  await page.getByLabel("Add cover").setInputFiles({ name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("not really a video") });
  await expect(page.locator(".cover-slides [role=alert]")).toContainText("Covers are photos");
  await expect(page.getByRole("list", { name: "Cover slides, in order" })).toHaveCount(0);
});
