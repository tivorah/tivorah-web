"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api/client";

// Door check-in: scan a ticket's QR with this device's camera, type the 6-digit
// entry code, or use a USB/Bluetooth barcode scanner (it types into the code box
// and presses Enter). Every result is shown large so door staff can read it fast.
type Result = { ok: boolean; title: string; detail: string; at: number };
type CheckInResponse = { ticketTypeName?: string | null; attendeeName?: string | null };
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };

export function EventCheckIn({ id, published }: { id: number; published: boolean }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [recent, setRecent] = useState<Result[]>([]);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "error">("off");
  const [cameraError, setCameraError] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const loop = useRef<number | null>(null);
  const lastScan = useRef<{ value: string; at: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const checkIn = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value || busyRef.current) return;
    // Ignore the same code read again within 3 seconds (cameras read many frames).
    if (lastScan.current && lastScan.current.value === value && Date.now() - lastScan.current.at < 3000) return;
    lastScan.current = { value, at: Date.now() };
    busyRef.current = true; setBusy(true);
    const body = /^\d{6}$/.test(value) ? { shortCode: value } : { qrPayload: value };
    let next: Result;
    try {
      const data = await api<CheckInResponse>(`/events/${id}/check-ins`, { method: "POST", body: JSON.stringify(body) });
      next = { ok: true, title: "Checked in", detail: [data?.ticketTypeName, data?.attendeeName].filter(Boolean).join(" · ") || "The guest can enter.", at: Date.now() };
      navigator.vibrate?.(60);
    } catch (cause) {
      next = { ok: false, title: "Not admitted", detail: cause instanceof Error ? cause.message : "This ticket could not be checked in.", at: Date.now() };
      navigator.vibrate?.([80, 60, 80]);
    }
    setResult(next);
    setRecent((items) => [next, ...items].slice(0, 8));
    setCode("");
    busyRef.current = false; setBusy(false);
    input.current?.focus();
  }, [id]);

  const stopCamera = useCallback(() => {
    if (loop.current) cancelAnimationFrame(loop.current);
    loop.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera("off");
  }, []);

  async function startCamera() {
    setCamera("starting"); setCameraError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      stream.current = media;
      const element = video.current!;
      element.srcObject = media;
      await element.play();
      setCamera("on");
      // Native detector where supported (Chrome, Edge, Android); jsQR elsewhere (Safari, Firefox).
      const Native = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => Detector }).BarcodeDetector;
      const detector = Native ? new Native({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const scan = async () => {
        if (!stream.current) return;
        if (element.readyState >= 2 && !busyRef.current) {
          try {
            if (detector) {
              const [found] = await detector.detect(element);
              if (found?.rawValue) void checkIn(found.rawValue);
            } else if (jsQR && context) {
              canvas.width = element.videoWidth; canvas.height = element.videoHeight;
              context.drawImage(element, 0, 0);
              const frame = context.getImageData(0, 0, canvas.width, canvas.height);
              const found = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
              if (found?.data) void checkIn(found.data);
            }
          } catch { /* A frame that can't be read is skipped. */ }
        }
        loop.current = requestAnimationFrame(() => void scan());
      };
      void scan();
    } catch (cause) {
      stopCamera();
      setCamera("error");
      setCameraError(cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "Camera access was blocked. Allow the camera for this site in your browser settings, then try again."
        : "No camera is available. Use the code box with a barcode scanner or type the 6-digit code.");
    }
  }

  useEffect(() => stopCamera, [stopCamera]);
  useEffect(() => { if (!result) return; const timer = window.setTimeout(() => setResult(null), 6000); return () => window.clearTimeout(timer); }, [result]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lastScan.current = null; // a deliberate retry from the box is always allowed
    void checkIn(code);
  }

  if (!published) return <section className="event-checkin"><div className="event-empty"><strong>Check-in opens when the event is published</strong><p>Publish your event to start scanning tickets at the door.</p></div></section>;

  return <section className="event-checkin">
    <header className="event-tab-head">
      <div>
        <h2>Check in guests</h2>
        <p>Check in each guest at the door.</p>
      </div>
    </header>

    <div className={`checkin-result${result ? (result.ok ? " is-ok" : " is-error") : ""}`} role="status" aria-live={result && !result.ok ? "assertive" : "polite"}>
      {result ? <>
        <span className="checkin-result-icon" aria-hidden="true">{result.ok ? "✓" : "!"}</span>
        <div><strong>{result.title}</strong><span>{result.detail}</span></div>
      </> : <div><strong>Ready for the next guest</strong><span>Scan a ticket or enter its code below.</span></div>}
    </div>

    <div className={`checkin-grid${camera === "error" ? " is-camera-error" : ""}`}>
      <div className="showcase-step checkin-camera">
        <div className="checkin-method-head"><h3>Scan with camera</h3><span>Phone or computer camera</span></div>
        <div className={`checkin-viewfinder${camera === "on" ? " is-on" : ""}${camera === "error" ? " is-error" : ""}`}>
          <video ref={video} muted playsInline aria-label="Camera preview for scanning tickets" />
          {camera === "on" ? <span className="checkin-frame" aria-hidden="true"><span className="checkin-scanline" /></span> : camera === "error" ? <div className="checkin-camera-recovery" role="alert"><strong>Camera unavailable</strong><p>{cameraError}</p><span>You can still use the code field.</span></div> : <div className="checkin-placeholder">
            <span className="checkin-placeholder-icon" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h1.5M16 13v3h-3" /></svg>
            </span>
            <strong>{camera === "starting" ? "Opening your camera…" : "Camera is ready when you are"}</strong>
            <span>Point it at the QR code on a phone or printed ticket.</span>
          </div>}
        </div>
        {camera === "on"
          ? <button type="button" className="product-secondary press-fx" onClick={stopCamera}>Stop camera</button>
          : <button type="button" className="product-secondary press-fx" onClick={() => void startCamera()} disabled={camera === "starting"}>{camera === "starting" ? "Starting camera…" : camera === "error" ? "Try camera again" : "Open camera"}</button>}
        {camera === "on" ? <p className="showcase-hint">Hold the QR code inside the frame. Check-in happens automatically.</p> : null}
      </div>

      <form className="showcase-step checkin-manual" onSubmit={submit}>
        <div className="checkin-method-head"><h3>Enter ticket code</h3><span>6-digit code or barcode scanner</span></div>
        <label>Ticket code
          <input ref={input} className="checkin-code" value={code} onChange={(event) => setCode(event.target.value)} inputMode="text" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={4000} placeholder="482913" />
        </label>
        <button className="product-primary press-fx" disabled={busy || !code.trim()}>{busy ? "Checking…" : "Check in guest"}</button>
        <p className="showcase-hint">Using a barcode scanner? Focus this field and scan. A scanner that sends Enter submits automatically.</p>
      </form>
    </div>

    {recent.length ? <div className="checkin-recent">
      <h3>This session</h3>
      <ul>{recent.map((item) => <li key={item.at} className={item.ok ? "is-ok" : "is-error"}><span aria-hidden="true">{item.ok ? "✓" : "!"}</span><strong>{item.title}</strong><span>{item.detail}</span><time>{new Date(item.at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></li>)}</ul>
    </div> : null}
  </section>;
}
