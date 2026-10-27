import assert from "node:assert/strict";
import test from "node:test";
import { leaveFor } from "../leave-page";

function fakeWindow() {
  const listeners: ((event: { persisted: boolean }) => void)[] = [];
  const visits: string[] = [];
  (globalThis as any).window = {
    location: { assign: (url: string) => visits.push(`assign ${url}`), replace: (url: string) => visits.push(`replace ${url}`) },
    addEventListener: (_type: string, listener: (event: { persisted: boolean }) => void) => listeners.push(listener),
    removeEventListener: (_type: string, listener: (event: { persisted: boolean }) => void) => listeners.splice(listeners.indexOf(listener), 1),
  };
  return { listeners, visits };
}

test("goes to the page and stays busy until the browser has left", async () => {
  const { visits } = fakeWindow();
  let settled = false;
  void leaveFor("https://checkout.stripe.com/c/pay/x").then(() => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(visits, ["assign https://checkout.stripe.com/c/pay/x"]);
  assert.equal(settled, false); // the button keeps its busy state
});

test("lets go when Back brings this page back from the browser cache", async () => {
  const { listeners, visits } = fakeWindow();
  const left = leaveFor("/account/orders/5", { replace: true });
  listeners[0]({ persisted: false }); // a normal page load is not a return
  listeners[0]({ persisted: true });
  await left;
  assert.deepEqual(visits, ["replace /account/orders/5"]);
  assert.equal(listeners.length, 0);
});
