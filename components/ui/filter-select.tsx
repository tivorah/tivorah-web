"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { categorySummary, selectedCategories, toggleCategory } from "../../lib/category-filter";
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
  /** Several choices at once; the value is a comma-separated list. The empty option clears it. */
  multiple?: boolean;
  /** An icon before each option (e.g. the app's category icons). */
  optionIcon?: (option: Option) => ReactNode;
};

/** Single- or multi-choice popover: roving option focus, typeahead, Escape and outside dismissal. */
export function FilterSelect({
  label,
  options,
  value,
  defaultValue = "",
  onChange,
  name,
  disabled,
  searchable,
  multiple = false,
  optionIcon,
}: Props) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const chosen = multiple ? selectedCategories(selected) : [];
  const isSelected = (optionValue: string) => multiple ? (optionValue ? chosen.includes(optionValue) : !chosen.length) : optionValue === selected;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  // On phones, a choice in the discovery chip row opens as a bottom sheet at the end of the page, so
  // the sideways-scrolling row can't clip it. (Inside the More filters dialog it stays inline.)
  const popover = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState(false);
  const within = () => popover.current ?? root.current;
  const show = () => {
    setSheet(!!root.current?.closest(".discovery-filter-toolbar") && window.matchMedia("(max-width: 600px)").matches);
    setOpen(true);
  };
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
          within()?.querySelector(
            '[role="option"][aria-selected="true"]',
          ) as HTMLElement | null
        )?.focus();
    });
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !popover.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open, searchable]);
  const panel = (
        <div ref={popover} className={`filter-select-popover${sheet ? " is-sheet" : ""}`} data-align-right={alignRight}>
          {sheet ? <SheetHeader label={label} /> : null}
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
            aria-multiselectable={multiple || undefined}
            className="filter-select-options"
          >
            {filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={isSelected(option.value)}
                tabIndex={-1}
                key={option.value}
                onClick={() => {
                  const next = multiple ? toggleCategory(selected, option.value) : option.value;
                  setInternal(next);
                  onChange?.(next);
                  // Multi-select stays open so several choices can be made in one go.
                  if (!multiple || !option.value) close(true);
                }}
              >
                {optionIcon ? optionIcon(option) : null}
                <span className="filter-select-label">{option.label}</span>
                <span aria-hidden="true">
                  {isSelected(option.value) ? "✓" : ""}
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
  );
  return (
    <div
      className="filter-select"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !popover.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
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
            show();
            return;
          }
          const items = Array.from(
            within()?.querySelectorAll<HTMLElement>('[role="option"]') ||
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
          within()
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
            within()?.querySelectorAll<HTMLElement>('[role="option"]');
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
        onClick={() => (open ? setOpen(false) : show())}
      >
        <span>
          {multiple
            ? categorySummary(chosen, options.find((option) => option.value === "")?.label || label)
            : options.find((option) => option.value === selected)?.label || label}
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
      {open && (sheet ? createPortal(panel, document.body) : panel)}
    </div>
  );
}

function SheetHeader({ label }: { label: string }) {
  return <><span className="filter-select-grabber" aria-hidden="true" /><p className="filter-select-title">{label}</p></>;
}


