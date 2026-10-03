/**
 * "450 m away", "2.3 km away", "12 km away". Null when there's no distance (no location chosen,
 * or an online service found beyond the radius). Mobile counterpart: tivorah-mobile/utils/distance.ts.
 */
export function distanceLabel(km: unknown): string | null {
  if (km == null || km === "") return null;
  const value = Number(km);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 0.1) return "Nearby";
  // Rounds to the nearest 100 m; 950 m and up reads better as "1 km".
  if (value < 0.95) return `${Math.round(value * 10) * 100} m away`;
  if (value < 9.95) return `${(Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "")} km away`;
  return `${Math.round(value)} km away`;
}
