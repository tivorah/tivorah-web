import { NewsletterForm } from "./newsletter-form";
import Image from "next/image";
import { AppPreview } from "./app-preview";
import { JourneyRail, type JourneyStep } from "./journey-rail";
import { BrandedQrCode } from "./branded-qr-code";

// What makes Tivorah different from a general community app. Every claim here ships
// today: hub rules, approval-gated hubs, verified-member trade and moderation are all
// live in the product.
const differences = [
  [
    "Hubs with real rules",
    "Every hub sets its own house rules, and you see them before you join. No guessing what is welcome here.",
  ],
  [
    "Trade with people you know",
    "A seller is a confirmed member of your hub, not an anonymous account. Buying from your community means something.",
  ],
  [
    "Doors that can close",
    "Some communities only work when entry is considered. Hub creators approve who joins, so the space stays what it was built to be.",
  ],
  [
    "Moderation that answers to the hub",
    "Hub creators and moderators look after their own space, with the tools to act when someone crosses a line.",
  ],
];

const featureRail: JourneyStep[] = [
  {
    step: "Start here",
    title: "You join a hub",
    body: "A community built around your background, your interests, or the city you landed in. You see its rules before you are in.",
    shot: "/preview-hubs-ios.png",
  },
  {
    step: "",
    title: "You find your people",
    body: "See who else is in the hub and who is closest to you. Not strangers with a shared postcode — people with a shared story.",
    shot: "/preview-people-ios.png",
  },
  {
    step: "",
    title: "You actually talk",
    body: "Message people and groups, share photos and voice notes, and turn a name on a list into someone you know.",
    shot: "/preview-messages-ios.png",
  },
  {
    step: "",
    title: "You buy from each other",
    body: "Every seller is a confirmed member of your hub. Trading with someone who has to see you again works differently.",
    shot: "/preview-shop-ios.png",
  },
  {
    step: "",
    title: "Work comes through people",
    body: "Jobs and referrals from members who have walked the path you are on, and know what it took.",
    shot: "/preview-hub-jobs-ios.png",
  },
  {
    step: "",
    title: "You show up in person",
    body: "Events your hub is actually going to, with a ticket that lives on your phone.",
    shot: "/preview-events-ios.png",
  },
  {
    step: "",
    title: "It reaches your street",
    body: "Listings, events and conversations happening near you, from the communities you already belong to.",
    shot: "/preview-discover-ios.png",
  },
  {
    step: "What holds it",
    title: "Someone looks after it",
    body: "Hub creators set the rules, approve who joins and can act when someone crosses a line. That is why the rest works.",
    shot: "/preview-hub-profile-ios.png",
  },
];

