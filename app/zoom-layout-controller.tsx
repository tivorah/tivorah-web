"use client";

import { useEffect } from "react";

const CENTER_AT_OR_BELOW = 0.8;

export function ZoomLayoutController() {
  useEffect(() => {
    const root = document.documentElement;

    const updateLayoutMode = () => {
      // Desktop browser zoom increases innerWidth while outerWidth remains tied
      // to the window. At 75% zoom this ratio is approximately 0.75.
      const zoomRatio = window.outerWidth > 0
        ? window.outerWidth / window.innerWidth
        : 1;
      root.classList.toggle("layout-zoomed-out", zoomRatio <= CENTER_AT_OR_BELOW);
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    window.visualViewport?.addEventListener("resize", updateLayoutMode);

    return () => {
      root.classList.remove("layout-zoomed-out");
      window.removeEventListener("resize", updateLayoutMode);
      window.visualViewport?.removeEventListener("resize", updateLayoutMode);
    };
  }, []);

  return null;
}
