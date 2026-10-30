import { randomId } from "./random-id";

/**
 * One request id per user action, kept while the person resends the same thing (same order, same
 * details) and replaced when they change it or once it succeeds or is refused. Sent as the body's
 * idempotencyKey (and the Idempotency-Key header), so the API saves a resend once, even when the
 * first attempt was saved and only its answer was lost. Mirrors the app's utils/actionKey.ts.
 */
export function createActionKey() {
  let current: { signature: string; key: string } | null = null;
  return {
    for(signature: string) {
      if (current?.signature !== signature) current = { signature, key: randomId() };
      return current.key;
    },
    /** The action went through (or was refused): the next one is new. */
    done() { current = null; },
  };
}
