import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingStatusText, owesPayment } from '../../../lib/booking-status';

const completed = { status: 'completed', endsAt: '2026-01-01T10:00:00Z', paymentDueAt: null, paymentTiming: 'after_service' as const, totalCents: 5200, stripePaymentIntentId: null };

test('a completed, unpaid pay-after-service appointment is owed', () => {
  assert.equal(owesPayment(completed), true);
  assert.equal(bookingStatusText(completed, 'customer'), 'Payment due');
  assert.equal(bookingStatusText(completed, 'provider'), 'Waiting for payment');
});

test('nothing is owed once paid, before completion, for upfront or free bookings', () => {
  assert.equal(owesPayment({ ...completed, stripePaymentIntentId: 'pi_1' }), false);
  assert.equal(owesPayment({ ...completed, status: 'confirmed' }), false);
  assert.equal(owesPayment({ ...completed, paymentTiming: 'upfront' }), false);
  assert.equal(owesPayment({ ...completed, totalCents: 0 }), false);
  assert.equal(bookingStatusText({ ...completed, stripePaymentIntentId: 'pi_1' }, 'customer'), 'Completed');
});

test("the API's paymentDue flag wins when present", () => {
  assert.equal(owesPayment({ ...completed, paymentDue: false }), false);
});
