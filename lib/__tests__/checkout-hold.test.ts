import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHoldRemaining, holdRemainingMs, verifiedStripeCheckoutUrl } from '../checkout-hold';

const now = Date.parse('2026-10-07T10:00:00Z');

test('hold countdown never goes negative and treats bad times as ended', () => {
  assert.equal(holdRemainingMs('2026-10-07T10:10:00Z', now), 600_000);
  assert.equal(holdRemainingMs('2026-10-07T09:00:00Z', now), 0);
  assert.equal(holdRemainingMs(null, now), 0);
  assert.equal(holdRemainingMs('nope', now), 0);
});

test('hold countdown formats minutes and seconds, rounding up', () => {
  assert.equal(formatHoldRemaining(600_000), '10:00');
  assert.equal(formatHoldRemaining(65_400), '1:06');
  assert.equal(formatHoldRemaining(0), '0:00');
});

test('only Stripe-hosted https checkout links are followed', () => {
  assert.equal(verifiedStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_1'), 'https://checkout.stripe.com/c/pay/cs_test_1');
  assert.equal(verifiedStripeCheckoutUrl('http://checkout.stripe.com/c/pay/cs_test_1'), null);
  assert.equal(verifiedStripeCheckoutUrl('https://checkout.stripe.com.evil.example/pay'), null);
  assert.equal(verifiedStripeCheckoutUrl('javascript:alert(1)'), null);
  assert.equal(verifiedStripeCheckoutUrl('not a url'), null);
});
