"use client";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FilterSelect } from "../ui/filter-select";
import { FilterDialog } from "../ui/filter-dialog";
import { LocationSearch, type Locality } from "./location-search";
import categories from "../../lib/discovery-categories.json";
import type { DiscoveryKind } from "../../lib/api/discovery";
import { api } from "../../lib/api/client";

export function DiscoveryFilters({ kind }: { kind: DiscoveryKind }) {
  const params = useSearchParams();
  const path = usePathname();
  const [draftLocation, setDraftLocation] = useState<Locality | null>(null);
  const [locationText, setLocationText] = useState("");
  const [postcodeText, setPostcodeText] = useState("");
  const [locationEdited, setLocationEdited] = useState(false);
  const [radius, setRadius] = useState("");
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(kind === "hubs");
  useEffect(() => {
    if (kind !== "hubs") return;
    const controller = new AbortController();
    setLoading(true);
    api<{ interests: { name: string }[] }>("/public/discovery/interests", {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setInterests(data.interests.map((item) => item.name));
          setError("");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Could not load Hub interests.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, attempt]);
  const choices =
    kind === "hubs"
      ? interests
      : categories[kind].filter((value) => value !== "Services");
  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    window.history.replaceState(
      null,
      "",
      `${path}${next.size ? `?${next}` : ""}`,
    );
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locationEdited && locationText.trim() && !draftLocation) {
      setFormError(
        "Choose a suburb from the suggestions, or clear the location to search everywhere.",
      );
      return;
    }
    const data = new FormData(event.currentTarget);
    const postcode = String(data.get("postcode") || "").trim();
    if (postcode && !/^\d{4}$/.test(postcode)) {
      setFormError("Enter a four-digit Australian postcode.");
      return;
    }
    const min = String(data.get("minPrice") || "");
    const max = String(data.get("maxPrice") || "");
    if (min && max && Number(min) > Number(max)) {
      setFormError("Maximum price must be at least the minimum price.");
      return;
    }
    setFormError("");
    update({
      condition: String(data.get("condition") || ""),
      minPrice: min ? String(Math.round(Number(min) * 100)) : "",
      maxPrice: max ? String(Math.round(Number(max) * 100)) : "",
      postcode,
      radiusKm:
        draftLocation?.latitude != null && draftLocation.longitude != null
          ? radius
          : "",
      ...(locationEdited
        ? {
            locality: draftLocation?.suburb || "",
            state: draftLocation?.state || "",
            latitude:
              draftLocation?.latitude != null
                ? String(draftLocation.latitude)
                : "",
            longitude:
              draftLocation?.longitude != null
                ? String(draftLocation.longitude)
                : "",
          }
        : {}),
    });
    setOpen(false);
  }
  function dates(value: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (value === "weekend") {
      const day = start.getDay();
      start.setDate(start.getDate() + (day === 0 ? 0 : (6 - day + 7) % 7));
      end.setTime(start.getTime());
      end.setDate(end.getDate() + (day === 0 ? 1 : 2));
    } else if (value === "month") end.setMonth(end.getMonth() + 1);
    else end.setDate(end.getDate() + (value === "week" ? 7 : 1));
    update({
      when: value,
      dateFrom: value ? start.toISOString() : "",
      dateTo: value ? end.toISOString() : "",
    });
  }
  const conditions = [
    { value: "", label: "Any condition" },
    { value: "new", label: "New" },
    { value: "like_new", label: "Like new" },
    { value: "used_good", label: "Used — good" },
    { value: "used_fair", label: "Used — fair" },
  ];
  const dateOptions = [
    { value: "", label: "Any date" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "weekend", label: "Weekend" },
    { value: "month", label: "This month" },
  ];
  const active = [
    params.get("category")
      ? { label: params.get("category")!, clear: { category: "" } }
      : null,
    params.get("when")
      ? {
          label:
            dateOptions.find((option) => option.value === params.get("when"))
              ?.label || "Selected dates",
          clear: { when: "", dateFrom: "", dateTo: "" },
        }
      : null,
    params.get("condition")
      ? {
          label:
            conditions.find(
              (option) => option.value === params.get("condition"),
            )?.label || "Condition",
          clear: { condition: "" },
        }
      : null,
    params.has("minPrice") || params.has("maxPrice")
      ? {
          label: params.has("maxPrice")
            ? `$${Number(params.get("minPrice") || 0) / 100}–$${Number(params.get("maxPrice")) / 100}`
            : `From $${Number(params.get("minPrice")) / 100}`,
          clear: { minPrice: "", maxPrice: "" },
        }
      : null,
    params.get("radiusKm")
      ? {
          label: `Within ${params.get("radiusKm")} km`,
          clear: {
            radiusKm: "",
          },
        }
      : null,
    params.get("postcode")
      ? { label: `Postcode ${params.get("postcode")}`, clear: { postcode: "" } }
      : null,
    params.get("locality") && !params.get("radiusKm")
      ? {
          label: params.get("locality")!,
          clear: {
            locality: "",
            state: "",
            latitude: "",
            longitude: "",
          },
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => !!item);
  const reset = () => {
    window.history.replaceState(null, "", path);
    setOpen(false);
  };
  return (
    <section className="discovery-filters" aria-label="Filter results">
      <div className="discovery-filter-toolbar">
        <FilterSelect
          label={kind === "hubs" ? "Hub interest" : "Category"}
          options={[
            {
              value: "",
              label: loading
                ? "Loading interests…"
                : kind === "hubs"
                  ? "All interests"
                  : "All categories",
            },
            ...choices.map((value) => ({ value, label: value })),
          ]}
          value={params.get("category") || ""}
          disabled={loading || (kind === "hubs" && !interests.length)}
          onChange={(value) => update({ category: value })}
          searchable
        />
        {kind === "events" && (
          <FilterSelect
            label="When"
            options={dateOptions}
            value={params.get("when") || ""}
            onChange={dates}
          />
        )}
        <button
          type="button"
          className="filter-more"
          onClick={() => {
            setFormError("");
            setLocationText(params.get("locality") || "");
            setPostcodeText(params.get("postcode") || "");
            setLocationEdited(false);
            setRadius(params.get("radiusKm") || "");
            setDraftLocation(
              params.has("latitude") && params.has("longitude")
                ? {
                    suburb: params.get("locality") || "",
                    state: params.get("state") || "",
                    postcode: params.get("postcode") || "",
                    latitude: Number(params.get("latitude")),
                    longitude: Number(params.get("longitude")),
                  }
                : null,
            );
            setOpen(true);
          }}
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M4 7h16M4 17h16" />
            <circle cx="9" cy="7" r="3" fill="currentColor" stroke="none" />
            <circle cx="15" cy="17" r="3" fill="currentColor" stroke="none" />
          </svg>
          More filters
          {active.length > 0 && (
            <span className="filter-count">{active.length}</span>
          )}
        </button>
        {params.size > 0 && (
          <button className="filter-reset" type="button" onClick={reset}>
            Reset all
          </button>
        )}
      </div>
      {active.length > 0 && (
        <div className="filter-active-list" aria-label="Applied filters">
          {active.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={`Remove ${item.label}`}
              onClick={() =>
                update(item.clear as Record<string, string | undefined>)
              }
            >
              {item.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert">
          {error}{" "}
          {kind === "hubs" && (
            <button onClick={() => setAttempt((n) => n + 1)}>Try again</button>
          )}
        </p>
      )}
      <FilterDialog open={open} onClose={() => setOpen(false)}>
        <form onSubmit={apply} className="filter-dialog-form">
          <div className="filter-dialog-body">
            <fieldset>
              <legend>Location & distance</legend>
              <LocationSearch
                inline
                value={locationText}
                onChange={(value) => {
                  setLocationText(value);
                  setDraftLocation(null);
                  setLocationEdited(true);
                  setRadius("");
                }}
                onSelect={(place) => {
                  setLocationText(
                    `${place.suburb}, ${place.state}`,
                  );
                  setDraftLocation(place);
                  setLocationEdited(true);
                  setRadius("10");
                  setFormError("");
                }}
              />
              <label className="filter-postcode-field">
                Postcode
                <input
                  name="postcode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Any postcode"
                  value={postcodeText}
                  onChange={(event) => setPostcodeText(event.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
              <p>
                {draftLocation
                  ? "Choose how far you want to look."
                  : locationText.trim()
                    ? "Choose this suburb from the suggestions to enable distance filtering."
                    : "Select a suggested suburb to enable distance filtering."}
              </p>
              <FilterSelect
                label="Distance"
                name="radiusKm"
                value={radius}
                onChange={setRadius}
                disabled={
                  draftLocation?.latitude == null ||
                  draftLocation.longitude == null
                }
                options={[
                  { value: "", label: "Selected suburb only" },
                  ...[5, 10, 25, 50, 100, 250, 500].map((n) => ({
                    value: String(n),
                    label: `Within ${n} km`,
                  })),
                ]}
              />
              {draftLocation?.latitude != null && (
                <small>Measured from the centre of the selected suburb.</small>
              )}
              {kind === "services" && (
                <small>Online services are also included.</small>
              )}
            </fieldset>
            {kind === "items" && (
              <fieldset>
                <legend>Item condition</legend>
                <FilterSelect
                  label="Condition"
                  name="condition"
                  defaultValue={params.get("condition") || ""}
                  options={conditions}
                />
              </fieldset>
            )}
            {(kind === "items" || kind === "services") && (
              <fieldset>
                <legend>Price range</legend>
                <p>Set your budget in Australian dollars.</p>
                <div className="filter-price-row">
                  <label>
                    Minimum price (AUD)
                    <span className="filter-price-input">
                      <span aria-hidden="true">$</span>
                      <input
                        aria-label="Minimum price (AUD)"
                        name="minPrice"
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        placeholder="No minimum"
                        defaultValue={
                          params.has("minPrice")
                            ? Number(params.get("minPrice")) / 100
                            : ""
                        }
                      />
                    </span>
                  </label>
                  <label>
                    Maximum price (AUD)
                    <span className="filter-price-input">
                      <span aria-hidden="true">$</span>
                      <input
                        aria-label="Maximum price (AUD)"
                        name="maxPrice"
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        placeholder="No maximum"
                        defaultValue={
                          params.has("maxPrice")
                            ? Number(params.get("maxPrice")) / 100
                            : ""
                        }
                      />
                    </span>
                  </label>
                </div>
              </fieldset>
            )}
            {formError && (
              <p className="product-error" role="alert">
                {formError}
              </p>
            )}
          </div>
          <div className="filter-dialog-actions">
            <button className="filter-reset" type="button" onClick={reset}>
              Reset all
            </button>
            <button className="product-primary">Apply filters</button>
          </div>
        </form>
      </FilterDialog>
    </section>
  );
}
