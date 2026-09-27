import type { DiscoveryPage } from "./discovery";

// Public search pages only. Per-browser-instance memory, never persistent storage.
export function createDiscoveryCache() {
  const pages = new Map<string, { value: DiscoveryPage; expires: number }>();
  return {
    get(key: string) {
      const entry = pages.get(key);
      if (!entry || entry.expires <= Date.now()) {
        pages.delete(key);
        return null;
      }
      pages.delete(key);
      pages.set(key, entry);
      return entry.value;
    },
    set(key: string, value: DiscoveryPage) {
      pages.delete(key);
      pages.set(key, { value, expires: Date.now() + 30_000 });
      if (pages.size > 40) pages.delete(pages.keys().next().value!);
    },
    clear() { pages.clear(); },
  };
}
