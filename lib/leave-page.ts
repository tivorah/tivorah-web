/**
 * Go to another page (Stripe Checkout, your tickets, signed in…) and keep the button that started it
 * busy until the browser has actually left, so it never flashes back to its idle label first.
 * `await` it inside the button's try block: the `finally` that clears the busy state only runs if the
 * person comes back to this page with the Back button (restored from the browser cache), so the
 * button works again then.
 */
export function leaveFor(url: string, { replace = false }: { replace?: boolean } = {}): Promise<void> {
  return new Promise((resolve) => {
    const back = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      window.removeEventListener("pageshow", back);
      resolve();
    };
    window.addEventListener("pageshow", back);
    if (replace) window.location.replace(url);
    else window.location.assign(url);
  });
}
