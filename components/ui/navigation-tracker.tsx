"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { noteNavigation } from "../../lib/navigation-depth";

export function NavigationTracker() {
  const path = usePathname();
  const search = useSearchParams();
  const key = `${path}?${search.toString()}`;
  useEffect(() => { noteNavigation(); }, [key]);
  return null;
}
