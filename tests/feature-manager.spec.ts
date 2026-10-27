import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

// Admin → Features against a mocked API: on/off switches (confirmed), per-platform chips, the
// "Set up switches" banner for missing rows, and restoring a version from history.
const fixture = resolve('app/feature-manager-test-preview');
const shots = process.env.TIVORAH_SHOTS_DIR;
test.beforeAll(() => {
  mkdirSync(fixture, { recursive: true });
  writeFileSync(`${fixture}/page.tsx`, `'use client';
import { useEffect, useState } from 'react';
import FeatureManager, { type FeatureFlag, type FeatureHistoryRow, type FeatureSetup } from '../admin/feature-manager';
import '../admin/admin.css';
const request = async (path: string, init?: RequestInit) => { const response = await fetch(path, { ...init, headers: { 'content-type': 'application/json' } }); const body = await response.json(); if (!response.ok) throw new Error(body.message); return body.data; };
export default function Page() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]); const [setup, setSetup] = useState<FeatureSetup | null>(null); const [history, setHistory] = useState<Record<number, FeatureHistoryRow[]>>({}); const [busy, setBusy] = useState<number | 'setup' | null>(null);
  const load = async () => { setFlags(await request('/api/v1/admin/features')); setSetup(await request('/api/v1/admin/features/setup')); };
  useEffect(() => { void load(); }, []);
  const loadHistory = async (flag: FeatureFlag) => { const rows = await request('/api/v1/admin/features/' + flag.id + '/history'); setHistory(all => ({ ...all, [flag.id]: rows })); };
  return <main className="admin-dashboard" style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}><FeatureManager flags={flags} loading={false} busy={busy} history={history} setup={setup}
    update={async (flag, patch) => { setBusy(flag.id); try { const updated = await request('/api/v1/admin/features/' + flag.id, { method: 'PATCH', body: JSON.stringify(patch) }); setFlags(all => all.map(item => item.id === flag.id ? updated : item)); return true; } finally { setBusy(null); } }}
    toggleHistory={loadHistory}
    rollback={async (flag, version) => { const updated = await request('/api/v1/admin/features/' + flag.id + '/rollback', { method: 'POST', body: JSON.stringify({ version }) }); setFlags(all => all.map(item => item.id === flag.id ? updated : item)); await loadHistory(updated); }}
    setUpMissing={async () => { setBusy('setup'); await request('/api/v1/admin/features/setup', { method: 'POST' }); await load(); setBusy(null); }} /></main>;
}
`);
});
test.afterAll(() => { rmSync(fixture, { recursive: true, force: true }); rmSync(resolve('.next-dev/types/app/feature-manager-test-preview'), { recursive: true, force: true }); });

