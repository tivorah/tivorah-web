"use client";

import { useState } from "react";
import { DirectionsLink } from "./directions-link";
import styles from "./location-map.module.css";

/** No map provider is contacted until the visitor chooses View map. */
export function LocationMap({ destination, approximate = false }: { destination: string; approximate?: boolean }) {
  const [revealedDestination, setRevealedDestination] = useState<string | null>(null);
  const [loadedDestination, setLoadedDestination] = useState<string | null>(null);
  const revealed = revealedDestination === destination;
  return <div className={styles.wrapper}>
    <div className={styles.map}>
      {revealed ? <>
        {loadedDestination !== destination ? <p className={styles.loading} role="status">Loading map…</p> : null}
        <iframe title={`Map showing ${destination}`} src={`https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`} referrerPolicy="no-referrer" onLoad={() => setLoadedDestination(destination)} />
      </> : <div className={styles.placeholder} aria-hidden="true"><svg viewBox="0 0 400 176" preserveAspectRatio="xMidYMid slice"><rect width="400" height="176" fill="#e8e9e5"/><rect x="30" y="15" width="100" height="65" rx="16" fill="#cbdfc9"/><path d="M280 -20 Q210 90 330 200" stroke="#c5dfeb" strokeWidth="44" fill="none"/><path d="M-20 130 L420 30 M140 -20 L220 200 M40 -20 L100 200" stroke="white" strokeWidth="16"/></svg></div>}
      <button type="button" className={revealed ? styles.hide : styles.reveal} onClick={() => { setRevealedDestination(revealed ? null : destination); setLoadedDestination(null); }} aria-expanded={revealed}>{revealed ? "Hide map" : "View map"}</button>
      {revealed ? <div className={styles.directions}><DirectionsLink destination={destination} /></div> : null}
    </div>
    {approximate ? <p className={styles.note}>General area only. Confirm the exact location with the seller.</p> : null}
  </div>;
}
