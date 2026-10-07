import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const fixtureRoute = `ticket-cart-test-preview-${process.pid}`;
const fixturePath = resolve('app', fixtureRoute);
const event = { id: 42, title: 'Adelaide gathering', guestBookingAvailable: true, images: [], img: null, startsAt: '2030-01-01T09:00:00Z', endsAt: '2030-01-01T12:00:00Z', locationType: 'online', organizerName: 'Test organiser', ticketTypes: [
  { id: 2, name: 'First release', priceCents: 1100, buyerPriceCents: 1255, currency: 'AUD', remaining: 8, maxTicketsPerBuyer: 4, available: true },
  { id: 3, name: 'Second release', priceCents: 2200, buyerPriceCents: 2410, currency: 'AUD', remaining: 6, maxTicketsPerBuyer: 4, available: true },
  { id: 4, name: 'Early bird', priceCents: 500, currency: 'AUD', remaining: 0, maxTicketsPerBuyer: 4, available: false },
] };
test.beforeAll(() => {
  mkdirSync(fixturePath, { recursive: true });
  writeFileSync(`${fixturePath}/page.tsx`, `import EventBookingPage from '../events/[id]/event-booking'; import '../events/events.css'; export default function Page() { return <EventBookingPage event={${JSON.stringify(event)} as any}/>; }`);
});
test.afterAll(() => { rmSync(fixturePath, { recursive: true, force: true }); rmSync(resolve('.next-dev/types/app', fixtureRoute), { recursive: true, force: true }); });
test('mixed tickets preserve quantities, combine fees once and review GST before submitting', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/get-session**', route => route.fulfill({ json: null }));
  await page.route('**/api/v1/web/account', route => route.fulfill({ status: 401, json: {} }));
  let quotes = 0;
  await page.route('**/api/v1/public/events/42/quote', route => { quotes++; return route.fulfill({ json: { status: true, data: { subtotalCents: 1100, platformFeeCents: 155, buyerTotalCents: 1255, percentageBps: 500, fixedFeeCents: 100, chargedTo: 'buyer', tax: { treatment: 'taxable', ticketGstCents: 100 } } } }); });
  let submitted: any;
  await page.route('**/api/v1/public/events/42/guest-orders', route => { submitted = route.request().postDataJSON(); return route.fulfill({ status: 409, json: { status: false, message: 'Test recovery: booking remains editable.' } }); });
  // Next dev discovers generated test routes asynchronously after another fixture is removed.
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await page.goto(`/${fixtureRoute}`);
    if (response?.status() !== 404) break;
    await page.waitForTimeout(250);
  }
  await expect(page.getByRole('button', { name: 'Add Early bird' })).toBeDisabled();
  await expect(page.locator('.event-total')).toContainText('12.55');
  await page.getByRole('button', { name: 'Add Second release' }).click();
  await expect(page.locator('.event-total')).toContainText('35.65');
  expect(quotes).toBe(1);
  await page.getByText('Order summary', { exact: true }).click();
  await expect(page.locator('.event-total')).toContainText('1 × First release');
  await expect(page.locator('.event-total')).toContainText('1 × Second release');
  await expect(page.locator('.event-total')).toContainText('2.65');
  await expect(page.locator('.event-total')).toContainText('3.00');
  await page.getByLabel('Full name').fill('Test Buyer');
  await page.getByLabel('Email address').fill('buyer@example.test');
  await page.getByRole('checkbox').check();
  await page.locator('#tickets').screenshot({ path: '/tmp/tivorah-cart-phone.png', style: 'header, .skip-link { visibility: hidden !important; }' });
  const target = await page.getByRole('button', { name: 'Add Second release' }).boundingBox();
  expect(target?.width).toBeGreaterThanOrEqual(44); expect(target?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Continue as guest to payment' }).click();
  await expect(page.locator('.event-error')).toContainText('Test recovery');
  expect(submitted.items).toEqual([{ ticketTypeId: 2, quantity: 1 }, { ticketTypeId: 3, quantity: 1 }]);
  expect(submitted.expectedTotalCents).toBe(3565);
  await expect(page.getByLabel('Full name')).toHaveValue('Test Buyer');
  await page.getByRole('button', { name: 'Remove First release' }).click();
  await page.getByRole('button', { name: 'Remove Second release' }).click();
  await expect(page.getByRole('button', { name: /guest/ }).first()).toBeDisabled();
  await expect(page.getByText('Choose at least one ticket to continue.')).toBeVisible();
  await page.getByRole('button', { name: 'Add First release' }).click();
  await page.getByRole('button', { name: 'Add Second release' }).click();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('#tickets').screenshot({ path: '/tmp/tivorah-cart-desktop.png' });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
