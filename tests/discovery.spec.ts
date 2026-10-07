import { test, expect } from "@playwright/test";
import { safeReturnPath } from "../lib/auth/return-path";

for (const width of [390, 1440]) {
  test(`homepage preserves its presentation with discovery navigation at ${width}px`, async ({ page }) => {
    let requestedDiscovery = false;
    await page.route('**/api/v1/config/bootstrap**', route => {
      requestedDiscovery = true;
      return route.fulfill({ json: { data: { features: Object.fromEntries(["events", "marketplace", "services", "communities"].map(key => [key, { enabled: true }])) } } });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('#home-title')).toHaveText('A new place.Your kind ofpeople.');
    await expect(page.locator('.home-page > section').first()).toHaveClass('home-opening');
    await expect(page.locator('.product-page, .mobile-product-nav')).toHaveCount(0);
    if (width < 600) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(navigation.getByRole('link')).toHaveText(['Events', 'Shop', 'Services', 'Hubs', 'Sign in']);
    await expect(navigation.getByRole('link', { name: 'Events', exact: true })).toHaveAttribute('href', '/events');
    await expect(navigation.getByRole('link', { name: 'Shop', exact: true })).toHaveAttribute('href', '/shop');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width < 600) await page.getByRole('button', { name: 'Close navigation menu' }).click();
    expect(requestedDiscovery).toBe(true);
    await page.screenshot({ path: `/tmp/tivorah-restored-home-${width}.png` });
  });
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: null }));
  await page.route("**/api/v1/config/bootstrap**", (route) =>
    route.fulfill({
      json: {
        data: {
          features: Object.fromEntries(
            ["events", "marketplace", "services", "communities"].map((key) => [
              key,
              { enabled: true },
            ]),
          ),
        },
      },
    }),
  );
});
test("return destinations cannot escape to another origin", () => {
  for (const value of [
    "//attacker.test",
    "/\\attacker.test",
    "https://attacker.test",
    "/auth/signin",
    "/%5c%5cattacker.test",
  ])
    expect(safeReturnPath(value)).toBe("/account");
  expect(safeReturnPath("/events/12?ticket=3#tickets")).toBe(
    "/events/12?ticket=3#tickets",
  );
});
for (const width of [390, 768, 1440]) {
  test(`discovery responds at ${width}px and preserves search`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/v1/public/discovery/**", (route) =>
      route.fulfill({
        json: {
          status: true,
          data: {
            items: [
              {
                id: 42,
                title: "Sunday makers gathering",
                description: "Meet local makers.",
                image: "https://images.pexels.com/photos/19755888/pexels-photo-19755888.jpeg?auto=compress&fit=crop&w=1000",
                category: "Meetups",
                locality: "Adelaide",
                state: "SA",
                startsAt: "2026-10-18T01:00:00Z",
                priceCents: 0,
                hasPaidTickets: true,
              },
            ],
            nextSkip: null,
          },
        },
      }),
    );
    await page.goto("/events");
    if (width < 850) await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
    if (width < 850) await page.getByRole("button", { name: "Close navigation menu" }).click();
    await expect(
      page.getByRole("heading", { name: "Sunday makers gathering" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sunday makers gathering/ })).toContainText("Free & paid");
    await expect(
      page.getByRole("heading", { name: "Make room for a good time." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("What are you looking for?").fill("makers");
    await expect(page.getByRole("button", { name: "Search", exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(/query=makers/);
    await expect(
      page.getByRole("heading", { name: "Results for “makers”" }),
    ).toBeVisible();
    await page.screenshot({
      path: `/tmp/tivorah-discovery-${width}.png`,
      fullPage: true,
    });
  });
}
test("API failures render recovery rather than an empty catalogue", async ({
  page,
}) => {
  await page.route("**/api/v1/public/discovery/**", (route) =>
    route.fulfill({
      status: 429,
      json: { message: "Too many requests" },
      headers: { "Retry-After": "30" },
    }),
  );
  await page.goto("/shop");
  await expect(page.locator(".product-notice[role=alert]")).toContainText(
    "Too many requests",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText("No items match this search.")).toBeHidden();
});
test("signed-out account never renders member records", async ({ page }) => {
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({ json: null }),
  );
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in", exact: true }),
  ).toHaveAttribute("href", "/auth/signin?returnTo=%2Faccount");
});

test("a changed account identity cannot open private records under an old session", async ({
  page,
}) => {
  let requestedTickets = false;
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({
      json: {
        session: {
          id: "session-a",
          userId: "1",
          expiresAt: "2030-01-01T00:00:00Z",
          token: "test-only",
        },
        user: {
          id: "1",
          name: "First user",
          email: "first@example.test",
          emailVerified: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      },
    }),
  );
  await page.route("**/api/v1/web/account", (route) =>
    route.fulfill({
      json: {
        data: {
          id: 2,
          username: "second",
          firstName: "Second user",
          email: "second@example.test",
        },
      },
    }),
  );
  await page.route("**/api/v1/events/tickets/me**", (route) => {
    requestedTickets = true;
    return route.fulfill({ json: { data: { tickets: [] } } });
  });
  await page.goto("/account/tickets");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Your account" })).toHaveAttribute("href", "/account");
  await expect(page.locator(".product-notice[role=alert]")).toContainText(
    "Could not load your account",
  );
  await expect(page.getByText("Second user")).toHaveCount(0);
  expect(requestedTickets).toBe(false);
});

