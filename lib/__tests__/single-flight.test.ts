import assert from "node:assert/strict";
import test from "node:test";
import { singleFlight } from "../single-flight";

test("a double click in the same frame sends one request", async () => {
  let calls = 0;
  let finish!: () => void;
  const busy: boolean[] = [];
  const run = singleFlight({ current: false }, () => { calls += 1; return new Promise<string>((resolve) => { finish = () => resolve("done"); }); }, (value) => busy.push(value));
  const first = run();
  const second = run();
  assert.equal(calls, 1);
  finish();
  assert.equal(await first, "done");
  assert.equal(await second, undefined);
  assert.deepEqual(busy, [true, false]);
});

test("the next click runs once the first finishes, even after a failure", async () => {
  let calls = 0;
  const run = singleFlight({ current: false }, async (fail: boolean) => { calls += 1; if (fail) throw new Error("offline"); return 1; });
  await assert.rejects(run(true), /offline/);
  assert.equal(await run(false), 1);
  assert.equal(calls, 2);
});
