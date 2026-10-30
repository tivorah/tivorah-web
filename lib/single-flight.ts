/**
 * One run at a time for a button's action. The lock is checked and set synchronously, before the
 * first await, so a double click in one frame can't start a second request; React state only
 * updates on the next render. Calls made while a run is in flight are ignored (resolve undefined).
 */
export function singleFlight<A extends unknown[], R>(
  lock: { current: boolean },
  action: (...args: A) => Promise<R> | R,
  onBusy?: (busy: boolean) => void,
) {
  return async (...args: A): Promise<R | undefined> => {
    if (lock.current) return undefined;
    lock.current = true;
    onBusy?.(true);
    try {
      return await action(...args);
    } finally {
      lock.current = false;
      onBusy?.(false);
    }
  };
}
