"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { DayPicker } from "react-day-picker";
import { enAU } from "react-day-picker/locale";

// Tivorah's date (and date + time) picker. It replaces the browser's native
// date control with a consistent calendar, while a real form input carries the
// value in the native format (YYYY-MM-DD or YYYY-MM-DDTHH:mm) so FormData,
// `required`, `[name=…]` lookups and setCustomValidity keep working unchanged.
// The header opens year and month grids (no native <select> lists), so jumping
// decades for a date of birth is two taps.

type Kind = "date" | "datetime";
type View = "days" | "years" | "months" | "time";

export type DateFieldProps = {
  name: string;
  /** Accessible name; repeat the visible label text. */
  label: string;
  kind?: Kind;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Earliest/latest selectable day, as YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** Month the calendar opens on when nothing is selected, as YYYY-MM-DD. */
  openTo?: string;
  placeholder?: string;
  /** Message when a required field is left empty. */
  requiredMessage?: string;
  /** Extra rule, e.g. minimum age; return a message, or "" when valid. */
  validate?: (value: string) => string;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const toDateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parse(value: string | undefined, kind: Kind): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return undefined;
  const [, y, m, d, h = "0", min = "0"] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), kind === "datetime" ? Number(h) : 0, kind === "datetime" ? Number(min) : 0);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function serialise(date: Date | undefined, kind: Kind) {
  if (!date) return "";
  return kind === "datetime" ? `${toDateValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}` : toDateValue(date);
}

