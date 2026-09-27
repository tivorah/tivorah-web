import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("phone preview accepts short swipes and preserves vertical page scrolling", async ({ page }) => {
  await page.goto("/");
  await page.locator("#preview-panel").focus();
  await page.keyboard.press("Escape");
  const stage = page.locator(".product-tour .phone-stage");
  await stage.scrollIntoViewIfNeeded();
  const client = await page.context().newCDPSession(page);
  const swipe = async (dx: number, dy: number, cancel = false) => {
    const box = await stage.boundingBox();
    if (!box) throw new Error("Preview stage is missing");
    const x = box.x + box.width / 2;
    const y = Math.max(100, box.y + box.height / 2);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 6; step++) {
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * step / 6, y: y + dy * step / 6 }] });
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      await expect(stage).toHaveAttribute("data-dragging", "true");
    }
    await client.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  };

  await swipe(-32, 5);
  await expect(page.getByRole("tab", { name: "People", exact: true })).toHaveAttribute("aria-selected", "true");
  await swipe(32, 4);
  await expect(page.getByRole("tab", { name: "Hubs", exact: true })).toHaveAttribute("aria-selected", "true");
  await swipe(-40, 0, true);
  await expect(stage).toHaveAttribute("data-dragging", "false");
  await expect(page.getByRole("tab", { name: "Hubs", exact: true })).toHaveAttribute("aria-selected", "true");
  const before = await page.evaluate(() => window.scrollY);
  await swipe(4, -120);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 30);
  await expect(page.getByRole("tab", { name: "Hubs", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Next app screen" }).click();
  await expect(page.getByRole("tab", { name: "People", exact: true })).toHaveAttribute("aria-selected", "true");
});

for (const width of [320, 390, 1440]) {
  test(`preview controls fit at ${width}px with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const next = page.getByRole("button", { name: "Next app screen" });
    await next.click();
    await expect(page.getByRole("tab", { name: "People", exact: true })).toHaveAttribute("aria-selected", "true");
    const button = await next.boundingBox();
    expect(button!.width).toBeGreaterThanOrEqual(44);
    expect(button!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator(".tour-phone").first()).toHaveCSS("transition-duration", "0s");
    await page.locator("#preview").screenshot({ path: `/tmp/tivorah-preview-swipe-${width}.png` });
  });
}
