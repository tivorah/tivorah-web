import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

// A 1×1 PNG: enough for a cover photo in the form.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const photo = (name: string) => ({ name, mimeType: "image/png", buffer: png });

async function openCreateHub(page: Page) {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: { session: { id: "s", userId: "1", expiresAt: new Date(Date.now() + 3600000).toISOString() }, user: { id: "1", email: "taylor@example.test", name: "Taylor" } } }));
  await page.route("**/api/v1/web/account", route => route.fulfill({ json: { data: { id: 1, username: "taylor", email: "taylor@example.test", firstName: "Taylor", lastName: null } } }));
  await page.route("**/api/v1/utility/interests**", route => route.fulfill({ json: { data: { interests: [{ id: 1, name: "Running" }] } } }));
  await page.route("**/api/v1/community/rules/catalogue**", route => route.fulfill({ json: { data: { baseRules: [], presets: [] } } }));
  // The cover video goes straight to storage (lib/direct-upload.ts).
  await page.route("**/api/v1/uploads", route => route.fulfill({ json: { data: { id: "upload-1", partSize: 5242880, partCount: 1, single: { url: "https://storage.test/put", headers: {} } } } }));
  await page.route("https://storage.test/put", route => route.fulfill({ status: 200, headers: { ETag: '"etag"', "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "ETag" } }));
  await page.route("**/api/v1/uploads/upload-1/complete", route => route.fulfill({ json: { data: { id: "upload-1" } } }));
  await page.goto("/business/hubs/new");
  await expect(page.getByRole("heading", { level: 1, name: "Create a Hub" })).toBeVisible();
}

test("a Hub cover takes three photos and a video, in the order chosen", async ({ page }) => {
  await openCreateHub(page);
  await page.getByLabel("Add cover").setInputFiles([photo("one.png"), photo("two.png")]);
  await page.getByLabel(/^Add video/).setInputFiles(path.join(__dirname, "fixtures/cover-clip.webm"));
  const strip = page.getByRole("list", { name: "Cover slides, in order" });
  await expect(strip.getByRole("listitem")).toHaveCount(3);
  await expect(strip.getByText("Video · 2s")).toBeVisible();
  // A video is already there, so only photos can be added, and only one more.
  await expect(page.getByLabel(/^Add video/)).toHaveCount(0);
  await page.getByLabel("Add photos").setInputFiles([photo("three.png"), photo("four.png")]);
  await expect(page.locator(".cover-slides [role=alert]")).toContainText("Only 1 more slide fits");
  await expect(strip.getByRole("listitem")).toHaveCount(4);
  await expect(page.getByLabel("Add photos")).toHaveCount(0);
  // Put the video second.
  await page.getByRole("button", { name: "Move slide 3 earlier" }).click();
  await expect(strip.getByRole("listitem").nth(1)).toContainText("Video");

  let sent: { banners: number; video: string | null; position: string | null } | null = null;
  await page.route("**/api/v1/community/create", async route => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    sent = {
      banners: (body.match(/name="banner"/g) ?? []).length,
      video: /name="coverVideoUploadId"\r\n\r\n([^\r]+)/.exec(body)?.[1] ?? null,
      position: /name="coverVideoPosition"\r\n\r\n([^\r]+)/.exec(body)?.[1] ?? null,
    };
    await route.fulfill({ json: { data: { community: { id: 9 } } } });
  });
  await page.getByLabel("Add Hub photo").setInputFiles(photo("avatar.png"));
  await page.getByLabel("Hub name").fill("Adelaide Runners");
  await page.getByRole("button", { name: "Choose interests" }).click();
  await page.getByRole("dialog", { name: "Interests" }).getByRole("button", { name: "Running" }).click();
  await page.getByRole("dialog", { name: "Interests" }).getByRole("button", { name: /^Done/ }).click();
  await page.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect.poll(() => sent).toEqual({ banners: 4, video: "upload-1", position: "1" });
});

test("a cover video longer than 15 seconds is turned away", async ({ page }) => {
  await openCreateHub(page);
  await page.getByLabel(/^Add video/).setInputFiles(path.join(__dirname, "fixtures/cover-clip-long.webm"));
  await expect(page.locator(".cover-slides [role=alert]")).toContainText("up to 15 seconds");
  await expect(page.getByRole("list", { name: "Cover slides, in order" })).toHaveCount(0);
});
