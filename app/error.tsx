"use client";
import Link from "next/link";
export default function PageError({ reset }: { reset: () => void }) {
  return <section className="content recovery-state" role="alert">
    <h1>This page couldn’t load.</h1>
    <p>Check your connection and try again. If the problem continues, contact Tivorah support.</p>
    <button className="button" type="button" onClick={reset}>Try again</button>
    <p><Link href="/contact">Contact support</Link></p>
  </section>;
}
