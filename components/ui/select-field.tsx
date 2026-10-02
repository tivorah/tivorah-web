"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

// Tivorah's form dropdown. Replaces the browser's native <select> popup with a
// consistent listbox (pill trigger, purple selection, search for long lists,
// bottom sheet on phones). A real form input carries the value, so FormData,
// `required`, `[name=…]` lookups and setCustomValidity keep working unchanged.
// For filter chips in discovery, use FilterSelect instead.

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectFieldProps = {
  /** Accessible name; repeat the visible label text. */
  label: string;
  options: SelectOption[];
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Shown when nothing is chosen. */
  placeholder?: string;
  requiredMessage?: string;
  /** Adds a search box; on by default for lists longer than 12. */
  searchable?: boolean;
  className?: string;
  /** Tooltip on the trigger, e.g. why it is disabled. */
  title?: string;
};

export function SelectField({
  label, options, name, id, value: controlled, defaultValue = "", onChange,
  required, disabled, placeholder = "Choose an option", requiredMessage, searchable, className, title,
}: SelectFieldProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const proxy = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const errorId = useId();
  const withSearch = searchable ?? options.length > 12;
  const selected = options.find((option) => option.value === value);
  const visible = query.trim() ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())) : options;

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    if (controlled === undefined) setUncontrolled(option.value);
    onChange?.(option.value);
    proxy.current?.setCustomValidity("");
    setError("");
    close();
  };

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  // Follow form.reset() like a native select does (uncontrolled use only).
  useEffect(() => {
    const form = proxy.current?.form;
    if (!form || controlled !== undefined) return;
    const onReset = () => { setUncontrolled(defaultValue); setError(""); };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [controlled, defaultValue]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const frame = requestAnimationFrame(() => {
      if (withSearch) search.current?.focus();
      else (panel.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]') ?? panel.current?.querySelector<HTMLElement>('[role="option"]:not([aria-disabled="true"])'))?.focus();
      panel.current?.querySelector('[role="option"][aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    });
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", onPointer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const optionElements = () => [...(panel.current?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? [])];

  const onPanelKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === "Tab") { close(false); return; }
    const items = optionElements();
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = current < 0 ? (event.key === "ArrowDown" ? 0 : items.length - 1) : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if ((event.key === "Home" || event.key === "End") && event.target !== search.current) {
      event.preventDefault();
      items[event.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (!withSearch && event.key.length === 1 && /\S/.test(event.key)) {
      // Typeahead: jump to the next option starting with the typed letter.
      const letter = event.key.toLowerCase();
      const start = current + 1;
      const match = [...items.slice(start), ...items.slice(0, start)].find((item) => item.textContent?.trim().toLowerCase().startsWith(letter));
      match?.focus();
    }
  };

  return (
    <span className={`select-field${error ? " is-invalid" : ""}${className ? ` ${className}` : ""}`}>
      <button
        ref={trigger}
        id={id}
        type="button"
        className="select-field-trigger"
        role="combobox"
        aria-label={`${label}: ${selected?.label ?? "not chosen"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        title={title}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => { if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !open) { event.preventDefault(); setOpen(true); } }}
      >
        <span className={selected ? "" : "select-field-placeholder"}>{selected?.label ?? placeholder}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={open ? "is-open" : ""}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <input
        ref={proxy}
        className="select-field-proxy"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => {}}
        onFocus={() => trigger.current?.focus()}
        onInvalid={(event) => {
          event.preventDefault();
          const input = event.currentTarget;
          setError(input.validity.valueMissing ? requiredMessage ?? `Choose ${label.toLowerCase()}.` : input.validationMessage);
          if (input.form?.querySelector(":invalid") === input) trigger.current?.focus();
        }}
      />
      {error && <span id={errorId} className="select-field-error" role="alert">{error}</span>}
      {open && (
        <>
          {/* The field usually sits inside a <label>; preventDefault stops a click
              here from re-activating the trigger through the label. */}
          <span className="select-field-backdrop" aria-hidden="true" onClick={(e) => { e.preventDefault(); close(); }} />
          <div ref={panel} className="select-field-panel" onKeyDown={onPanelKey} onClick={(e) => { if (!(e.target as HTMLElement).closest("button, input")) e.preventDefault(); }}>
            <p className="select-field-title">{label}</p>
            {withSearch && (
              <div className="select-field-search">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
                <input
                  ref={search}
                  type="search"
                  aria-label={`Search ${label.toLowerCase()}`}
                  aria-controls={listId}
                  placeholder={`Search ${label.toLowerCase()}`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); const first = visible.find((option) => !option.disabled); if (first) choose(first); } }}
                />
              </div>
            )}
            <div id={listId} role="listbox" aria-label={label} className="select-field-options">
              {visible.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  disabled={option.disabled}
                  onClick={() => choose(option)}
                >
                  <span>{option.label}</span>
                  {option.value === value ? <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg> : null}
                </button>
              ))}
              {!visible.length && <p role="status" className="select-field-empty">No matches. Try another word.</p>}
            </div>
          </div>
        </>
      )}
    </span>
  );
}
