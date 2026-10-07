import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const fixtureRoute = `location-map-test-preview-${process.pid}`;
const fixture = resolve('app', fixtureRoute);
test.beforeAll(() => {
  mkdirSync(fixture, { recursive: true });
  writeFileSync(`${fixture}/page.tsx`, `import {LocationMap} from '../../components/discovery/location-map'; export default function Page(){return <main style={{maxWidth:900,margin:'80px auto',padding:18}}><h1>Location</h1><p>Adelaide, SA</p><LocationMap destination="Adelaide, SA" approximate /></main>}`);
});
test.afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
  rmSync(resolve('.next-dev/types/app', fixtureRoute), { recursive: true, force: true });
});
test('map loads only after reveal and can be hidden again', async ({ page }) => {
  let mapRequests = 0;
  await page.route('https://www.google.com/maps**', route => { mapRequests++; return route.fulfill({ contentType: 'text/html', body: '<p>Map test response</p>' }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${fixtureRoute}`);
  const reveal = page.getByRole('button', { name: 'View map', exact: true });
  await expect(reveal).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(mapRequests).toBe(0);
  await page.screenshot({ path: '/tmp/tivorah-map-phone.png', fullPage: true });
  await reveal.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect.poll(() => mapRequests).toBe(1);
  await expect(page.getByRole('link', { name: 'Get directions' })).toBeVisible();
  await page.getByRole('button', { name: 'Hide map' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(reveal).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/tivorah-map-desktop.png', fullPage: true });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await expect(reveal).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
