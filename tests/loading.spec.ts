import { expect, test } from "@playwright/test";
for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`discovery shimmer respects ${reducedMotion} and disappears after loading`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    let release!: () => void;
    const ready = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/v1/config/bootstrap**", route => route.fulfill({ json: { data: { features: { events: { enabled: true } } } } }));
    await page.route("**/api/v1/public/discovery/events**", async route => {
      await ready;
      await route.fulfill({ json: { status: true, data: { items: [], nextSkip: null } } });
    });
    await page.goto("/events");
    const loading = page.getByRole("status", { name: "Loading results…" });
    await expect(loading).toBeVisible();
    await expect(loading.locator(".tivorah-shimmer").first()).toHaveCSS("animation-name", reducedMotion === "reduce" ? "none" : /^tivorah-(brand-)?shimmer$/);
    expect(await loading.getByRole("button").count()).toBe(0);
    release();
    await expect(loading).toHaveCount(0);
    await expect(page.locator(".product-loading")).toHaveCount(0);
  });
}
