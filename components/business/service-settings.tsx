"use client";
import { SelectField } from "../ui/select-field";
import { refundPolicyOptions } from "../../lib/refund-policy";
export type ServiceSettingsValue = {
  availabilityTimezone?: string | null;
  bookingEnabled: boolean;
  paymentRequired: boolean;
  /** When customers pay, used with paymentRequired. */
  paymentTiming?: "upfront" | "after_service" | "customer_choice";
  refundPolicy?: string | null;
  refundPolicyNote?: string | null;
  slotDurationMinutes: number;
  bookingNoticeHours: number;
  weeklyAvailability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  bookingApproval?: "instant" | "request";
  bufferMinutes?: number;
  maxBookingsPerDay?: number | null;
  gstTreatment?: "unspecified" | "taxable" | "gst_free";
  testimonials?: { quote: string; author: string; context?: string }[];
};
/** What the API accepts: drops unfinished testimonials so a half-typed one never blocks saving. */
export function serviceSettingsPayload(value: ServiceSettingsValue) {
  return {
    ...value,
    testimonials: (value.testimonials ?? []).map((row) => ({ quote: row.quote.trim(), author: row.author.trim(), ...(row.context?.trim() ? { context: row.context.trim() } : {}) })).filter((row) => row.quote.length >= 5 && row.author),
  };
}
export const defaultServiceSettings: ServiceSettingsValue = {
  bookingEnabled: false,
  paymentRequired: false,
  paymentTiming: "upfront",
  slotDurationMinutes: 60,
  bookingNoticeHours: 24,
  weeklyAvailability: [],
  bookingApproval: "instant",
  bufferMinutes: 0,
  maxBookingsPerDay: null,
  gstTreatment: "unspecified",
  refundPolicy: "before_48_hours",
  testimonials: [],
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
          <label>
            How bookings are confirmed
            <SelectField label="How bookings are confirmed" value={value.bookingApproval ?? "instant"} onChange={(bookingApproval) => update({ bookingApproval: bookingApproval as "instant" | "request" })} options={[{ value: "instant", label: "Instantly" }, { value: "request", label: "I approve each one (within 48 hours)" }]} />
          </label>
          <label>
            Break after each appointment
            <SelectField label="Break after each appointment" value={String(value.bufferMinutes ?? 0)} onChange={(minutes) => update({ bufferMinutes: Number(minutes) })} options={[0, 5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => ({ value: String(minutes), label: minutes ? `${minutes} minutes` : "No break" }))} />
          </label>
          <label>
            Most bookings per day
            <SelectField label="Most bookings per day" value={value.maxBookingsPerDay ? String(value.maxBookingsPerDay) : ""} onChange={(limit) => update({ maxBookingsPerDay: limit ? Number(limit) : null })} options={[{ value: "", label: "No limit" }, ...[1, 2, 3, 4, 5, 6, 8, 10, 12].map((limit) => ({ value: String(limit), label: String(limit) }))]} />
          </label>
          </div><p className="service-settings-note">{value.bookingApproval === "request" ? "Requests hold the time for up to 48 hours. Customers are only charged after you approve. " : ""}Breaks, the daily limit and your time off apply across all your services, so you’re never double-booked. Your weekly hours use {timezone}. Existing appointments keep their booked time if you change this setting.</p></div>
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
            <span><strong>Collect payment online</strong><small>Otherwise, customers reserve a time and arrange payment with you.</small></span>
          </label>
          {value.paymentRequired ? <>
            <fieldset className="service-payment-timing">
              <legend>When do customers pay?</legend>
              {([
                ["upfront", "When booking", "Customers pay online to confirm their time."],
                ["after_service", "After the service", "Customers book now and get a Pay button once the appointment is completed."],
                ["customer_choice", "Customer chooses", "Customers pick paying when booking or after the service."],
              ] as const).map(([option, title, hint]) => (
                <label key={option} className="service-payment-timing-option">
                  <input type="radio" name="paymentTiming" value={option} checked={(value.paymentTiming ?? "upfront") === option} onChange={() => update({ paymentTiming: option })} />
                  <span><strong>{title}</strong><small>{hint}</small></span>
                </label>
              ))}
            </fieldset>
            <p className="service-settings-note">Requires fixed, hourly or quote pricing and completed payout setup. Payouts are held until 24 hours after each appointment{value.paymentTiming && value.paymentTiming !== "upfront" ? " and released once the customer has paid" : ""}, then sent to your bank.</p>
            <label>GST on this service<SelectField label="GST on this service" value={value.gstTreatment ?? "unspecified"} onChange={(gstTreatment) => update({ gstTreatment: gstTreatment as ServiceSettingsValue["gstTreatment"] })} options={[{ value: "unspecified", label: "Not sure / not registered" }, { value: "taxable", label: "Price includes GST (I’m GST-registered)" }, { value: "gst_free", label: "GST-free service" }]} /></label>
            <p className="service-settings-note">When you’re GST-registered with an ABN on your payout profile and the price includes GST, customers get a tax invoice as their receipt.</p>
          </> : null}</div>
          <div className="service-settings-section"><div className="service-settings-section-head"><h3>Cancellation policy</h3><p>Inside this window customers can cancel for a full refund or reschedule themselves.</p></div>
            <label>Policy<SelectField label="Cancellation policy" value={value.refundPolicy ?? ""} placeholder="Choose a policy" onChange={(refundPolicy) => update({ refundPolicy })} options={[...refundPolicyOptions]} /></label>
            <label>Details · optional<textarea rows={2} maxLength={1200} value={value.refundPolicyNote ?? ""} onChange={(e) => update({ refundPolicyNote: e.target.value })} placeholder="Anything customers should know, e.g. how to reschedule" /></label>
            <p className="service-settings-note">If you cancel, the customer is always refunded in full. Your policy can’t remove consumer rights.</p>
          </div>
          <div className="service-settings-section"><div className="service-settings-section-head"><h3>Testimonials</h3><p>Pin up to six quotes from past clients on your service page, shown as shared by you. Verified reviews from bookings appear separately.</p></div>
            {(value.testimonials ?? []).map((row, index) => <div className="service-testimonial-edit" key={index}>
              <label>What they said<textarea rows={2} maxLength={500} value={row.quote} onChange={(e) => update({ testimonials: (value.testimonials ?? []).map((item, i) => i === index ? { ...item, quote: e.target.value } : item) })} /></label>
              <div className="service-testimonial-edit-row">
                <label>Name<input maxLength={80} value={row.author} placeholder="e.g. Priya S." onChange={(e) => update({ testimonials: (value.testimonials ?? []).map((item, i) => i === index ? { ...item, author: e.target.value } : item) })} /></label>
                <label>Context · optional<input maxLength={80} value={row.context ?? ""} placeholder="e.g. Wedding, March 2026" onChange={(e) => update({ testimonials: (value.testimonials ?? []).map((item, i) => i === index ? { ...item, context: e.target.value } : item) })} /></label>
                <button type="button" className="service-settings-remove" aria-label={`Remove testimonial ${index + 1}`} onClick={() => update({ testimonials: (value.testimonials ?? []).filter((_, i) => i !== index) })}>Remove</button>
              </div>
            </div>)}
            {(value.testimonials ?? []).length < 6 ? <button type="button" className="product-secondary service-settings-add" onClick={() => update({ testimonials: [...(value.testimonials ?? []), { quote: "", author: "" }] })}>+ Add a testimonial</button> : null}
            <p className="service-settings-note">Only use real quotes you have permission to share. Pin videos from the Videos section of this service.</p>
          </div>
        </>
      ) : null}
    </fieldset>
  );
}
