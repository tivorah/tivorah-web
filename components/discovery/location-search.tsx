"use client";
import { useEffect, useId, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api/client";
export type Locality = {
  suburb: string;
  state: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
};
const label = (place: Locality) =>
  `${place.suburb}, ${place.state} ${place.postcode}`;
export function LocationSearch({
  value,
  onChange,
  onSelect,
  inline = false,
}: {
  inline?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: Locality) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [places, setPlaces] = useState<Locality[]>([]);
  const [message, setMessage] = useState("");
  const blockedUntil = useRef(0);
  const cache = useRef(new Map<string, Locality[]>());
  useEffect(() => {
    if (inline && !suggestionsOpen) {
      setMessage("");
      return;
    }
    if (value.trim().length < 2) {
      setPlaces([]);
      setMessage("");
      return;
    }
    if (/^\d+$/.test(value.trim())) {
      setPlaces([]);
      setMessage("Use the postcode field in More filters.");
      return;
    }
    const key = value.trim().toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setPlaces(cached);
      setMessage("");
      return;
    }
    setPlaces([]);
    if (blockedUntil.current > Date.now()) {
      setMessage("Location suggestions are paused briefly. Try again shortly.");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setMessage("Finding suburbs…");
      api<{ localities: Locality[] }>(
        `/public/discovery/locations?query=${encodeURIComponent(value.trim().slice(0, 80))}`,
        { signal: controller.signal },
      )
        .then((result) => {
          if (controller.signal.aborted) return;
          if (cache.current.size >= 30)
            cache.current.delete(cache.current.keys().next().value!);
          cache.current.set(key, result.localities);
          setPlaces(result.localities);
          setMessage(
            result.localities.length
              ? ""
              : "No matching suburbs. Try another suburb.",
          );
        })
        .catch((cause) => {
          if (controller.signal.aborted) return;
          if (
            cause instanceof ApiError &&
            (cause.status === 429 || cause.status === 503)
          )
            blockedUntil.current = Date.now() + (cause.retryAfter || 30) * 1000;
          setMessage(
            "Suggestions unavailable. You can still search by suburb.",
          );
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, inline, suggestionsOpen]);
  return (
    <div
      className="discovery-location"
      onKeyDown={(event) => {
        if (!inline) return;
        if (event.key === "Escape" && suggestionsOpen) {
          event.preventDefault();
          event.stopPropagation();
          setSuggestionsOpen(false);
        }
        if (event.key === "ArrowDown" && suggestionsOpen) {
          event.preventDefault();
          const options = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              '[role="option"]',
            ),
          );
          const index = options.indexOf(document.activeElement as HTMLElement);
          options[(index + 1) % options.length]?.focus();
        }
      }}
    >
      <label>
        <span className="search-field-label">
          Suburb
        </span>
        <svg
          className="search-field-icon"
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
        <input
          ref={input}
          value={value}
          list={inline ? undefined : id}
          onFocus={() => setSuggestionsOpen(true)}
          maxLength={100}
          placeholder="Search suburb"
          autoComplete="off"
          aria-describedby={`${id}-status`}
          onChange={(event) => {
            setSuggestionsOpen(true);
            const selected = places.find(
              (place) => label(place) === event.target.value,
            );
            if (selected) {
              setSuggestionsOpen(false);
              onSelect(selected);
            } else onChange(event.target.value);
          }}
        />
      </label>
      {!inline && (
        <datalist id={id}>
          {places.map((place) => (
            <option key={label(place)} value={label(place)} />
          ))}
        </datalist>
      )}
      {inline && suggestionsOpen && places.length > 0 && (
        <div
          className="location-suggestions"
          role="listbox"
          aria-label="Suggested suburbs"
        >
          {places.map((place) => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={label(place)}
              onClick={() => {
                onSelect(place);
                input.current?.focus();
                setSuggestionsOpen(false);
              }}
            >
              <strong>{place.suburb}</strong>
              <span>
                {place.state} {place.postcode}
              </span>
            </button>
          ))}
        </div>
      )}
      <span
        id={`${id}-status`}
        className="location-search-status"
        role="status"
      >
        {message}
      </span>
    </div>
  );
}