export default async function Home() {
  const downloadUrl =
    process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "https://tivorah.com/#download";
  const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL || "#updates";
  const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL || "#updates";
  return (
    <>
      <section className="hero hero-home">
        <div className="hero-world" aria-hidden="true">
          <div className="world-glow" />
          <div className="hero-showcase">
            <div className="hero-people">
              <div className="hero-people-bubble" />
              <Image
                className="hero-people-photo hero-photo-main"
                src="/community-asian-black.jpg"
                alt=""
                width={1600}
                height={1067}
                sizes="(max-width: 850px) 240px, 300px"
                priority
              />
              <Image
                className="hero-people-photo hero-photo-second"
                src="/community-women.jpg"
                alt=""
                width={512}
                height={568}
                sizes="180px"
              />
              <Image
                className="hero-people-photo hero-photo-third"
                src="/community-friends.jpg"
                alt=""
                width={512}
                height={568}
                sizes="150px"
              />
            </div>
            <div className="hero-product-copy">
              <span>The app, in action</span>
              <strong>One place for local life.</strong>
              <small>
                <i /># Communities across Australia
              </small>
            </div>
            <div className="hero-app-preview">
              <div className="hero-preview-halo" />
              <div className="hero-device hero-device-back">
                <Image
                  src="/preview-hub-profile-ios.png"
                  alt="Adelaide Weekend Crew hub profile in Tivorah"
                  width={1179}
                  height={2556}
                  sizes="(max-width: 540px) 160px, 240px"
                  priority
                />
              </div>
              <div className="hero-device hero-device-front">
                <Image
                  src="/preview-discover-ios.png"
                  alt="Discovering nearby people in Tivorah"
                  width={1179}
                  height={2556}
                  sizes="(max-width: 540px) 185px, 265px"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="signal signal-one" />
          <div className="signal signal-two" />
          <div className="signal signal-three" />
          <div className="land land-back" />
          <div className="land land-front" />
        </div>
        <div className="hero-message">
          <div className="hero-message-inner">
            <div className="hero-copy">
              <span className="eyebrow light">
                Your community, wherever you are in Australia
              </span>
              <h1>
                Your people are
                <br />
                already here.
              </h1>
            </div>
            <div className="hero-intro">
              <p>
                Tivorah is built around communities that know you — where the
                people you buy from, work with and turn up for are members of
                the same Hub as you.
              </p>
              <div className="actions">
                <a className="button hero-primary" href="#updates">
                  Get app updates <span>→</span>
                </a>
                <a className="button hero-secondary" href="#different">
                  What makes it different
                </a>
              </div>
              <div className="trust-row">
                <span>Community-run hubs</span>
                <span>Verified members</span>
                <span>Real moderation</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section" id="different">
        <div className="page-shell">
          <span className="eyebrow">Why Tivorah, and not a group chat</span>
          <h2>Communities with something at stake.</h2>
          <p>
            Anyone can start a group. What is hard is a place where people
            behave like neighbours — because they are known, the rules are
            clear, and someone is looking after it.
          </p>
          <div className="grid">
            {differences.map(([title, body], i) => (
              <article key={title}>
                <span className="number">{String(i + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section about-home" id="about">
        <div className="page-shell about-home-layout">
          <div>
            <span className="eyebrow">About Tivorah</span>
            <h2>
              Community is the purpose.
              <br />A hub is how it begins.
            </h2>
          </div>
          <div className="about-home-copy">
            <p>
              Tivorah is an Australian-founded platform that brings the useful
              parts of local life into one trusted place. It helps people find
              communities where they feel understood, meet members nearby and
              turn online introductions into real-world connections.
            </p>
            <p>
              <strong>
                A hub is Tivorah&apos;s name for a community group.
              </strong>{" "}
              It can be built around a suburb, culture, profession, life
              experience or shared interest. Inside it, members can talk,
              organise events, share jobs and referrals, buy or sell useful
              items and recommend services to people they are connected to.
            </p>
            <p>
              Instead of asking people to build a different network for every
              need, Tivorah lets trust travel with the community—from a first
              conversation to a local event, a referral, a purchase or a new
              friendship.
            </p>
            <a className="about-home-link" href="/about">
              Read more about Tivorah <span>→</span>
            </a>
          </div>
        </div>
      </section>
      <section className="section" id="features">
        <div className="page-shell">
          <span className="eyebrow">How Tivorah works</span>
          <h2>
            One hub.
            <br />
            Everything that follows.
          </h2>
          <p className="rail-hint">
            A hub is Tivorah&apos;s name for a community group. Join one and the
            people, conversations, listings, jobs and events connected to it
            come together in one place.
          </p>
        </div>
        <JourneyRail steps={featureRail} />
      </section>
      <AppPreview />
      <section className="showcase" id="new-here">
        <div className="page-shell">
          <div className="showcase-copy">
            <span className="eyebrow">New to Australia?</span>
            <h2>Arrive with questions. Find people with answers.</h2>
            <p>
              You can arrive in Australia carrying years of experience, a heart
              full of hope and a plan for the life ahead—yet still feel as
              though you have become unknown. The hardest part is often facing
              every first alone: the first rental search, the first job
              application asking for local experience, the first quiet weekend
              with nobody to call, and the first moment you wonder where you
              belong. A search engine can give you instructions. It cannot say,
              “I have stood where you are standing.” Tivorah connects you with
              people who can.
            </p>
            <p>
              Join Hubs such as <strong>New to Australia</strong>,{" "}
              <strong>Newcomer Career Circle</strong> or{" "}
              <strong>International Students Australia</strong>. Ask the
              questions that feel too small or too personal for a search box.
              Meet people who understand the courage it took to begin again,
              discover opportunities shared through real connections and build a
              circle that knows your name—until Australia feels less like the
              place you moved to and more like a place where you belong.
            </p>
            <div className="actions">
              <a className="button" href="#download">
                Find your first Hub
              </a>
            </div>
          </div>
          <div className="showcase-photo">
            <div className="showcase-photo-bubble" />
            <Image
              src="/community-women.jpg"
              alt="Members of a Tivorah hub walking together"
              width={900}
              height={1350}
              sizes="(max-width: 850px) 100vw, 420px"
            />
          </div>
        </div>
      </section>
      <section className="download" id="download">
        <div className="page-shell download-layout">
          <div>
            <span className="eyebrow light">Tivorah in your pocket</span>
            <h2>Take your community with you.</h2>
            <p>
              Choose your device or scan the QR code with your phone. Store
              links can be activated the moment each app is published.
            </p>
            <div className="store-buttons">
              <a href={iosUrl} className="store-button">
                <span className="store-icon">●</span>
                <span>
                  <small>Download for</small>
                  <strong>iPhone</strong>
                </span>
              </a>
              <a href={androidUrl} className="store-button">
                <span className="store-icon">▶</span>
                <span>
                  <small>Download for</small>
                  <strong>Android</strong>
                </span>
              </a>
            </div>
          </div>
          <div className="qr-card">
            <div className="qr-code-wrap">
              <BrandedQrCode value={downloadUrl} />
            </div>
            <strong>Scan to get Tivorah</strong>
            <small>Open the camera on your phone</small>
          </div>
        </div>
      </section>
      <section className="waitlist" id="updates">
        <div className="page-shell waitlist-layout">
          <div>
            <span className="eyebrow light">Tivorah news</span>
            <h2>Stay close to what comes next.</h2>
            <p>
              Subscribe for Tivorah news, product stories and important app
              updates, delivered without unnecessary noise.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
