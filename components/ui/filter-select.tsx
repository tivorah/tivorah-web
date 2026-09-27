"use client";
import { useEffect, useId, useRef, useState } from "react";
type Option = { value: string; label: string };
type Props = {
  label: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  searchable?: boolean;
};

/** Single-choice popover: roving option focus, typeahead, Escape and outside dismissal. */
export function FilterSelect({
  label,
  options,
  value,
  defaultValue = "",
  onChange,
  name,
  disabled,
  searchable,
}: Props) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const box = root.current?.getBoundingClientRect();
    setAlignRight(!!box && box.left + 320 > window.innerWidth - 18);
    const frame = requestAnimationFrame(() => {
      if (searchable) search.current?.focus();
      else
        (
          root.current?.querySelector(
            '[role="option"][aria-selected="true"]',
          ) as HTMLElement | null
        )?.focus();
    });
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open, searchable]);
  return (
    <div
      className="filter-select"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          if (!open) {
            setOpen(true);
            return;
          }
          const items = Array.from(
            root.current?.querySelectorAll<HTMLElement>('[role="option"]') ||
              [],
          );
          const current = items.indexOf(document.activeElement as HTMLElement);
          items[
            current < 0
              ? event.key === "ArrowDown"
                ? 0
                : items.length - 1
              : (current +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  items.length) %
                items.length
          ]?.focus();
        }
        if (
          open &&
          !searchable &&
          event.key.length === 1 &&
          event.key !== " "
        ) {
          const match = filtered.findIndex((option) =>
            option.label.toLowerCase().startsWith(event.key.toLowerCase()),
          );
          root.current
            ?.querySelectorAll<HTMLElement>('[role="option"]')
            [match]?.focus();
        }
        if (
          open &&
          event.target !== search.current &&
          ["Home", "End"].includes(event.key)
        ) {
          event.preventDefault();
          const items =
            root.current?.querySelectorAll<HTMLElement>('[role="option"]');
          items?.[event.key === "Home" ? 0 : items.length - 1]?.focus();
        }
      }}
    >
      {name && (
        <input type="hidden" name={name} value={selected} disabled={disabled} />
      )}
      <button
        ref={trigger}
        className="filter-select-trigger"
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="listbox"
        disabled={disabled}
        data-active={!!selected}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {options.find((option) => option.value === selected)?.label || label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="filter-select-popover" data-align-right={alignRight}>
          {searchable && (
            <div className="filter-select-search">
              <input
                ref={search}
                aria-label={`Search ${label.toLowerCase()}`}
                placeholder={`Find ${label.toLowerCase()}…`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          )}
          <div
            id={id}
            role="listbox"
            aria-label={label}
            className="filter-select-options"
          >
            {filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === selected}
                tabIndex={-1}
                key={option.value}
                onClick={() => {
                  setInternal(option.value);
                  onChange?.(option.value);
                  close(true);
                }}
              >
                <span>{option.label}</span>
                <span aria-hidden="true">
                  {option.value === selected ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <p role="status" className="filter-select-empty">
              No matches. Try another word.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
