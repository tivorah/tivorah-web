"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: "#FAF8FD", color: "#241631", fontFamily: "system-ui, sans-serif" }}>
    <main style={{ maxWidth: 640, margin: "12vh auto", padding: 24 }}>
      <h1>Tivorah couldn’t load.</h1>
      <p>Please try again. If the problem continues, email <a href="mailto:support@tivorah.com">support@tivorah.com</a>.</p>
      <button onClick={reset} style={{ minHeight: 44, padding: "12px 24px", font: "inherit", background: "#7036B5", color: "white", border: 0, borderRadius: 8 }}>Try again</button>
    </main>
  </body></html>;
}
