import { NewsletterForm } from "./newsletter-form";
import type { Metadata } from "next";
import Image from "next/image";
import { AppPreview } from "./app-preview";
import { JourneyRail, type JourneyStep } from "./journey-rail";

const appDescription = "Tivorah is a community app based in Adelaide, Australia. Join Hubs, find or offer services, create or book events, and buy or sell new and used local items.";

export const metadata: Metadata = {
  title: { absolute: "Tivorah | Australian Community App" },
  description: appDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: "/", siteName: "Tivorah", locale: "en_AU",
    title: "Tivorah | Australian Community App", description: appDescription,
  },
};

// Identify the app's operator without publishing a residential address or map pin.
const siteIdentity = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization", "@id": "https://tivorah.com/#organization",
      name: "Tivorah", legalName: "TIVORAH PTY LTD", url: "https://tivorah.com/",
      logo: "https://tivorah.com/tivorah-logo.png", description: appDescription,
      address: { "@type": "PostalAddress", addressLocality: "Adelaide", addressCountry: "AU" },
    },
    {
      "@type": "WebSite", "@id": "https://tivorah.com/#website",
      name: "Tivorah", url: "https://tivorah.com/", description: appDescription,
      publisher: { "@id": "https://tivorah.com/#organization" }, inLanguage: "en-AU",
    },
  ],
};

const featureRail: JourneyStep[] = [
  {
    step: "",
    title: "Keep the conversation going",
    body: "Message people and groups, share photos and voice notes, and turn a name on a list into someone you know.",
    shot: "/app-screens/2026-09-22/messages.png",
  },
  {
    step: "",
    title: "Work comes through people",
    body: "Jobs and referrals from members who have walked the path you are on, and know what it took.",
    shot: "/app-screens/2026-09-22/jobs.png",
  },
  {
    step: "",
    title: "Find something useful nearby",
    body: "Buy or sell new and used local items, find a service provider or offer your own services. Message directly to arrange the details.",
    shot: "/app-screens/2026-09-22/shop.png",
  },
  {
    step: "Start here",
    title: "Find your Hub",
    body: "A community built around your background, your interests, or the city you landed in. You see its rules before you are in.",
    shot: "/app-screens/2026-09-22/hubs.png",
  },
  {
    step: "",
    title: "You show up in person",
    body: "Create an event and offer tickets, or discover local events and book your place. Keep your ticket close when it is time to head out.",
    shot: "/app-screens/2026-09-22/events.png",
  },
  {
    step: "",
    title: "Discover people nearby",
    body: "A shared interest is a good place to start. Discover people near you and send a connection request.",
    shot: "/preview-discover-current-ios.png",
  },
  {
    step: "What holds it",
    title: "Someone looks after it",
    body: "Hub creators set the rules, review private Hub requests and help keep conversations welcoming. Members can report concerns.",
    shot: "/app-screens/2026-09-22/ballarat-hub.png",
  },
];

