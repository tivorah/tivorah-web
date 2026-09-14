import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata: Metadata = {
  title: "Legal & Trust Centre",
  description: "Tivorah policies, safety information and account controls.",
};

const sections = [
  ["Privacy Policy", "What Tivorah collects, why we use it and your privacy choices.", "/privacy"],
  ["Terms of Use", "The agreement that applies when you create an account or use Tivorah.", "/terms"],
  ["Community Guidelines", "The conduct and content standards for every Tivorah surface.", "/community-guidelines"],
  ["Safety Centre", "How to report harm, block someone, appeal a decision and get urgent help.", "/safety"],
  ["Account deletion", "Delete in the app or request deletion when you cannot sign in.", "/account-deletion"],
  ["Cookies", "The limited browser storage used by the website and admin portal.", "/cookies"],
  ["Accessibility", "Our accessibility commitment and how to report a barrier.", "/accessibility"],
  ["Important disclaimer", "Important limits on community, migration, job, event and marketplace information.", "/disclaimer"],
  ["Contact & complaints", "Reach support, privacy and safety or make a complaint.", "/contact"],
] as const;

export default function LegalCentre() {
  return (
    <article className="content content-wide">
      <span className="eyebrow">Legal &amp; trust</span>
      <h1>Clear rules. Useful controls.</h1>
      <p className="content-lead">
        These pages explain how Tivorah works, what we expect from members and
        what you can do when something goes wrong. They apply to the website,
        mobile app and related Tivorah services unless a page says otherwise.
      </p>
      <div className="legal-grid">
        {sections.map(([title, body, href]) => (
          <Link className="legal-card" href={href} key={href}>
            <h2>{title}</h2>
            <p>{body}</p>
            <span>Read this page →</span>
          </Link>
        ))}
      </div>
      <div className="legal-callout">
        <strong>Need help choosing where to start?</strong>
        <p>
          Use the <Link href="/safety">Safety Centre</Link> for harmful content
          or immediate-risk guidance, <Link href="/privacy">Privacy</Link> for
          personal-information requests, and <Link href="/contact">Contact &amp;
          complaints</Link> for everything else.
        </p>
      </div>
      <LegalNavigation />
    </article>
  );
}
