"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DiscoveryKind } from "../../lib/api/discovery";
import { useDiscoveryFeatures } from "./features";

const storageKey = "tivorah-create-invitation-seen-v2";
let seenWithoutStorage = false;
const options = [
  { kind: "items", label: "Sell an item", href: "/business/create?type=item" },
  { kind: "services", label: "Offer a service", href: "/business/create?type=service" },
  { kind: "events", label: "Create an event", href: "/business/create?type=event" },
] as const;

export function CreatePromo({ kind }: { kind: Exclude<DiscoveryKind, "hubs"> }) {
  const { enabled, loading } = useDiscoveryFeatures();
  const available = !loading && enabled(kind);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!available || seenWithoutStorage) return;
    try { if (sessionStorage.getItem(storageKey)) return; } catch { /* Still show once when storage is unavailable. */ }
    let interacted = false;
    const cancel = () => { interacted = true; window.clearTimeout(timer); };
    const timer = window.setTimeout(() => {
      if (interacted || document.querySelector("dialog[open]") || document.activeElement?.matches("input, textarea, select")) return;
      seenWithoutStorage = true;
      try { sessionStorage.setItem(storageKey, "1"); } catch { /* Storage can be disabled. */ }
      setOpen(true);
    }, 1800);
    window.addEventListener("pointerdown", cancel, { once: true });
    window.addEventListener("keydown", cancel, { once: true });
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("pointerdown", cancel); window.removeEventListener("keydown", cancel); window.removeEventListener("wheel", cancel); };
  }, [available]);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    if (!element) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      restoreFocus.current?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);
  const show = () => {
    seenWithoutStorage = true;
    try { sessionStorage.setItem(storageKey, "1"); } catch { /* Storage can be disabled. */ }
    setOpen(true);
  };
  const ordered = [...options].sort((a, b) => Number(b.kind === kind) - Number(a.kind === kind));
  // Hold the button's space while feature flags load so the hero does not jump.
  if (loading) return <span className="create-promo-trigger create-promo-skeleton tivorah-shimmer" aria-hidden="true" />;
  if (!available) return null;
  return <><button type="button" className="create-promo-trigger" onClick={show}>Create on Tivorah <span aria-hidden="true">↗</span></button><dialog ref={dialog} className="create-promo-dialog" aria-labelledby="create-promo-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
    <div className="create-promo-head"><Image src="/tivorah-mark.png" alt="" width={32} height={32} /><button type="button" className="create-promo-close" aria-label="Close invitation" onClick={close}>×</button></div>
    <h2 id="create-promo-title">Bring your idea to Tivorah.</h2>
    <p className="create-promo-intro">What would you like to create?</p>
    <div className="create-promo-choices">{ordered.map((option) => <Link key={option.kind} className={`create-promo-choice${option.kind === kind ? " is-featured" : ""}`} href={option.href} onClick={close}><span>{option.label}</span><span className="create-promo-arrow" aria-hidden="true">→</span></Link>)}</div>
    <button type="button" className="create-promo-later" onClick={close}>Keep exploring</button>
  </dialog></>;
}
