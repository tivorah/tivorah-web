import type { Metadata } from "next";
import styles from "./return.module.css";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Stripe setup returned", description: "Return to Tivorah after Stripe Connect setup." };

export default function ConnectReturn() {
  return (
    <article className={styles.page} aria-labelledby="connect-title">
      <div className={styles.icon} aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <path d="M10 5h4M11 19h2" />
        </svg>
      </div>
      <span className={styles.label}>Payout setup</span>
      <h1 id="connect-title" className={styles.title}>Back to Tivorah</h1>
      <p className={styles.intro}>Open the app to check your payout status and any next steps from Stripe.</p>
      <a className={`button ${styles.open}`} href="tivorah://profile/payouts">
        Open Tivorah <span aria-hidden="true">→</span>
      </a>
      <p className={styles.destination}>Takes you to Payouts</p>
      <aside className={styles.note} aria-label="About your payout status">
        <strong>Your status is in the app</strong>
        <p>Returning from Stripe doesn’t confirm approval. Stripe may still need more details or time to review your information.</p>
      </aside>
      <details className={styles.help}>
        <summary>App didn’t open?</summary>
        <p>Close this browser window and open Tivorah. Go to your profile, then <strong>Payouts</strong> to check your status.</p>
      </details>
    </article>
  );
}
