"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api/client";
export type Locality = { suburb: string; state: string; postcode: string };
export function LocalityField({
  onChange,
  required = true,
}: {
  required?: boolean;
  onChange: (value: Locality | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Locality[]>([]);
  const [selected, setSelected] = useState<Locality | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.length < 2 || selected) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ localities: Locality[] }>(
        `/public/discovery/locations?query=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )
        .then((result) => {
          if (!controller.signal.aborted) {
            setItems(result.localities);
            setError("");
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Location search is unavailable. Try another search in a moment.",
            );
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);
  return (
    <div>
      <label>
        Suburb or postcode
        <input
          value={query}
          maxLength={80}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            onChange(null);
            setItems([]);
          }}
          placeholder="Search Australian suburbs"
          autoComplete="off"
          required={required}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      {!selected && items.length ? (
        <div className="locality-options" aria-label="Matching suburbs">
          {items.map((item) => (
            <button
              className="product-secondary"
              type="button"
              key={`${item.suburb}-${item.postcode}`}
              onClick={() => {
                setSelected(item);
                setQuery(`${item.suburb}, ${item.state} ${item.postcode}`);
                onChange(item);
                setItems([]);
              }}
            >
              {item.suburb}, {item.state} {item.postcode}
            </button>
          ))}
        </div>
      ) : null}
      {selected ? (
        <p role="status">
          Selected: {selected.suburb}, {selected.state} {selected.postcode}
        </p>
      ) : null}
    </div>
  );
}
