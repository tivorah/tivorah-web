import { expect, test } from '@playwright/test';

test('organiser tax settings preserve input after failure, save a declaration, and fit phone and zoom', async ({ page }) => {
  await page.route('**/api/auth/get-session**', route => route.fulfill({ json: { session: { id: 'session', userId: '1', expiresAt: '2030-01-01T00:00:00Z' }, user: { id: '1', email: 'test@example.test', name: 'Seller' } } }));
  await page.route('**/api/v1/web/account', route => route.fulfill({ json: { data: { id: 1, firstName: 'Seller' } } }));
  await page.route('**/api/v1/payments/connect/account', route => route.fulfill({ json: { data: { connected: false, chargesEnabled: false, payoutsEnabled: false, currentPartnerAgreementVersion: '1.0', partnerAgreementVersion: '1.0' } } }));
  let profile: Record<string, unknown> | null = null;
  let failed = false;
  await page.route('**/api/v1/payments/event-tax-profile', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { data: { profile, suggestedLegalName: profile ? null : 'Stripe Legal Seller' } } });
    if (!failed) { failed = true; return route.fulfill({ status: 503, json: { status: false, message: 'Could not save. Try again.' } }); }
    const input = route.request().postDataJSON();
    expect(input).toEqual({ legalName: 'Example Seller', abn: '51 824 753 556', gstRegistered: true, declarationAccepted: true, declarationVersion: '1.1' });
    profile = { ...input, declaredAt: '2026-10-06T00:00:00Z' };
    return route.fulfill({ json: { data: { profile } } });
  });
  await page.goto('/business/payouts#event-tax');
  const settings = page.getByRole('region', { name: 'Seller tax settings' });
  await expect(settings.getByLabel('Seller’s legal name')).toHaveValue('Stripe Legal Seller');
  await expect(settings.getByLabel('ABN', { exact: true })).toHaveValue('');
  await expect(settings.getByRole('checkbox')).not.toBeChecked();
  await settings.getByLabel('Seller’s legal name').fill('Example Seller');
  await settings.getByLabel('ABN', { exact: true }).fill('51 824 753 556');
  await settings.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Yes', exact: true }).click();
  await settings.getByRole('checkbox').check();
  const workspace = page.getByRole('navigation', { name: 'Payout workspace' });
  await workspace.getByRole('button', { name: 'Payments', exact: true }).click();
  await expect(settings).toHaveCount(0);
  await workspace.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(settings.getByLabel('Seller’s legal name')).toHaveValue('Example Seller');
  await expect(settings.getByRole('checkbox')).toBeChecked();
  await settings.getByRole('button', { name: 'Save tax details' }).click();
  await expect(settings.getByRole('alert')).toContainText('Please try again');
  await expect(settings.getByLabel('Seller’s legal name')).toHaveValue('Example Seller');
  await settings.getByRole('button', { name: 'Save tax details' }).click();
  await expect(settings.getByRole('status')).toContainText('Tax details saved');
  await page.screenshot({ path: '/tmp/tivorah-event-tax-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/tivorah-event-tax-phone.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/tivorah-event-tax-zoom.png', fullPage: true });
});
