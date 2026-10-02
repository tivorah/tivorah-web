import { pageMetadata } from "../../lib/site";
import Link from "next/link";

export const metadata = pageMetadata("About Tivorah", "Tivorah is an Australian community app operated by TIVORAH PTY LTD, based in Adelaide, Australia. Join Hubs, find or offer services, create or book events, and buy or sell new and used local items.", "/about");

const pillars = [
  ["Hubs", "Groups around a place, culture, profession, life stage or shared interest. Somewhere to ask questions, share what you know and find your people.", "/hubs"],
  ["Events", "From small meetups to community celebrations. Create an event, book a ticket and turn a conversation into a time and a place to meet.", "/events"],
  ["Services", "Find someone local you can talk to first, or offer your own skills to people nearby: tutoring, styling, repairs, care and more.", "/services"],
  ["Shop", "Buy and sell new and used items close to home. Every seller has their own shop, so you can see who you’re buying from.", "/shop"],
] as const;

const people = [
  ["New to a place", "You’ve arrived in a new suburb, city or country and want to know where to start, who to ask and where you might fit in."],
  ["Here for years", "You know the streets but not always the people. Tivorah helps you find the groups and gatherings already happening around you."],
  ["Making and offering", "You have a skill, a small business or something you make. Tivorah gives you a shop and a community that can find you."],
  ["Bringing people together", "You organise, host or lead. Tivorah gives your Hub and your events a home, with tools to keep them welcoming."],
] as const;

const beliefs = [
  ["People before profiles", "A profile is a starting point. What matters is the conversation, the help offered and the time spent together."],
  ["Online should lead to in person", "We measure success by the coffees, meetups and introductions that happen away from the screen."],
  ["Local is powerful", "The people a short walk or drive away can change how a place feels. We want them to be easier to find."],
  ["Everyone deserves a place", "Whether you’re newly arrived or a fifth-generation local, there should be a group where you feel understood."],
  ["Trust is built together", "Clear rules, honest listings, reporting and moderation keep communities safe, and every member plays a part."],
] as const;

export default function About() {
  return <article className="content about-page">
    <span className="eyebrow">About Tivorah</span>
    <h1>Belonging starts with connection.</h1>
    <p className="about-lead">Tivorah is an Australian community app, based in Adelaide, built to help people find groups where they feel understood, meet people nearby and turn online introductions into connections in person.</p>

    <section className="about-story" aria-labelledby="about-why">
      <h2 id="about-why">Why we’re building Tivorah</h2>
      <p>Most of us know the feeling. You move somewhere new and don’t know who to call. Or you’ve lived somewhere for years and still don’t know the people around the corner. The groups, events and small businesses that could make a place feel like home are out there, but they’re spread across chats, pages and word of mouth, and they’re easy to miss.</p>
      <p>Tivorah brings them together in one place, organised around the communities people actually belong to. It’s where you can find your people, discover what’s on, get help from someone local and support the makers and businesses around you.</p>
      <blockquote className="about-quote">We believe a city feels like home when you know a few people who know your name.</blockquote>
    </section>

    <section aria-labelledby="about-what">
      <h2 id="about-what">One place for local life</h2>
      <p>At the centre of Tivorah are <strong>Hubs</strong>. Everything else connects to them, so what you find comes with context: who shared it, which community it belongs to and how to start a conversation.</p>
      <div className="about-grid">
        {pillars.map(([title, body, href]) => <Link key={title} href={href} className="about-card">
          <strong>{title}</strong>
          <span>{body}</span>
          <em aria-hidden="true">Explore {title.toLowerCase()} →</em>
        </Link>)}
      </div>
    </section>

    <section aria-labelledby="about-who">
      <h2 id="about-who">Who Tivorah is for</h2>
      <div className="about-grid">
        {people.map(([title, body]) => <div key={title} className="about-card is-plain"><strong>{title}</strong><span>{body}</span></div>)}
      </div>
    </section>

    <section aria-labelledby="about-beliefs">
      <h2 id="about-beliefs">What we believe</h2>
      <ol className="about-beliefs">
        {beliefs.map(([title, body]) => <li key={title}><strong>{title}</strong><span>{body}</span></li>)}
      </ol>
    </section>

    <section aria-labelledby="about-safety">
      <h2 id="about-safety">How we look after each other</h2>
      <p>Community context can support trust, but it is not an identity, qualification, licence or background check. Tivorah combines clear rules, member reporting and moderation with reminders to verify claims that matter. Payments for tickets and orders are processed securely by our payment provider, and Hub creators set and uphold the rules for their groups.</p>
      <p>Read <Link href="/why-tivorah">Why Tivorah</Link>, our <Link href="/community-guidelines">Community Guidelines</Link> and our <Link href="/safety">Safety Centre</Link>.</p>
    </section>

    <section aria-labelledby="about-company">
      <h2 id="about-company">The company</h2>
      <p><strong>TIVORAH PTY LTD</strong> is an Australian proprietary company based in <strong>Adelaide, South Australia</strong>. We’re building Tivorah here, for people across Australia.</p>
      <dl className="company-details">
        <div><dt>Australian Business Number (ABN)</dt><dd>94 702 094 844</dd></div>
        <div><dt>Australian Company Number (ACN)</dt><dd>702 094 844</dd></div>
        <div><dt>Based in</dt><dd>Adelaide, South Australia</dd></div>
      </dl>
      <p><a href="https://abr.business.gov.au/ABN/View?id=94702094844" className="company-record-link" target="_blank" rel="noopener noreferrer">View our official ABN record <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></p>
      <p>For privacy and security, Tivorah does not publish a residential or full street address on this website. Formal notices can be directed through our <Link href="/contact">contact and complaints page</Link>.</p>
    </section>

    <section className="about-cta" aria-labelledby="about-join">
      <h2 id="about-join">Find your people</h2>
      <p>Join a Hub, go to something nearby or say hello to someone new. That’s how belonging starts.</p>
      <div>
        <Link className="product-primary" href="/hubs">Explore Hubs</Link>
        <Link className="product-secondary" href="/events">See what’s on</Link>
      </div>
    </section>
  </article>;
}
