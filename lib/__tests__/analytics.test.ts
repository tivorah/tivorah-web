import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeUrl } from "../analytics";

test("analytics URLs never carry tokens, queries or fragments", () => {
  assert.equal(sanitizeUrl("https://tivorah.com/event-refund/9f8e7d6c5b4a39281706f5e4d3c2b1a0?x=1"), "https://tivorah.com/event-refund/:token");
  assert.equal(sanitizeUrl("https://tivorah.com/event-orders/42?token=abc#access=secret"), "https://tivorah.com/event-orders/42");
  assert.equal(sanitizeUrl("/event-ticket-transfer/12#k=Zm9vYmFyYmF6cXV4cXV1eA"), "/event-ticket-transfer/12");
  assert.equal(sanitizeUrl("/hubs/invite/3b241101-e2bb-4255-8caf-4136c566a962"), "/hubs/invite/:token");
  assert.equal(sanitizeUrl("https://tivorah.com/events/7"), "https://tivorah.com/events/7");
});
