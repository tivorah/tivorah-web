import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stripe setup returned", description: "Return to Tivorah after Stripe Connect setup." };

export default function ConnectReturn() { return <article className="content"><span className="eyebrow">Stripe Connect</span><h1>Return to Tivorah.</h1><p>Stripe has returned you to Tivorah. Open the app to refresh your payout status and see whether any verification requirements remain.</p><p><a className="button" href="tivorah://profile/bookings">Open Tivorah</a></p><p>Completing the form does not guarantee immediate payment or payout access. Stripe may still be reviewing submitted information.</p></article>; }
