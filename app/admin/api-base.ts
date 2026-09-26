const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const isLocalDevHost = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

// Admin auth relies on SameSite=Lax session and two-factor cookies, which the
// browser only sends when the admin page and the API share a site. In local
// development NEXT_PUBLIC_API_URL usually holds the Mac's LAN IP (so phones
// can reach the API), while the admin page may be opened on localhost; those
// are different sites, so MFA verification and identity checks arrive without
// cookies and bounce back to sign-in. When both hosts are local dev hosts,
// reach the API through the same hostname the page was opened on. Production
// URLs are never rewritten.
export function adminApiBase() {
  if (!configured || typeof window === "undefined") return configured;
  try {
    const url = new URL(configured);
    const pageHost = window.location.hostname;
    if (url.hostname === pageHost || !isLocalDevHost(url.hostname) || !isLocalDevHost(pageHost)) return configured;
    url.hostname = pageHost;
    return url.origin;
  } catch {
    return configured;
  }
}
