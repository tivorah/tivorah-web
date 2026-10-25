import Link from "next/link";
import { MINIMUM_AGE } from "../../lib/age-gate";

/** Shown instead of sign-up when a birth date under 18 was entered: Tivorah is for adults only. */
export function AgeRestricted() {
  return (
    <div className="product-notice" role="alert">
      <h2>Tivorah is for adults</h2>
      <p>You need to be {MINIMUM_AGE} or older to create a Tivorah account, so we can’t sign you up right now.</p>
      <p>If you’re struggling or need someone to talk to, Kids Helpline is free and open 24/7 on 1800 55 1800.</p>
      <p><Link className="product-secondary" href="/auth/signin">Back to sign in</Link></p>
      <p><a href="mailto:support@tivorah.com?subject=Date%20of%20birth%20entered%20by%20mistake">Entered the wrong date of birth? Contact support</a></p>
    </div>
  );
}