test("disabled features have no navigation or functional search", async ({
  page,
}) => {
  await page.route("**/api/v1/config/bootstrap**", (route) =>
    route.fulfill({ json: { data: { features: {} } } }),
  );
  await page.goto("/shop");
  await expect(
    page.getByText("This section is currently unavailable."),
  ).toBeVisible();
  await expect(page.getByRole("search")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Shop", exact: true }),
  ).toHaveCount(0);
});

test("narrow dark layout supports reduced motion and keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.route("**/api/v1/public/discovery/**", (route) =>
    route.fulfill({ json: { data: { items: [], nextSkip: null } } }),
  );
  await page.goto("/services");
  await expect(page.getByText("No services match this search.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".discover-artwork canvas")).toHaveCount(0);
  await page.getByLabel("What are you looking for?").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Suburb" })).toBeFocused();
  await page.screenshot({ path: "/tmp/tivorah-dark-320.png", fullPage: true });
});

test("sign in preserves the requested event at enlarged text size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/auth/signin?returnTo=%2Fevents%2F42%3Fticket%3D3%26quantity%3D2",
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/tivorah-signin-390.png",
    fullPage: true,
  });
});

test("live search debounces typing and reuses public results within its cache window", async ({ page }) => {
  const searches: string[] = [];
  await page.route("**/api/v1/public/discovery/**", route => {
    searches.push(new URL(route.request().url()).searchParams.get("query") || "");
    return route.fulfill({ json: { data: { items: [], nextSkip: null } } });
  });
  await page.goto("/events");
  await expect(page.getByText("No upcoming events match this search.")).toBeVisible();
  const input = page.getByLabel("What are you looking for?");
  await input.pressSequentially("music", { delay: 30 });
  await expect(page).toHaveURL(/query=music/);
  await expect.poll(() => searches.filter(q => q === "music").length).toBe(1);
  expect(searches).not.toContain("mus");
  await input.fill("food");
  await expect.poll(() => searches.includes("food")).toBe(true);
  await input.fill("music");
  await expect(page).toHaveURL(/query=music/);
  await expect(page.getByText("No upcoming events match this search.")).toBeVisible();
  expect(searches.filter(q => q === "music")).toHaveLength(1);
});

test("search honours server cooldown without sending requests for further typing", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/v1/public/discovery/**", route => {
    calls++;
    return route.fulfill({ status: 429, headers: { "Retry-After": "60" }, json: { message: "Too many requests" } });
  });
  await page.goto("/events");
  await expect(page.getByRole("button", { name: /Try again in/ })).toBeDisabled();
  const callsBeforeTyping = calls;
  await page.getByLabel("What are you looking for?").fill("music");
  await expect(page).toHaveURL(/query=music/);
  await expect(page.getByText("Search is paused briefly. Please wait before trying again.")).toBeVisible();
  expect(calls).toBe(callsBeforeTyping);
});

test("mobile filters preserve search and selected locality through API requests", async ({ page }) => {
  const requests: URL[] = [];
  await page.route("**/api/v1/public/discovery/**", route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/locations')) return route.fulfill({ json: { data: { localities: [{ suburb: 'Adelaide', state: 'SA', postcode: '5000', latitude: -34.9, longitude: 138.6 }] } } });
    requests.push(url);
    return route.fulfill({ json: { data: { items: [], nextSkip: null } } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/shop?query=chair');
  await page.getByRole('combobox', { name: 'Category', exact: true }).click();
  await page.getByRole('option', { name: 'Furniture & home', exact: true }).click();
  const location = page.getByLabel('Suburb', { exact: true });
  await location.fill('Ade');
  await expect(page.locator('datalist option')).toHaveCount(1);
  await location.fill('Adelaide, SA 5000');
  await expect(page).toHaveURL(/locality=Adelaide/);
  expect(new URL(page.url()).searchParams.has('postcode')).toBe(false);
  await page.getByText('More filters', { exact: false }).click();
  await page.getByRole('combobox', { name: 'Condition', exact: true }).click();
  await page.getByRole('option', { name: 'Used — good', exact: true }).click();
  await page.getByLabel('Minimum price', { exact: true }).fill('10');
  await page.getByLabel('Maximum price', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => requests.some(url => url.searchParams.get('minPrice') === '1000' && url.searchParams.get('category') === 'Furniture & home' && url.searchParams.get('latitude') === '-34.9' && url.searchParams.get('query') === 'chair')).toBe(true);
  await page.getByRole('button', { name: 'Reset all' }).click();
  await expect(page).toHaveURL('http://localhost:7456/shop');
  await expect(location).toHaveValue('');
});

for (const width of [390, 1440]) {
  test(`filter menus support search, keyboard and cancelled drafts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/v1/public/discovery/**', route => route.fulfill({ json: { data: { items: [], nextSkip: null } } }));
    await page.goto('/shop');
    const category = page.getByRole('combobox', { name: 'Category', exact: true });
    await category.click();
    const search = page.getByRole('textbox', { name: 'Search category' });
    await expect(search).toBeFocused();
    await search.fill('furn');
    await expect(page.getByRole('option')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(category).toBeFocused();
    await expect(page.getByRole('button', { name: 'Remove Furniture & home' })).toBeVisible();
    const more = page.getByRole('button', { name: /More filters/ });
    await more.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('Minimum price', { exact: true }).fill('200');
    await page.getByRole('combobox', { name: 'Condition', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(more).toBeFocused();
    expect(new URL(page.url()).searchParams.has('minPrice')).toBe(false);
    await more.click();
    await expect(page.getByLabel('Minimum price', { exact: true })).toHaveValue('');
    await dialog.screenshot({ path: `/tmp/tivorah-filter-dialog-${width}.png` });
    await page.getByRole('button', { name: 'Close filters' }).click();
    await category.click();
    await page.screenshot({ path: `/tmp/tivorah-filter-dropdown-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("location can be selected inside the filter modal and only applies on submit", async ({ page }) => {
  await page.route('**/api/v1/public/discovery/**', route => {
    if (route.request().url().includes('/locations?')) return route.fulfill({ json: { data: { localities: [{ suburb: 'Adelaide', state: 'SA', postcode: '5000', latitude: -34.9, longitude: 138.6 }] } } });
    return route.fulfill({ json: { data: { items: [], nextSkip: null } } });
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/shop');
  await page.getByRole('button', { name: /More filters/ }).click();
  const dialog = page.getByRole('dialog');
  const distance = dialog.getByRole('combobox', { name: 'Distance' });
  await expect(distance).toBeDisabled();
  await dialog.getByLabel('Suburb', { exact: true }).fill('Adelaide');
  await dialog.getByRole('option', { name: 'Adelaide SA 5000' }).click();
  await expect(distance).toBeEnabled();
  await distance.click();
  await dialog.getByRole('option', { name: 'Within 25 km', exact: true }).click();
  expect(new URL(page.url()).search).toBe('');
  await dialog.screenshot({ path: '/tmp/tivorah-modal-location.png' });
  await dialog.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/radiusKm=25/);
  expect(new URL(page.url()).searchParams.has('postcode')).toBe(false);
  await page.getByRole('button', { name: /More filters/ }).click();
  await expect(distance).toHaveText('Within 25 km');
  await dialog.getByLabel('Suburb', { exact: true }).fill('Sydney');
  await dialog.getByRole('button', { name: 'Close filters' }).click();
  await expect(page).toHaveURL(/locality=Adelaide/);
  await page.getByRole('button', { name: 'Remove Within 25 km' }).click();
  await expect.poll(() => new URL(page.url()).searchParams.has('radiusKm')).toBe(false);
  expect(new URL(page.url()).searchParams.get('locality')).toBe('Adelaide');
  expect(new URL(page.url()).searchParams.has('postcode')).toBe(false);
  await expect(page.getByRole('button', { name: 'Remove Adelaide' })).toBeVisible();
  for (const key of ['latitude', 'longitude']) {
    expect(new URL(page.url()).searchParams.has(key)).toBe(true);
  }
  await page.getByRole('button', { name: /More filters/ }).click();
  await expect(dialog.getByRole('combobox', { name: 'Distance' })).toBeEnabled();
  await expect(dialog.getByLabel('Suburb', { exact: true })).toHaveValue('Adelaide');
});

test("postcode is sent only when explicitly set in filters", async ({ page }) => {
  const requests: URL[] = [];
  await page.route('**/api/v1/public/discovery/items?**', route => {
    const url = new URL(route.request().url());
    requests.push(url);
    return route.fulfill({ json: { data: { items: [], nextSkip: null } } });
  });
  await page.goto('/shop?locality=Melbourne&state=VIC&latitude=-37.8144733&longitude=144.9825846');
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  expect(requests.at(-1)!.searchParams.get('locality')).toBe('Melbourne');
  expect(requests.at(-1)!.searchParams.get('state')).toBe('VIC');
  expect(requests.at(-1)!.searchParams.has('postcode')).toBe(false);
  await page.getByRole('button', { name: /More filters/ }).click();
  await page.getByRole('dialog').getByLabel('Postcode', { exact: true }).fill('3004');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get('postcode')).toBe('3004');
});