export default async function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteIdentity).replace(/</g, "\\u003c") }} />
      <section className="home-opening" aria-labelledby="home-title">
        <div className="page-shell opening-layout">
          <div className="opening-copy">
            <span className="opening-origin">Local roots. Australian connections.</span>
            <h1 id="home-title">A new place.<br />Your kind of<br /><em>people.</em></h1>
            <p className="opening-intro">Meet people through Hubs, find or offer services, create or book events, and buy or sell new and used local items on Tivorah.</p>
            <div className="opening-actions">
              <a className="button opening-primary" href="#updates">Join the waitlist <span aria-hidden="true">→</span></a>
              <a className="opening-tour-link" href="#preview">Take a look inside <span aria-hidden="true">↓</span></a>
            </div>
            <p className="opening-note">Coming soon across Australia · For adults 18+</p>
          </div>
          <div className="opening-product">
            <div className="opening-phones">
              <div className="opening-phone opening-phone-front">
                <Image src="/app-screens/2026-09-22/ballarat-hub.png" alt="Ballarat Arts and Culture Circle in Tivorah" width={1206} height={2622} sizes="(max-width: 600px) 45vw, (max-width: 980px) 260px, 23vw" priority />
              </div>
              <div className="opening-phone opening-phone-back">
                <Image src="/app-screens/2026-09-22/events.png" alt="Discover local events in Tivorah" width={1206} height={2622} sizes="(max-width: 600px) 40vw, (max-width: 980px) 230px, 21vw" priority />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="belonging-section" aria-labelledby="belonging-title">
        <div className="page-shell">
          <div className="belonging-heading">
            <span className="eyebrow">Your life, a little more connected</span>
            <h2 id="belonging-title">People first.<br />Possibilities follow.</h2>
            <p>Tivorah is an Australian community app that brings people, services, events and a local marketplace together.</p>
          </div>
          <div className="belonging-moments">
            <article><span className="moment-number">01 / Connect</span><h3>Find your circle.</h3><p>Join Hubs around your interests, culture or city. Meet people nearby and keep the conversation going.</p></article>
            <article><span className="moment-number">02 / Take part</span><h3>Put something in the diary.</h3><p>Create an event, offer tickets or book your place at something happening nearby.</p></article>
            <article><span className="moment-number">03 / Discover</span><h3>Make local life easier.</h3><p>Buy or sell new and used local items. Find a service provider or offer your own services.</p></article>
          </div>
        </div>
      </section>
      <section className="section" id="features">
        <div className="page-shell">
          <span className="eyebrow">How Tivorah works</span>
          <h2>
            One Hub.
            <br />
            Everything that follows.
          </h2>
          <p className="rail-hint">
            A Hub is your community group on Tivorah. The people, conversations,
            events and opportunities connected to it all have a place here.
          </p>
        </div>
        <JourneyRail steps={featureRail} initialIndex={3} />
      </section>
      <section className="people-interlude" id="new-here" aria-labelledby="people-title">
        <div className="page-shell people-interlude-layout">
          <div className="people-interlude-photo"><Image src="/community-asian-black.jpg" alt="Friends greeting each other outdoors" width={1600} height={1067} sizes="(max-width: 760px) 100vw, 50vw" /></div>
          <div className="people-interlude-copy">
            <span className="eyebrow">New city. Familiar feeling.</span>
            <h2 id="people-title">It starts with<br />someone saying <em>hello.</em></h2>
            <p>New to Australia, new to the neighbourhood, or ready to find your people? You deserve somewhere to start.</p>
            <p>Find a Hub in your area. Ask a question, share what you know and make plans with people nearby.</p>
            <a href="/why-tivorah">Why we&apos;re building Tivorah <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
      <AppPreview />
      <section className="local-tools" aria-labelledby="local-tools-title">
        <div className="page-shell local-tools-layout">
          <div className="local-tools-heading">
            <span className="eyebrow">For the people making things happen</span>
            <h2 id="local-tools-title">Bring what you do<br />to the people nearby.</h2>
            <p>Organising a meetup, offering a service or bringing a community together? Give it a place on Tivorah.</p>
          </div>
          <div className="local-tools-list">
            <article>
              <span aria-hidden="true">01</span>
              <div><h3>Your event, from invite to entry.</h3><p>Create events, offer tickets and manage attendees. Guests can find the details, book and keep their ticket on their phone.</p><a href="/hub-organisers">Explore event organising <span aria-hidden="true">↗</span></a></div>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <div><h3>Let local people find your skills.</h3><p>Give your service a home with photos, pricing and the areas you cover. Make it easier for people nearby to discover you and enquire.</p><a href="/service-providers">Explore service listings <span aria-hidden="true">↗</span></a></div>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <div><h3>Build a Hub people return to.</h3><p>Set your rules, welcome members and share announcements, conversations and opportunities in one place.</p><a href="/hub-organisers">Explore Hub organising <span aria-hidden="true">↗</span></a></div>
            </article>
          </div>
        </div>
      </section>
      <section className="adelaide-section" aria-labelledby="adelaide-title">
        <div className="page-shell adelaide-layout">
          <div><span className="eyebrow">Our home, our beginning</span><h2 id="adelaide-title">Proudly built<br />in Adelaide.</h2></div>
          <div className="adelaide-copy"><p>Made here. For connections everywhere.</p><p>We&apos;re building Tivorah in Adelaide for people finding their place across Australia. Wherever your story began, there is room for your next chapter.</p><a className="button secondary" href="/about">Meet Tivorah <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>
      <section className="waitlist" id="updates">
        <div className="page-shell waitlist-layout">
          <div>
            <span className="launch-status"><i />Coming soon</span>
            <h2>Your next hello could start here.</h2>
            <p>
              Join the waitlist for launch news and early access updates.
              We will let you know when Tivorah is ready in Australia.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
