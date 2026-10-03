"use client";
import { ReactNode, useEffect, useId, useRef } from "react";
import { useSheetGestures } from "../../hooks/use-sheet-gestures";
export function FilterDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const grip = useRef<HTMLDivElement>(null);
  useSheetGestures(dialog, grip, open, onClose);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      className="filter-dialog"
      ref={dialog}
      aria-labelledby={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div ref={grip} className="sheet-grabber" aria-hidden="true"><span /></div>
      <header>
        <div>
          <h2 id={title}>Refine your search</h2>
          <p>A few details to find the right fit.</p>
        </div>
        <button type="button" aria-label="Close filters" onClick={onClose}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      {open && children}
    </dialog>
  );
}
