"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { TermsContent } from "../legal/terms-content";

// One checkbox, like sign-up. With `confirmAge` it also confirms the person is 18+.
export function BookingTermsConsent({ checked, onChange, confirmAge = false }: { checked: boolean; onChange: (checked: boolean) => void; confirmAge?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const checkboxId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const overflow = document.body.style.overflow;
    const triggerElement = trigger.current;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      triggerElement?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="event-check event-terms-check">
        <input id={checkboxId} type="checkbox" required checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>
          <label htmlFor={checkboxId}>{confirmAge ? "I am at least 18 and accept the " : "I have read and accept the "}</label>
          <button ref={trigger} type="button" className="event-text-button" onClick={() => setOpen(true)}>Terms of Use</button>
          . See our <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
        </span>
      </div>
      <dialog ref={dialog} className="event-terms-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); setOpen(false); }}>
        <div className="event-terms-dialog-header">
          <h2 id={titleId}>Terms of Use</h2>
          <button type="button" className="event-secondary" onClick={() => setOpen(false)} aria-label="Close Terms of Use">Close</button>
        </div>
        <div className="event-terms-dialog-body"><TermsContent inDialog /></div>
      </dialog>
    </>
  );
}
