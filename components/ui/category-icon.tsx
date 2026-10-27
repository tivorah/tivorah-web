import type { CSSProperties } from "react";
import { categoryVisual, type CategoryKind } from "../../lib/category-visuals";

/** A category's icon in a soft round tile, coloured like the app's (light and dark tones). */
export function CategoryIcon({ kind, label }: { kind: CategoryKind; label: string }) {
  const { path, light, dark } = categoryVisual(kind, label);
  return <span className="category-icon" aria-hidden="true" style={{ "--tone-light": light, "--tone-dark": dark } as CSSProperties}>
    <svg viewBox="0 0 24 24" width="19" height="19"><path d={path} fill="currentColor" /></svg>
  </span>;
}
