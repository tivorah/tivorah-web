"use client";
export type ServiceSettingsValue = {
  bookingEnabled: boolean;
  paymentRequired: boolean;
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
}: {
  value: ServiceSettingsValue;
  onChange: (v: ServiceSettingsValue) => void;
}) {
  const update = (patch: Partial<ServiceSettingsValue>) =>
    onChange({ ...value, ...patch });
  return (
    <fieldset>
      <legend>Appointments</legend>
      <label className="product-checkbox">
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
        <span>Let customers book appointments online</span>
      </label>
      {value.bookingEnabled ? (
        <>
          <label>
            Duration (minutes)
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
            Advance notice (hours)
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
          <p>
            Weekly times use the time zone of your service’s Australian
            locality. Online services without a locality use Sydney time.
          </p>
          {value.weeklyAvailability.map((period, index) => (
            <div className="availability-period" key={index}>
              <label>
                Day
                <select
                  value={period.dayOfWeek}
                  onChange={(e) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, dayOfWeek: Number(e.target.value) }
                            : row,
                      ),
                    })
                  }
                >
                  {days.map((day, i) => (
                    <option value={i} key={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                From
                <input
                  type="time"
                  required
                  value={period.startTime}
                  onChange={(e) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, startTime: e.target.value }
                            : row,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Until
                <input
                  type="time"
                  required
                  value={period.endTime}
                  onChange={(e) =>
                    update({
                      weeklyAvailability: value.weeklyAvailability.map(
                        (row, i) =>
                          i === index
                            ? { ...row, endTime: e.target.value }
                            : row,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="product-secondary"
                type="button"
                onClick={() =>
                  update({
                    weeklyAvailability: value.weeklyAvailability.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                Remove period {index + 1}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="product-secondary"
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
            Add availability
          </button>
          <label className="product-checkbox">
            <input
              type="checkbox"
              checked={value.paymentRequired}
              onChange={(e) => update({ paymentRequired: e.target.checked })}
            />
            <span>Collect payment when booking</span>
          </label>
          <p>
            Online payment requires fixed or hourly pricing and completed payout
            setup. Otherwise, customers book without paying now.
          </p>
        </>
      ) : null}
    </fieldset>
  );
}
