"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "./notice-dialog.css";

const subscribeNothing = () => () => {};

/**
 * A centred "Got it" notice, like the app's GotItModal: one message and one button. Built on the
 * native modal <dialog> so focus is trapped, Escape closes it and focus returns to the opener.
 */
export function NoticeDialog({ open, onClose, title, body, icon = "i" }: { open: boolean; onClose: () => void; title: string; body: string; icon?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current = document.activeElement as HTMLElement | null;
      element.showModal();
    } else if (!open && element.open) {
      element.close();
      opener.current?.focus();
    }
  }, [open, mounted]);

  if (!mounted) return null;
  return createPortal(
    <dialog ref={dialog} className="notice-dialog" aria-labelledby={titleId} aria-describedby={bodyId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      {open ? <div className="notice-dialog-card">
        <span className="notice-dialog-icon" aria-hidden="true">{icon}</span>
        <h2 id={titleId}>{title}</h2>
        <p id={bodyId}>{body}</p>
        <button type="button" className="notice-dialog-primary" onClick={onClose} autoFocus>Got it</button>
      </div> : null}
    </dialog>,
    document.body,
  );
}
