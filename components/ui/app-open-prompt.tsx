"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { appLinkFor, appPlatform, launchApp, storeFor, type AppLinkPage } from "../../lib/open-app";
import "./app-open-prompt.css";

/** Asked once per browser tab: "Not now" (or opening the app) isn't asked again on the next link. */
const SEEN_KEY = "tivorah-app-prompt-seen";
const seen = () => { try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; } };
const markSeen = () => { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: asked again next page at most */ } };

/**
 * Someone opens a link to a profile, event or Hub on their phone (from Instagram, a chat, an
 * email…): a card asks whether to open it in the Tivorah app. Nothing opens until they tap Open
 * Tivorah; Not now keeps them on the web page. If the app isn't on the phone, the card offers the
 * download. Not shown on computers, inside the app, or once they've answered in this tab.
 */
export function AppOpenPrompt() {
  const pathname = usePathname();
  const [page, setPage] = useState<AppLinkPage | null>(null);
  const [state, setState] = useState<"ask" | "opening" | "missing">("ask");
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<(() => void) | null>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const link = appLinkFor(pathname ?? "");
    const query = new URLSearchParams(window.location.search);
    // The page's own Open in Tivorah panel shows Android's "not installed" return (?app=missing).
    if (!link || seen() || appPlatform() === "desktop" || document.documentElement.hasAttribute("data-in-app") || query.get("app") === "missing" || query.get("fromApp") === "1") return;
    // A moment after the page shows, so they see where the link went first.
    const timer = window.setTimeout(() => setPage(link), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const element = dialog.current;
    if (!page || !element || element.open) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [page]);

  useEffect(() => () => cancel.current?.(), []);

  const close = () => {
    markSeen();
    cancel.current?.();
    dialog.current?.close();
    setPage(null);
    setState("ask");
  };

  const open = () => {
    markSeen();
    if (!page) return;
    setState("opening");
    const stopLaunch = launchApp(page.appPath, () => setState("missing"));
    // The app (or the store) opened: when they come back to the browser, the card has gone.
    let left = false;
    const onVisibility = () => {
      if (document.hidden) { left = true; return; }
      if (left) close();
    };
    document.addEventListener("visibilitychange", onVisibility);
    cancel.current = () => { stopLaunch(); document.removeEventListener("visibilitychange", onVisibility); };
  };

  if (!page) return null;
  const store = storeFor(appPlatform());
  return createPortal(
    <dialog ref={dialog} className="app-open-prompt" aria-labelledby={titleId} aria-describedby={bodyId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="app-open-prompt-card">
        <span className="app-open-prompt-mark" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
          <img src="/tivorah-mark.png" alt="" width={56} height={56} />
        </span>
        {state === "missing" ? <>
          <h2 id={titleId}>Tivorah isn’t on this phone yet</h2>
          <p id={bodyId}>Get the app, then open this link again to go straight there.</p>
          {store
            ? <a className="app-open-prompt-primary" href={store} onClick={markSeen}>Get Tivorah</a>
            : <Link className="app-open-prompt-primary" href="/#updates" onClick={close}>Get notified when the app launches</Link>}
        </> : <>
          <h2 id={titleId}>{page.title}</h2>
          <p id={bodyId}>{page.body}</p>
          <button type="button" className="app-open-prompt-primary" onClick={open} disabled={state === "opening"} aria-busy={state === "opening" || undefined}>
            {state === "opening" ? "Opening Tivorah…" : "Open Tivorah"}
          </button>
        </>}
        <button type="button" className="app-open-prompt-later" onClick={close}>Not now</button>
      </div>
    </dialog>,
    document.body,
  );
}
