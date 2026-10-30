"use client";
import { useEffect, useRef, useState } from "react";
import { singleFlight } from "../lib/single-flight";

/** `[run, busy]`: run ignores clicks while the last one is still going (lib/single-flight.ts). */
export function useSingleFlight<A extends unknown[], R>(action: (...args: A) => Promise<R> | R) {
  const actionRef = useRef(action);
  // The latest action (its closure sees the latest state), updated once each render commits.
  useEffect(() => { actionRef.current = action; });
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [run] = useState(() => singleFlight(lock, (...args: A) => actionRef.current(...args), setBusy));
  return [run, busy] as const;
}
