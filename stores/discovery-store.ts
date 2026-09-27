import { createStore } from "zustand/vanilla";
export type DiscoveryState = {
  query: string;
  locality: string;
  setQuery: (value: string) => void;
  setLocality: (value: string) => void;
};
// Instantiated by each mounted discovery view; never shared between server requests.
export const createDiscoveryStore = (query = "", locality = "") =>
  createStore<DiscoveryState>()((set) => ({
    query,
    locality,
    setQuery: (query) => set({ query }),
    setLocality: (locality) => set({ locality }),
  }));
