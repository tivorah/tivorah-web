"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Side sheet: slides in from the right on desktop and up from the bottom on phones.
// Built on the native modal <dialog> (like the Hub picker) so focus is trapped,
// Escape closes it and focus returns to the control that opened it. Rendered in a
// portal so its fields never become part of the page's own <form>.
export function Sheet({ open, onClose, title, description, children, footer, wide = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Actions pinned to the bottom of the sheet (stay visible while the body scrolls). */
  footer?: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
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
  }, [open]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <dialog ref={dialog} className={`tv-sheet${wide ? " is-wide" : ""}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      {open ? <div className="tv-sheet-panel">
        <header className="tv-sheet-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button type="button" className="tv-sheet-close" onClick={onClose} aria-label="Close">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="tv-sheet-body">{children}</div>
        {footer ? <footer className="tv-sheet-foot">{footer}</footer> : null}
      </div> : null}
    </dialog>,
    document.body,
  );
}
