"use client";
import { useEffect, useState } from "react";

// "Copy link" on a public shop page, so people can send the shop to someone. Copies the shop's
// own address (https://…/shops/<slug>), not the current tab or page number.
export function CopyShopLink({ slug, name }: { slug: string; name: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);
  const copy = async () => {
    const url = `${window.location.origin}/shops/${encodeURIComponent(slug)}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        // Older browsers and some in-app browsers: copy from a hidden field.
        const field = document.createElement("textarea");
        field.value = url; field.setAttribute("readonly", ""); field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select();
        const ok = document.execCommand("copy");
        field.remove();
        if (!ok) throw new Error("copy failed");
      }
      setState("copied");
    } catch { setState("failed"); }
  };
  return <>
    <button type="button" className={`shop-copy-button${state === "copied" ? " is-copied" : ""}`} onClick={() => void copy()} aria-label={state === "copied" ? `Link to ${name} copied` : `Copy link to ${name}`}>
      {state === "copied"
        ? <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        : <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>}
      <span className="shop-copy-label">{state === "copied" ? "Copied" : "Copy link"}</span>
    </button>
    <span className="sr-only" role="status" aria-live="polite">{state === "copied" ? "Shop link copied" : state === "failed" ? "Couldn’t copy the link. Copy it from the address bar instead." : ""}</span>
    {state === "failed" ? <span className="shop-copy-error" role="alert">Couldn’t copy. Use the address bar.</span> : null}
  </>;
}
