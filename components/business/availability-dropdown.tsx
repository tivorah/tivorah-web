"use client";

import { useEffect, useId, useRef, useState } from "react";

export function AvailabilityDropdown({ status, disabled, onChange }: {
  status: string;
  disabled: boolean;
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const button = trigger.current!;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    function position() {
      const anchor = button.getBoundingClientRect();
      const height = element.getBoundingClientRect().height;
      element.style.width = `${Math.min(anchor.width, window.innerWidth - 24)}px`;
      element.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - element.offsetWidth - 12))}px`;
      element.style.top = `${Math.max(12, anchor.bottom + height + 8 < window.innerHeight ? anchor.bottom + 8 : anchor.top - height - 8)}px`;
    }
    position();
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("resize", position);
      element.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      button.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <button ref={trigger} className="business-availability-trigger" type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}>
      {disabled ? "Updating availability…" : "Change availability"}<span aria-hidden="true">⌄</span>
    </button>
    <dialog ref={dialog} id={id} className="business-availability-dropdown" aria-label="Change availability" onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) setOpen(false);
    }}>
      {[{ value: "active", label: "Available" }, { value: "reserved", label: "Reserved" }, { value: "sold", label: "Sold" }].map(option => <button type="button" key={option.value} aria-pressed={status === option.value} onClick={() => { setOpen(false); if (status !== option.value) onChange(option.value); }}>{option.label}<span aria-hidden="true">{status === option.value ? "✓" : ""}</span></button>)}
    </dialog>
  </>;
}