function display(date: Date, kind: Kind) {
  return kind === "datetime"
    ? date.toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

const monthNames = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString("en-AU", { month: "short" }));
const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export function DateField({
  name, label, kind = "date", defaultValue, value: controlled, onChange,
  required, disabled, min, max, openTo, placeholder, requiredMessage, validate,
}: DateFieldProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlled ?? uncontrolled;
  const selected = parse(value, kind);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const [error, setError] = useState("");
  const [month, setMonth] = useState<Date>(selected ?? parse(openTo, "date") ?? new Date());
  const trigger = useRef<HTMLButtonElement>(null);
  const proxy = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const errorId = useId();
  const minDate = parse(min, "date");
  const maxDate = parse(max, "date");
  const firstYear = minDate?.getFullYear() ?? 1900;
  const lastYear = maxDate?.getFullYear() ?? new Date().getFullYear() + 10;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  const commit = (next: Date | undefined) => {
    const serialised = serialise(next, kind);
    if (controlled === undefined) setUncontrolled(serialised);
    onChange?.(serialised);
    const message = serialised && validate ? validate(serialised) : "";
    proxy.current?.setCustomValidity(message);
    setError(message);
  };

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    // Keep the whole calendar on screen when the field is near the bottom.
    panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Year grid opens scrolled to the visible year, with focus on it.
  useEffect(() => {
    if (!open || view === "days") return;
    const current = panel.current?.querySelector<HTMLButtonElement>(".date-field-grid [aria-current='true']");
    current?.scrollIntoView({ block: "center" });
    current?.focus();
  }, [open, view]);

  // Escape closes (or steps back from the year/month grid); Tab cycles inside the open panel.
  const onPanelKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (view !== "days") setView("days");
      else close();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), select:not([disabled]), [tabindex='0']")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const pickDay = (day: Date | undefined) => {
    if (!day) return;
    if (kind === "datetime") {
      const next = new Date(day);
      next.setHours(selected?.getHours() ?? 18, selected?.getMinutes() ?? 0, 0, 0);
      commit(next);
    } else {
      commit(day);
      close();
    }
  };

  const setTime = (hour12: number, minute: number, pm: boolean) => {
    const base = selected ? new Date(selected) : new Date(month.getFullYear(), month.getMonth(), 1);
    base.setHours((hour12 % 12) + (pm ? 12 : 0), minute, 0, 0);
    commit(base);
  };

  const monthOutOfRange = (year: number, index: number) =>
    (minDate && new Date(year, index + 1, 0) < minDate) || (maxDate && new Date(year, index, 1) > maxDate);
  const canStep = (delta: number) => {
    const target = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    return !monthOutOfRange(target.getFullYear(), target.getMonth());
  };

  const hour24 = selected?.getHours() ?? 18;
  const hour12 = hour24 % 12 || 12;
  const minute = selected ? selected.getMinutes() - (selected.getMinutes() % 5) : 0;
  const pm = hour24 >= 12;
  const caption = month.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const timeLabel = `${hour12}:${pad(minute)} ${pm ? "pm" : "am"}`;
  const headerText = view === "months" ? String(month.getFullYear()) : view === "time" ? "Choose a time" : caption;

  return (
    <span className={`date-field${error ? " is-invalid" : ""}`}>
      <button
        ref={trigger}
        type="button"
        className="date-field-trigger"
        aria-label={`${label}: ${selected ? display(selected, kind) : "not chosen"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onClick={() => {
          if (!open) { setMonth(selected ?? parse(openTo, "date") ?? new Date()); setView("days"); }
          setOpen((v) => !v);
        }}
      >
        <span className={selected ? "" : "date-field-placeholder"}>
          {selected ? display(selected, kind) : placeholder ?? (kind === "datetime" ? "Choose date and time" : "Choose a date")}
        </span>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
      </button>
      <input
        ref={proxy}
        className="date-field-proxy"
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
          setError(input.validity.valueMissing ? requiredMessage ?? (kind === "datetime" ? "Choose a date and time." : "Choose a date.") : input.validationMessage);
          if (input.form?.querySelector(":invalid") === input) trigger.current?.focus();
        }}
      />
      {error && <span id={errorId} className="date-field-error" role="alert">{error}</span>}
      {open && (
        <>
          {/* The field usually sits inside a <label>; preventDefault stops a
              click here from re-activating the trigger through the label. */}
          <span className="date-field-backdrop" aria-hidden="true" onClick={(e) => { e.preventDefault(); close(); }} />
          <div
            ref={panel}
            id={panelId}
            className="date-field-panel"
            role="dialog"
            aria-modal="false"
            aria-label={label}
            onKeyDown={onPanelKey}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("button, select, a, input")) e.preventDefault(); }}
          >
            <div className="date-field-header">
              <button
                type="button"
                className="date-field-caption"
                aria-expanded={view !== "days"}
                aria-label={view === "days" ? `${caption}. Choose month and year` : "Back to calendar"}
                onClick={() => setView(view === "days" ? "years" : "days")}
              >
                {headerText}
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={view !== "days" ? "is-open" : ""}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {view === "days" && <div className="date-field-steppers">
                <button type="button" aria-label="Previous month" disabled={!canStep(-1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
                </button>
                <button type="button" aria-label="Next month" disabled={!canStep(1)} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
                </button>
              </div>}
            </div>

            {view === "years" && (
              <div className="date-field-grid date-field-years" role="group" aria-label="Choose a year">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    aria-current={year === month.getFullYear() ? "true" : undefined}
                    className={selected?.getFullYear() === year ? "is-selected" : ""}
                    onClick={() => { setMonth(new Date(year, month.getMonth(), 1)); setView("months"); }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {view === "months" && (
              <div className="date-field-grid date-field-months" role="group" aria-label={`Choose a month in ${month.getFullYear()}`}>
                {monthNames.map((short, index) => (
                  <button
                    key={short}
                    type="button"
                    disabled={!!monthOutOfRange(month.getFullYear(), index)}
                    aria-current={index === month.getMonth() ? "true" : undefined}
                    className={selected && selected.getFullYear() === month.getFullYear() && selected.getMonth() === index ? "is-selected" : ""}
                    onClick={() => { setMonth(new Date(month.getFullYear(), index, 1)); setView("days"); }}
                  >
                    {short}
                  </button>
                ))}
              </div>
            )}

            {view === "days" && (
              <DayPicker
                mode="single"
                locale={enAU}
                weekStartsOn={1}
                selected={selected}
                onSelect={pickDay}
                month={month}
                onMonthChange={setMonth}
                hideNavigation
                autoFocus
                startMonth={minDate}
                endMonth={maxDate}
                disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
              />
            )}

            {kind === "datetime" && view === "days" && (
              <div className="date-field-time">
                <span>Time</span>
                <button type="button" className="date-field-time-button" aria-label={`Time: ${timeLabel}. Change time`} onClick={() => setView("time")}>
                  {timeLabel}
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </button>
              </div>
            )}

            {view === "time" && (
              <div className="date-field-clock">
                <p className="date-field-grid-title">Hour</p>
                <div className="date-field-grid date-field-hours" role="group" aria-label="Hour">
                  {hourOptions.map((h) => (
                    <button key={h} type="button" aria-pressed={h === hour12} aria-current={h === hour12 ? "true" : undefined} className={h === hour12 ? "is-selected" : ""} onClick={() => setTime(h, minute, pm)}>{h}</button>
                  ))}
                </div>
                <p className="date-field-grid-title">Minutes</p>
                <div className="date-field-grid date-field-minutes" role="group" aria-label="Minutes">
                  {minuteOptions.map((m) => (
                    <button key={m} type="button" aria-pressed={m === minute} className={m === minute ? "is-selected" : ""} onClick={() => setTime(hour12, m, pm)}>:{pad(m)}</button>
                  ))}
                </div>
                <div className="date-field-meridiem" role="radiogroup" aria-label="AM or PM">
                  {(["am", "pm"] as const).map((period) => (
                    <button key={period} type="button" role="radio" aria-checked={pm === (period === "pm")} onClick={() => setTime(hour12, minute, period === "pm")}>
                      {period.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="date-field-actions">
              {!required && value && <button type="button" className="date-field-clear" onClick={() => { commit(undefined); close(); }}>Clear</button>}
              {view === "time"
                ? <button type="button" className="date-field-done" onClick={() => setView("days")}>Set time</button>
                : <button type="button" className="date-field-done" onClick={() => close()}>Done</button>}
            </div>
          </div>
        </>
      )}
    </span>
  );
}
