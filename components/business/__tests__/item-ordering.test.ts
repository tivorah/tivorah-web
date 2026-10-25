import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemOrderingPayload } from '../item-ordering';
import { creationPayload } from '../create-payload';

const form = (fields: Record<string, string>) => { const value = new FormData(); for (const [key, item] of Object.entries(fields)) value.set(key, item); return value; };

test('order requests with delivery send the fee in cents and the distance', () => {
  assert.deepEqual(itemOrderingPayload(form({ orderMode: 'request', offersPickup: 'on', offersDelivery: 'on', deliveryFee: '6.50', deliveryAreaKm: '15', readyInMinutes: '45', inventory: '30' })), {
    orderMode: 'request', offersPickup: true, offersDelivery: true, deliveryFeeCents: 650, deliveryAreaKm: 15, readyInMinutes: 45, inventory: 30,
  });
});

test('without delivery there is no fee or distance, and an unstated ready time stays empty', () => {
  const result = itemOrderingPayload(form({ orderMode: 'message', offersPickup: 'on', deliveryFee: '5', deliveryAreaKm: '10', readyInMinutes: '' }));
  assert.equal(result.offersDelivery, false);
  assert.equal(result.deliveryFeeCents, null);
  assert.equal(result.deliveryAreaKm, null);
  assert.equal(result.readyInMinutes, null);
});

test('a new item carries its ordering settings; services do not', () => {
  const fields = { title: 'Party jollof rice', description: 'Smoky tomato jollof with plantain.', category: 'Meals & takeaway', price: '18', orderMode: 'request', offersPickup: 'on', readyInMinutes: '45' };
  const item = creationPayload(form(fields), 'item', { suburb: 'Adelaide', state: 'SA', postcode: '5000' } as never, ['https://example.test/a.jpg'], 'retry-key', []) as Record<string, unknown>;
  assert.equal(item.orderMode, 'request');
  assert.equal(item.readyInMinutes, 45);
  const service = creationPayload(form({ ...fields, mode: 'at_provider' }), 'service', { suburb: 'Adelaide', state: 'SA', postcode: '5000' } as never, ['https://example.test/a.jpg'], 'retry-key', []) as Record<string, unknown>;
  assert.equal(service.orderMode, undefined);
});

test("no limit sends null stock, and wins over a typed number", () => {
  assert.equal(itemOrderingPayload(form({ orderMode: "request", offersPickup: "on", inventory: "5", inventoryUnlimited: "on" })).inventory, null);
  assert.equal(itemOrderingPayload(form({ orderMode: "request", offersPickup: "on", inventory: "5" })).inventory, 5);
});
