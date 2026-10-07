import { expect, test } from '@playwright/test';
test('optional visit details remain readable and keep drafts when collapsed', async ({page}) => {
  await page.route('**/api/auth/get-session**', route => route.fulfill({json:{session:{id:'session',userId:'1',expiresAt:'2030-01-01T00:00:00Z'},user:{id:'1',email:'test@example.test',name:'Organiser'}}}));
  await page.route('**/api/v1/web/account', route => route.fulfill({json:{data:{id:1,firstName:'Organiser'}}}));
  await page.route('**/api/v1/user/participant-agreements', route => route.fulfill({json:{data:{version:'1.0',agreements:[{kind:'organizer'}]}}}));
  await page.goto('/business/create?type=event');
  const summary = page.getByText('Plan your visit · optional',{exact:true});
  await summary.click();
  await page.getByLabel('Age and ID requirements',{exact:true}).fill('18+ · Photo ID required');
  await page.getByLabel('Arrival, parking and doors',{exact:true}).fill('Doors open at 6pm. Accessible entry on the east side.');
  await page.getByLabel('Question 1',{exact:true}).fill('Can I bring a friend?');
  await page.getByLabel('Answer 1',{exact:true}).fill('Yes, each person needs a ticket.');
  await summary.click(); await summary.click();
  await expect(page.getByLabel('Question 1',{exact:true})).toHaveValue('Can I bring a friend?');
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await summary.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`/tmp/tivorah-event-visit-${width}.png`});
  }
  await page.evaluate(() => {document.documentElement.style.zoom='2';});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
