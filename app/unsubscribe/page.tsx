import type { Metadata } from "next";
import { LegalNavigation } from "../legal-navigation";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop Tivorah launch news and marketing updates.",
};

export default function Unsubscribe() {
  return (
    <article className="content content-form-page">
      <span className="eyebrow">Email preferences</span>
      <h1>Stop marketing updates</h1>
      <p>
        Enter the email address receiving Tivorah launch news or marketing. We
        will stop those messages without closing a Tivorah account or stopping
        essential account, security, ticket or safety communications.
      </p>
      <UnsubscribeForm />
      <p>
        You can also email <a href="mailto:privacy@tivorah.com?subject=Unsubscribe">privacy@tivorah.com</a> from
        the affected address. We action valid marketing opt-outs within five
        working days.
      </p>
      <LegalNavigation />
    </article>
  );
}
