"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { enAU } from "react-day-picker/locale";
import { Sheet } from "../../ui/sheet";
import { toDateValue } from "../../ui/date-field";

// An event's start and end, as in the app (tivorah-mobile/components/creation/DateTimeSheet.tsx):
// four controls (start date, start time, end date, end time) and ONE picker sheet shared by all of
// them (a bottom sheet on phones, a side sheet on larger screens). The picked values travel in
// hidden `startsAt` / `endsAt` inputs (YYYY-MM-DDTHH:mm, local time), like DateField's.

type Part = "startDate" | "startTime" | "endDate" | "endTime";
type Values = Record<Part, string>;

const pad = (n: number) => String(n).padStart(2, "0");
const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
const titles: Record<Part, string> = { startDate: "Event date", startTime: "Start time", endDate: "End date", endTime: "End time" };
const labels: Record<Part, string> = { startDate: "Start date", startTime: "Start time", endDate: "End date", endTime: "End time" };

const parseDay = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};
const showDay = (value: string) => parseDay(value)?.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) ?? "";
const showTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "pm" : "am"}`;
};
/** "YYYY-MM-DDTHH:mm" once both halves are chosen, else "". */
export const joinDateTime = (day: string, time: string) => (day && time ? `${day}T${time}` : "");

/** Two hours after the start, when that's still the same day (otherwise left for the organiser). */
function endTimeAfter(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h + 2 <= 23 ? `${pad(h + 2)}:${pad(m)}` : "";
}

export function EventWhenField({ onChange, disabled }: { onChange: (value: { startsAt: string; endsAt: string }) => void; disabled?: boolean }) {
  const [values, setValues] = useState<Values>({ startDate: "", startTime: "", endDate: "", endTime: "" });
  const [picking, setPicking] = useState<Part | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const startsAt = joinDateTime(values.startDate, values.startTime);
  const endsAt = joinDateTime(values.endDate, values.endTime);
  const endBeforeStart = !!startsAt && !!endsAt && new Date(endsAt) <= new Date(startsAt);

  const update = (patch: Partial<Values>) => {
    const next = { ...values, ...patch };
    // Picking the start fills an empty or earlier end: the same day, two hours later.
    if (patch.startDate && (!next.endDate || next.endDate < patch.startDate)) next.endDate = patch.startDate;
    if (patch.startTime && !next.endTime && (!next.endDate || next.endDate === next.startDate)) next.endTime = endTimeAfter(patch.startTime);
    setValues(next);
    onChange({ startsAt: joinDateTime(next.startDate, next.startTime), endsAt: joinDateTime(next.endDate, next.endTime) });
  };
  const open = (part: Part) => {
    const day = parseDay(part === "endDate" ? values.endDate || values.startDate : values.startDate);
    setMonth(day ?? new Date());
    setPicking(part);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isDate = picking === "startDate" || picking === "endDate";
  const current = picking ? values[picking] : "";
  // Times: what's chosen, or 6 pm to start from (like DateField).
  const [hour24, minute] = (picking && !isDate && current ? current : "18:00").split(":").map(Number);
  const hour12 = hour24 % 12 || 12;
  const pm = hour24 >= 12;
  const setTime = (h12: number, m: number, isPm: boolean) => { if (picking) update({ [picking]: `${pad((h12 % 12) + (isPm ? 12 : 0))}:${pad(m)}` }); };
  const minimum = picking === "endDate" ? parseDay(values.startDate) ?? today : today;

  const trigger = (part: Part, icon: "date" | "time") => {
    const value = values[part];
    const shown = value ? (icon === "date" ? showDay(value) : showTime(value)) : "";
    return <span className="event-when-control">
      <span className="event-when-label" id={`event-when-${part}`}>{labels[part]}</span>
      <button type="button" className="event-when-trigger" disabled={disabled} aria-haspopup="dialog" aria-labelledby={`event-when-${part} event-when-${part}-value`} onClick={() => open(part)}>
        {icon === "date"
          ? <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
          : <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>}
        <span id={`event-when-${part}-value`} className={shown ? "" : "date-field-placeholder"}>{shown || (icon === "date" ? "Choose a date" : "Choose a time")}</span>
      </button>
    </span>;
  };

  return <div className="event-when">
    <div className="event-when-grid">
      {trigger("startDate", "date")}
      {trigger("startTime", "time")}
      {trigger("endDate", "date")}
      {trigger("endTime", "time")}
    </div>
    <input type="hidden" name="startsAt" value={startsAt} />
    <input type="hidden" name="endsAt" value={endsAt} />
    {endBeforeStart ? <p className="field-error" role="alert">The end date and time must be after the start.</p> : null}

    <Sheet open={picking !== null} onClose={() => setPicking(null)} title={picking ? titles[picking] : ""}
      footer={<><span /><span className="tv-sheet-foot-actions"><button type="button" className="product-primary press-fx" onClick={() => setPicking(null)} aria-label={picking ? `Done, ${titles[picking]}` : "Done"}>Done</button></span></>}>
      <div className="event-when-picker">
        {isDate ? <DayPicker
          mode="single"
          locale={enAU}
          weekStartsOn={1}
          selected={parseDay(current)}
          onSelect={(day) => { if (day && picking) update({ [picking]: toDateValue(day) }); }}
          month={month}
          onMonthChange={setMonth}
          startMonth={minimum}
          disabled={{ before: minimum }}
          autoFocus
        /> : picking ? <div className="date-field-clock">
          <p className="date-field-grid-title">Hour</p>
          <div className="date-field-grid date-field-hours" role="group" aria-label="Hour">
            {hourOptions.map((h) => <button key={h} type="button" aria-pressed={!!current && h === hour12} className={current && h === hour12 ? "is-selected" : ""} onClick={() => setTime(h, current ? minute - (minute % 5) : 0, pm)}>{h}</button>)}
          </div>
          <p className="date-field-grid-title">Minutes</p>
          <div className="date-field-grid date-field-minutes" role="group" aria-label="Minutes">
            {minuteOptions.map((m) => <button key={m} type="button" aria-pressed={!!current && m === minute - (minute % 5)} className={current && m === minute - (minute % 5) ? "is-selected" : ""} onClick={() => setTime(hour12, m, pm)}>:{pad(m)}</button>)}
          </div>
          <div className="date-field-meridiem" role="radiogroup" aria-label="AM or PM">
            {(["am", "pm"] as const).map((period) => <button key={period} type="button" role="radio" aria-checked={pm === (period === "pm")} onClick={() => setTime(hour12, current ? minute - (minute % 5) : 0, period === "pm")}>{period.toUpperCase()}</button>)}
          </div>
          <p className="shop-hint">{current ? `Set to ${showTime(current)}.` : "Tap an hour to set the time."} Times are in your local time.</p>
        </div> : null}
      </div>
    </Sheet>
  </div>;
}
