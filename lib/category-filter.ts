// Multi-select category / Hub interest filter, stored in the URL as `category=A,B`.
// The API matches any of the chosen values (tivorah-api discoveryCategories).
export const MAX_SELECTED_CATEGORIES = 8;

export function selectedCategories(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))].slice(0, MAX_SELECTED_CATEGORIES);
}

export const categoryParam = (values: string[]) => values.slice(0, MAX_SELECTED_CATEGORIES).join(",");

/** Adds or removes one choice; an empty choice clears the filter ("All interests"). */
export function toggleCategory(current: string | null | undefined, value: string): string {
  if (!value) return "";
  const selected = selectedCategories(current);
  return categoryParam(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
}

/** Trigger text: the first choice, plus how many more. */
export function categorySummary(values: string[], fallback: string) {
  if (!values.length) return fallback;
  return values.length === 1 ? values[0] : `${values[0]} +${values.length - 1}`;
}

/** A Hub's primary interest (first added) and its secondary interests. */
export function hubInterestTiers(interests: string[] | null | undefined, secondaryLimit = 2) {
  const [primary, ...rest] = interests ?? [];
  return { primary: primary ?? null, secondary: rest.slice(0, secondaryLimit), more: Math.max(0, rest.length - secondaryLimit) };
}
