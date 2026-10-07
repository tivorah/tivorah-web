import {test, expect} from '@playwright/test';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
const fixture=resolve('app/hold-cancel-test-preview');
test.beforeAll(()=>{mkdirSync(fixture,{recursive:true});writeFileSync(`${fixture}/page.tsx`, `'use client'; import {useState} from 'react'; import {CheckoutHoldBanner} from '../../components/discovery/checkout-hold-banner'; import '../events/events.css'; export default function Page(){const [held,setHeld]=useState(true);const [checkout]=useState({orderId:7,checkoutUrl:'https://checkout.stripe.com/test',expiresAt:new Date(Date.now()+600000).toISOString(),ticketSummary:'1 × Admission',totalCents:1500,currency:'AUD'});return <main className="event-booking" style={{maxWidth:480,margin:'100px auto',padding:16}}>{held?<CheckoutHoldBanner checkout={checkout} onExpire={()=>setHeld(false)} onCancel={async()=>{const res=await fetch('/api/v1/web/account/events/orders/7/cancel-checkout',{method:'POST'});if(!res.ok)throw new Error('Cancellation could not be confirmed. Try again.');setHeld(false)}}/>:<p role="status">Ticket hold cancelled</p>}</main>}`);});
test.afterAll(()=>{rmSync(fixture,{recursive:true,force:true});rmSync(resolve('.next-dev/types/app/hold-cancel-test-preview'),{recursive:true,force:true});});
test('keeps countdown on failure, then clears it when cancellation succeeds',async({page})=>{
 let attempts=0;await page.route('**/api/v1/web/account/events/orders/7/cancel-checkout',route=>route.fulfill({status:++attempts===1?503:200,json:{status:attempts>1,data:{outcome:'closed'}}}));
 await page.setViewportSize({width:390,height:844});await page.goto('/hold-cancel-test-preview');
 await expect(page.getByRole('region',{name:'Tickets held for you'})).toBeVisible();
 await page.screenshot({path:'/tmp/tivorah-hold-cancel-phone.png',fullPage:true});
 await page.getByRole('button',{name:'Cancel hold',exact:true}).click();
 await expect(page.getByText('Cancellation could not be confirmed. Try again.')).toBeVisible();
 await expect(page.getByRole('region',{name:'Tickets held for you'})).toBeVisible();
 await page.getByRole('button',{name:'Cancel hold',exact:true}).click();
 await expect(page.getByRole('region',{name:'Tickets held for you'})).toHaveCount(0);
 await expect(page.getByText('Ticket hold cancelled',{exact:true})).toBeVisible();
});
