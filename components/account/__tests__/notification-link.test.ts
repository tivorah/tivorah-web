import assert from "node:assert/strict";
import test from "node:test";
import { notificationLink } from "../notification-link";

test("item order notifications open the right orders page", () => {
  assert.deepEqual(notificationLink({ category: "marketplace", deepLink: "/market/orders?role=seller" }), { href: "/business/orders", label: "View order" });
  assert.deepEqual(notificationLink({ category: "marketplace", deepLink: "/market/orders?role=buyer" }), { href: "/account/item-orders", label: "View order" });
});

test("opens the exact order when the notification names it", () => {
  assert.equal(notificationLink({ category: "marketplace", deepLink: "/market/orders?role=seller&orderId=41" }).href, "/business/orders?order=41");
  assert.equal(notificationLink({ category: "marketplace", deepLink: "/market/orders?role=buyer&orderId=41" }).href, "/account/item-orders?order=41");
  assert.equal(notificationLink({ category: "marketplace", deepLink: "/market/orders?role=buyer&orderId=x" }).href, "/account/item-orders");
});

test("other notifications keep the category links", () => {
  assert.equal(notificationLink({ category: "events" }).href, "/account/tickets");
  assert.equal(notificationLink({ category: "marketplace", deepLink: "/market/bookings" }).href, "/account/bookings");
  assert.equal(notificationLink({ category: "safety", deepLink: null }).href, "/contact");
});
