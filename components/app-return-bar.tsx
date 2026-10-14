"use client";
import { useEffect, useState } from "react";
import { APP_RETURN_URL, forgetOpenedFromApp, openedFromApp } from "../lib/app-return";

/** "Back to the Tivorah app", shown only in a browser tab the app opened. */
export function AppReturnBar() {
  const [visible, setVisible] = useState(false);
  // sessionStorage only exists in the browser, so this is read after mount.
  useEffect(() => { setVisible(openedFromApp()); }, []);
  if (!visible) return null;
  return (
    <div className="app-return-bar" role="region" aria-label="Return to the Tivorah app">
      <a className="app-return-link" href={APP_RETURN_URL}><span aria-hidden="true">‹</span> Back to the Tivorah app</a>
      <button type="button" className="app-return-dismiss" aria-label="Hide this bar" onClick={() => { forgetOpenedFromApp(); setVisible(false); }}>×</button>
    </div>
  );
}
