"use client";
import { SelectField } from "../ui/select-field";
import { refundPolicyOptions } from "../../lib/refund-policy";
export type ServiceSettingsValue = {
  availabilityTimezone?: string | null;
  bookingEnabled: boolean;
  paymentRequired: boolean;
  refundPolicy?: string | null;
  refundPolicyNote?: string | null;
  slotDurationMinutes: number;
  bookingNoticeHours: number;
  weeklyAvailability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
};
export const defaultServiceSettings: ServiceSettingsValue = {
  bookingEnabled: false,
  paymentRequired: false,
  slotDurationMinutes: 60,
  bookingNoticeHours: 24,
  weeklyAvailability: [],
};
const serviceTimezones = ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Adelaide", "Australia/Perth", "Australia/Darwin", "Australia/Hobart", "Australia/Broken_Hill", "Australia/Lord_Howe", "Australia/Eucla"];
export function serviceTimezoneForState(state?: string | null) {
  return ({ ACT: "Australia/Sydney", NSW: "Australia/Sydney", VIC: "Australia/Melbourne", QLD: "Australia/Brisbane", SA: "Australia/Adelaide", WA: "Australia/Perth", NT: "Australia/Darwin", TAS: "Australia/Hobart" } as Record<string, string>)[state ?? ""] ?? "Australia/Sydney";
}
// Quarter-hour choices for opening hours, plus any existing value off that grid.
const timeLabel = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
};
const quarterHours = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);
const timeOptions = (current?: string) => {
  const extra = current && /^\d{2}:\d{2}/.test(current) && !quarterHours.includes(current.slice(0, 5)) ? [current.slice(0, 5)] : [];
  return [...quarterHours, ...extra].sort().map((value) => ({ value, label: timeLabel(value) }));
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function ServiceSettings({
  value,
  onChange,
  localityState,
}: {
  localityState?: string | null;
  value: ServiceSettingsValue;
  onChange: (v: ServiceSettingsValue) => void;
}) {
  const timezone = value.availabilityTimezone || serviceTimezoneForState(localityState);
  const zones = serviceTimezones.includes(timezone) ? serviceTimezones : [...serviceTimezones, timezone];
  const update = (patch: Partial<ServiceSettingsValue>) =>
    onChange({ ...value, ...patch });
  return (
    <fieldset className="service-settings">
      <legend className="sr-only">Appointment settings</legend>
      <label className="showcase-switch service-booking-toggle">
        <input
          type="checkbox"
          checked={value.bookingEnabled}
          onChange={(e) =>
            update({
              bookingEnabled: e.target.checked,
              ...(!e.target.checked ? { paymentRequired: false } : {}),
            })
          }
        />
        <span className="showcase-switch-track" aria-hidden="true" />
        <span><strong>Accept online bookings</strong><small>Customers can choose an available appointment time on your service page.</small></span>
      </label>
      {value.bookingEnabled ? (
        <>
          <div className="service-settings-section"><div className="service-settings-section-head"><h3>Booking rules</h3><p>Set the length of each appointment and how soon someone can book.</p></div><div className="service-settings-rules">
          <label>
            Appointment length
            <input
              type="number"
              min={15}
              max={480}
              value={value.slotDurationMinutes}
              onChange={(e) =>
                update({ slotDurationMinutes: Number(e.target.value) })
              }
              required
            />
          </label>
          <label>
            Minimum notice (hours)
            <input
              type="number"
              min={0}
              max={720}
              value={value.bookingNoticeHours}
              onChange={(e) =>
                update({ bookingNoticeHours: Number(e.target.value) })
              }
              required
            />
          </label>
          <label className="service-settings-timezone">
            Appointment time zone
            <SelectField label="Appointment time zone" value={timezone} onChange={zone => update({ availabilityTimezone: zone })} options={zones.map(zone => ({ value: zone, label: `${zone.replace("Australia/", "").replaceAll("_", " ")} (${zone})` }))} />
          </label>
          </div><p className="service-settings-note">Your weekly hours use {timezone}. Existing appointments keep their booked time if you change this setting.</p></div>
          <div className="service-settings-section"><div className="service-settings-section-head"><h3>Weekly availability</h3><p>Add the days and times you normally work. You can add more than one period per day.</p></div>
          {value.weeklyAvailability.length === 0 ? <p className="service-settings-empty">Add at least one time period before saving online bookings.</p> : null}
          {value.weeklyAvailability.map((period, index) => (
            <div className="availability-period" key={index}>
              <label>
                Day
                <SelectField
                  label={`Day for period ${index + 1}`}
                  value={String(period.dayOfWeek)}
                  onChange={(day) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, dayOfWeek: Number(day) }
                            : row,
                      ),
                    })
                  }
                  options={days.map((day, i) => ({ value: String(i), label: day }))}
                />
              </label>
              <label>
                From
                <SelectField
                  label={`From time for period ${index + 1}`}
                  required
                  placeholder="Choose a time"
                  value={period.startTime?.slice(0, 5) ?? ""}
                  onChange={(time) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, startTime: time }
                            : row,
                      ),
                    })
                  }
                  options={timeOptions(period.startTime)}
                />
              </label>
              <label>
                Until
                <SelectField
                  label={`Until time for period ${index + 1}`}
                  required
                  placeholder="Choose a time"
                  value={period.endTime?.slice(0, 5) ?? ""}
                  onChange={(time) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, endTime: time }
                            : row,
                      ),
                    })
                  }
                  options={timeOptions(period.endTime)}
                />
              </label>
              <button
                className="service-settings-remove"
                type="button"
                aria-label={`Remove ${days[period.dayOfWeek]} ${timeLabel(period.startTime)} to ${timeLabel(period.endTime)}`}
                onClick={() =>
                  update({
                    weeklyAvailability: value.weeklyAvailability.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="product-secondary service-settings-add"
            disabled={value.weeklyAvailability.length >= 14}
            onClick={() =>
              update({
                weeklyAvailability: [
                  ...value.weeklyAvailability,
                  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
                ],
              })
            }
          >
            + Add time period
          </button>
          </div>
          <div className="service-settings-section service-settings-payment"><div className="service-settings-section-head"><h3>Payment</h3></div><label className="showcase-switch">
            <input
              type="checkbox"
              checked={value.paymentRequired}
              onChange={(e) => update({ paymentRequired: e.target.checked })}
            />
            <span className="showcase-switch-track" aria-hidden="true" />
            <span><strong>Collect payment at booking</strong><small>Otherwise, customers reserve a time without paying now.</small></span>
          </label>
          {value.paymentRequired ? <>
            <p className="service-settings-note">Requires fixed or hourly pricing and completed payout setup.</p>
            <label>Refund policy<SelectField label="Refund policy" value={value.refundPolicy ?? ""} placeholder="Choose a refund policy" onChange={(refundPolicy) => update({ refundPolicy })} options={[...refundPolicyOptions]} /></label>
            <label>Refund details · optional<textarea rows={2} maxLength={1200} value={value.refundPolicyNote ?? ""} onChange={(e) => update({ refundPolicyNote: e.target.value })} placeholder="Anything customers should know, e.g. how to reschedule" /></label>
            <p className="service-settings-note">Customers can request a refund from their booking while your policy allows it. Your policy can’t remove consumer rights.</p>
          </> : null}</div>
        </>
      ) : null}
    </fieldset>
  );
}