test('staff switch features on and off, per platform, and restore a version', async ({ page }) => {
  const base = { environment: 'production', presentation: 'hidden', maintenanceMessage: null, effectiveAt: null, payment: false };
  let flags: Record<string, unknown>[] = [
    { ...base, id: 1, key: 'events', name: 'Events', description: 'The Events tab, event pages and creating events.', enabled: true, version: 3, platforms: ['ios', 'android', 'web'], config: { group: 'Events' }, reaches: ['api', 'app', 'web'] },
    { ...base, id: 2, key: 'paid_tickets', name: 'Paid tickets', description: 'Selling tickets with Stripe checkout.', enabled: false, version: 1, platforms: ['ios', 'android', 'web'], config: { group: 'Events' }, reaches: ['api', 'app'], payment: true },
    { ...base, id: 3, key: 'offers', name: 'Offers', description: 'Not built yet.', enabled: false, version: 1, platforms: ['ios', 'android', 'web'], config: { group: 'Marketplace' }, reaches: [] },
  ];
  let missing = [{ key: 'polls', name: 'Polls', group: 'Community', enabledByDefault: true }];
  const patches: unknown[] = [];
  await page.route('**/api/v1/admin/features**', async route => {
    const url = new URL(route.request().url()); const method = route.request().method();
    if (url.pathname.endsWith('/features/setup')) {
      if (method === 'POST') { flags = [...flags, { ...base, id: 4, key: 'polls', name: 'Polls', enabled: true, version: 1, platforms: ['ios', 'android', 'web'], config: { group: 'Community' }, reaches: ['api', 'app'] }]; missing = []; }
      return route.fulfill({ json: { data: { environment: 'production', missing } } });
    }
    const history = url.pathname.match(/features\/(\d+)\/history$/);
    if (history) return route.fulfill({ json: { data: [{ id: 11, version: 4, action: 'updated', createdAt: '2026-10-27T01:00:00Z', snapshot: { enabled: false } }, { id: 10, version: 3, action: 'updated', createdAt: '2026-10-26T01:00:00Z', snapshot: { enabled: true } }] } });
    const rollback = url.pathname.match(/features\/(\d+)\/rollback$/);
    if (rollback) { const id = Number(rollback[1]); flags = flags.map(flag => flag.id === id ? { ...flag, enabled: true, version: Number(flag.version) + 1 } : flag); return route.fulfill({ json: { data: flags.find(flag => flag.id === id) } }); }
    const one = url.pathname.match(/features\/(\d+)$/);
    if (one && method === 'PATCH') { const id = Number(one[1]); const patch = route.request().postDataJSON(); patches.push(patch); flags = flags.map(flag => flag.id === id ? { ...flag, ...patch, version: Number(flag.version) + 1 } : flag); return route.fulfill({ json: { data: flags.find(flag => flag.id === id) } }); }
    return route.fulfill({ json: { data: flags } });
  });
  const dialogs: string[] = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); void dialog.accept(); });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await page.request.get('/feature-manager-test-preview')).status(), { timeout: 40000, intervals: [500, 1000, 2000] }).toBe(200);
  await page.goto('/feature-manager-test-preview');
  const events = page.locator('article').getByRole('switch', { name: 'Events' });
  await expect(events).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Not connected yet', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('1 feature has no switch yet')).toBeVisible();
  if (shots) await page.screenshot({ path: `${shots}/features-phone.png`, fullPage: true });

  // Hide a tab from the bottom nav: the feature stays on, the preview bar loses the tab.
  const preview = page.getByLabel('Bottom bar preview');
  await expect(preview).toHaveText('EventsProfile');
  const eventsTab = page.locator('.feature-nav').getByRole('switch', { name: 'Events' });
  await eventsTab.click();
  expect(dialogs.at(-1)).toContain('Hide Events from the app’s bottom nav');
  expect(patches.at(-1)).toEqual({ config: { group: 'Events', hideFromNav: true } });
  await expect(eventsTab).toHaveAttribute('aria-checked', 'false');
  await expect(preview).toHaveText('Profile');
  await expect(events).toHaveAttribute('aria-checked', 'true');
  await eventsTab.click();
  await expect(preview).toHaveText('EventsProfile');

  // Turning a feature off asks first, then shows what people see while it's off.
  await events.click();
  await expect(events).toHaveAttribute('aria-checked', 'false');
  expect(dialogs.at(-1)).toContain('Turn off Events? People on iPhone, Android and Web lose it');
  await expect(page.getByLabel('Message people see', { exact: false }).first()).toBeVisible();

  // Payment switches warn that sellers are told.
  await page.getByRole('switch', { name: 'Paid tickets' }).click();
  expect(dialogs.at(-1)).toContain('Connected sellers get a notice');

  // Off on iPhone only; the last platform can't be removed.
  const card = page.locator('article', { has: page.getByRole('heading', { name: 'Paid tickets' }) });
  await card.getByRole('button', { name: '✓ iPhone' }).click();
  await expect(card.getByRole('button', { name: 'iPhone', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(patches.at(-1)).toEqual({ platforms: ['android', 'web'] });
  await card.getByRole('button', { name: '✓ Android' }).click();
  await expect(card.getByRole('button', { name: '✓ Web' })).toBeDisabled();

  // Missing switches are created from the banner.
  await page.getByRole('button', { name: 'Set up switches' }).click();
  await expect(page.getByRole('switch', { name: 'Polls' })).toBeVisible();
  await expect(page.getByText('1 feature has no switch yet')).toHaveCount(0);

  // Restore an earlier version from history.
  const eventsCard = page.locator('article', { has: page.getByRole('heading', { name: 'Events' }) });
  await eventsCard.getByText('Details and history').click();
  await eventsCard.locator('li', { hasText: 'v3 ·' }).getByRole('button', { name: 'Restore' }).click();
  expect(dialogs.at(-1)).toContain('Restore Events to how it was in version 3 (on)');
  await expect(events).toHaveAttribute('aria-checked', 'true');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (shots) await page.screenshot({ path: `${shots}/features-desktop.png`, fullPage: true });
});
