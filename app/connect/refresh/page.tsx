import type { Metadata } from "next";

export const metadata: Metadata = { title: "Restart Stripe setup", description: "Restart an expired Stripe Connect onboarding link from Tivorah." };

export default function ConnectRefresh() { return <article className="content"><span className="eyebrow">Stripe Connect</span><h1>Your secure setup link expired.</h1><p>Stripe onboarding links are single-use and time limited. Return to Bookings &amp; payouts in the Tivorah app and select Stripe setup again to create a fresh link.</p><p><a className="button" href="tivorah://profile/bookings">Open Tivorah</a></p></article>; }
