// Relative, same-origin product destinations only; never accept auth or external redirects.
export function safeReturnPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/account";
  try {
    const url = new URL(value, "https://tivorah.com");
    if (
      url.origin !== "https://tivorah.com" ||
      !/^\/(events|event-groups|shop|shops|services|hubs|account|business)(\/|$)/.test(
        url.pathname,
      )
    )
      return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}
