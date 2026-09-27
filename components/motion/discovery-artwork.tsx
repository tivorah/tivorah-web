"use client";
import dynamic from "next/dynamic";
import { Component, ReactNode, useEffect, useState } from "react";
const Scene = dynamic(() => import("./discovery-scene"), { ssr: false });
class ArtworkBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function DiscoveryArtwork({ kind }: { kind: string }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const media = matchMedia(
      "(prefers-reduced-motion: no-preference) and (min-width: 850px)",
    );
    const update = () =>
      setEnabled(media.matches && document.visibilityState === "visible");
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div className="discover-artwork" aria-hidden="true">
      <div className="discover-artwork-fallback">
        <span>✳</span>
        <span>◎</span>
        <span>↗</span>
      </div>
      {enabled ? (
        <ArtworkBoundary>
          <Scene kind={kind} />
        </ArtworkBoundary>
      ) : null}
    </div>
  );
}
