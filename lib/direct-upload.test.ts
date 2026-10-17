import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { put } from './direct-upload';

const original = globalThis.XMLHttpRequest;
class Request {
  static latest: Request;
  timeout = 0;
  status = 200;
  upload = {};
  onload = () => {};
  onerror = () => {};
  ontimeout = () => {};
  onabort = () => {};
  constructor() { Request.latest = this; }
  open() {}
  setRequestHeader() {}
  send() {}
  abort() { this.onabort(); }
  getResponseHeader() { return '"etag"'; }
}
afterEach(() => { globalThis.XMLHttpRequest = original; });
function setup() { globalThis.XMLHttpRequest = Request as unknown as typeof XMLHttpRequest; }
test('an aborted upload never starts', async () => {
  setup(); const controller = new AbortController(); controller.abort();
  await assert.rejects(put('https://storage.example', new Blob(), {}, () => {}, controller.signal), { name: 'AbortError' });
});
test('active transfer cancellation rejects immediately', async () => {
  setup(); const controller = new AbortController();
  const result = put('https://storage.example', new Blob(), {}, () => {}, controller.signal);
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
});
test('upload timeout is bounded and recoverable', async () => {
  setup(); const result = put('https://storage.example', new Blob(), {}, () => {});
  assert.equal(Request.latest.timeout, 120_000);
  Request.latest.ontimeout();
  await assert.rejects(result, /timed out/);
});
test('successful uploads remove the abort listener', async () => {
  setup(); const controller = new AbortController();
  let removed = false;
  const remove = controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.removeEventListener = (...args: Parameters<AbortSignal["removeEventListener"]>) => { removed = true; remove(...args); };
  const result = put('https://storage.example', new Blob(), {}, () => {}, controller.signal);
  Request.latest.onload();
  assert.equal(await result, 'etag');
  assert.equal(removed, true);
});
