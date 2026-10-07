import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const fixture = resolve('app/payment-countries-test-preview');
test.beforeAll(() => {
  mkdirSync(fixture, { recursive: true });
  writeFileSync(`${fixture}/page.tsx`, `'use client'; import PaymentCountries from '../admin/payment-countries'; import '../admin/admin.css'; const request = async (path: string, init?: RequestInit) => { const response = await fetch(path, init); const body = await response.json(); if (!response.ok) throw new Error(body.message); return body.data; }; export default function Page() { return <main style={{maxWidth:1000,margin:'80px auto 0',padding:20}}><PaymentCountries request={request}/></main>; }`);
});
test.afterAll(() => { rmSync(fixture, { recursive: true, force: true }); rmSync(resolve('.next-dev/types/app/payment-countries-test-preview'), { recursive: true, force: true }); });
test('admin can pause all seller countries and recover from a concurrent edit', async ({ page }) => {
  let policy = { version: 0, environment: 'development', countries: ['AU'], options: [{code:'AU',name:'Australia'},{code:'GB',name:'United Kingdom'}] };
  let conflict = false;
  await page.route('**/api/v1/admin/payment-countries', async route => {
    if (route.request().method() === 'PUT') {
      if (conflict) return route.fulfill({status:409,json:{message:'Country settings changed. Refresh before saving again.'}});
      const input = route.request().postDataJSON(); expect(input.version).toBe(policy.version);
      policy = {...policy, countries: input.countries, version:policy.version+1};
    }
    return route.fulfill({json:{data:policy}});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/payment-countries-test-preview');
  await expect(page.getByRole('heading',{name:'Seller payment countries'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Save payment countries'})).toBeDisabled();
  await page.screenshot({path:'/tmp/tivorah-country-admin-phone.png',fullPage:true});
  await page.getByRole('button',{name:'Remove AU from payment countries'}).click();
  await expect(page.getByText('No countries selected:',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Save payment countries'}).click();
  await expect(page.getByRole('status')).toHaveText('Seller payment countries saved.');
  expect(policy.countries).toEqual([]);
  await page.getByRole('combobox',{name:'Add a seller country'}).click();
  await page.getByRole('option',{name:'Australia',exact:true}).click();
  await page.getByRole('button',{name:'Add country',exact:true}).click();
  conflict = true;
  await page.getByRole('button',{name:'Save payment countries'}).click();
  await expect(page.getByRole('region',{name:'Seller payment countries'}).getByRole('alert')).toContainText('Country settings changed');
  await expect(page.getByRole('button',{name:'Save payment countries'})).toBeDisabled();
  await page.getByRole('button',{name:'Reload country settings'}).click();
  await expect(page.getByText('No countries selected:',{exact:false})).toBeVisible();
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'/tmp/tivorah-country-admin-desktop.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button',{name:'Save payment countries'})).toBeVisible();
});
