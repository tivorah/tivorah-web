"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";

// List + details screens (appointments, tickets): on wide screens the details sit
// beside the list; on phones and tablets they open as a bottom-sheet dialog when an
// item is chosen. The native modal <dialog> traps focus, closes on Escape, and focus
// returns to the item that opened it.

const COMPACT_QUERY = "(max-width: 900px)";
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
/** True on phones/tablets. Server renders the wide layout. */
export function useCompactLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(COMPACT_QUERY).matches, () => false);
}

export function DetailPane({ compact, open, onClose, label, className, paneRef, children }: {
  compact: boolean;
  /** Sheet visibility on compact screens (ignored on wide screens). */
  open: boolean;
  onClose: () => void;
  label: string;
  className: string;
  paneRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!compact || !element) return;
    if (open && !element.open) {
      opener.current = document.activeElement as HTMLElement | null;
      element.showModal();
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = overflow; };
    }
    if (!open && element.open) {
      element.close();
      opener.current?.focus();
    }
  }, [compact, open]);

  if (!compact) return <section ref={paneRef as RefObject<HTMLElement>} tabIndex={-1} className={className} aria-label={label}>{children}</section>;

  return <dialog
    ref={dialog}
    className="detail-sheet"
    aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
  >
    <div className={`detail-sheet-body ${className}`}>
      <div className="detail-sheet-bar">
        <span className="detail-sheet-handle" aria-hidden="true" />
        <button type="button" className="detail-sheet-close" aria-label="Close details" onClick={onClose}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      {open ? children : null}
    </div>
  </dialog>;
}
