import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import "./why-tivorah.css";

export const metadata = pageMetadata(
  "Why Tivorah",
  "Find your people, discover local events and services, and make everyday life in Australia feel more connected. See how Tivorah Hubs help you get started.",
  "/why-tivorah",
);

const reasons = [
  ["A place to ask your first question", "Find a Hub around your city, culture, interests or profession. Ask for local recommendations, share an experience or join a conversation with people who understand the context."],
  ["A reason to meet in person", "Discover events and gatherings, check the details and book your place where tickets are available. Having a shared activity gives you somewhere to start a conversation."],
  ["Local skills within reach", "Browse services, learn about the person offering them and ask about what you need. From help around the home to a skill you want to learn, you can explore your options before making arrangements."],
  ["Useful things close to home", "Buy or sell new and used items nearby. Look through photos and listing details, then contact the seller to ask questions and arrange the next step."],
  ["Conversations you can continue", "Keep in touch through private messages and take part in Hub Banter. An introduction can become an ongoing conversation, without having to exchange your phone number first."],
  ["A place to contribute, too", "Share what you know, offer a service, organise an event or create a Hub. Whether you are new to Australia or have lived here for years, your experience can help someone else get started."],
] as const;

export default function WhyTivorah() {
  return <article className="content about-page why-tivorah-page">
    <span className="eyebrow">Why Tivorah</span>
    <h1>Make where you live feel more like home.</h1>
    <p className="about-lead">Knowing a place and feeling part of it are different things. Tivorah helps you find people to connect with, things to take part in and local skills you can turn to—all through an Australian community app built around everyday life.</p>
    <p>Whether you have just arrived, moved suburbs or simply want to know more people nearby, you can start with one Hub, one question or one event.</p>
    <p><Link className="button" href="/hubs">Explore Hubs <span aria-hidden="true">→</span></Link></p>

    <section aria-labelledby="why-start">
      <h2 id="why-start">You should not need to know someone to get started.</h2>
      <p>A good recommendation often travels through someone you already know. So does an invitation, a useful local tip or an introduction. When you are new to a place—or your circle is small—it can be difficult to find your way into those conversations.</p>
      <p>Tivorah gives you a place to look. Find Hubs around shared interests, culture, work or location, see what they are about and choose the ones that fit you. Public Hubs and private Hubs with membership requests give organisers different ways to bring people together.</p>
      <blockquote className="about-quote">You do not have to build a whole new circle at once. Start with something you have in common.</blockquote>
    </section>

    <section aria-labelledby="why-everyday">
      <h2 id="why-everyday">More ways to make everyday life easier</h2>
      <p>Connection becomes useful in small, practical moments: finding someone to ask, something to do this weekend or a person who offers the skill you need.</p>
      <div className="about-grid">
        {reasons.map(([title, body]) => <div className="about-card" key={title}>
          <strong>{title}</strong><span>{body}</span>
        </div>)}
      </div>
    </section>

    <section aria-labelledby="why-example">
      <h2 id="why-example">What could that look like for you?</h2>
      <p>Imagine you have just moved to Adelaide. You find a local Hub, read its description and rules, and join or request membership. You introduce yourself in Banter and ask what people enjoy doing nearby.</p>
      <p>From there, you might browse an upcoming event, look for an item for your new home or explore a local service. When you meet someone you would like to stay in touch with, you can continue the conversation privately.</p>
      <p>These are different parts of settling into a place. Tivorah brings the tools for them together, so your next step is easier to find. What is available depends on the people, Hubs and listings active in your area.</p>
    </section>

    <section aria-labelledby="why-for-you">
      <h2 id="why-for-you">New arrivals, long-time locals and the people bringing them together</h2>
      <ul>
        <li><strong>Starting somewhere new?</strong> Find a starting point for questions, introductions and local activities.</li>
        <li><strong>Already feel at home?</strong> Discover new interests, welcome newcomers and share the knowledge you wish you had earlier.</li>
        <li><strong>Offering a skill or running a small business?</strong> Give people a place to discover your services and ask about what you offer.</li>
        <li><strong>Organising a group?</strong> Give your Hub a home for conversations, announcements, events and opportunities, with membership and moderation tools.</li>
      </ul>
      <p>Tivorah is based in Adelaide and built for adults aged 18 and over. You do not need to be new to Australia to belong here.</p>
    </section>

    <section aria-labelledby="why-context">
      <h2 id="why-context">Know more before you take the next step</h2>
      <p>Before joining a Hub, you can read its purpose and rules. Before contacting a provider or seller, you can look at their profile and listing details. Before attending an event, you can check the information its organiser has shared.</p>
      <p>Hub organisers can manage membership and moderate conversations. Members can report concerns and block people when needed. These tools help you make choices about where and how you participate.</p>
      <p>A profile or listing is a starting point for your own checks, not a guarantee. Ask questions, confirm arrangements and check any qualifications or safety information relevant to your plans. Our <Link href="/safety">safety guidance</Link> explains how to take part with care.</p>
    </section>

    <section aria-labelledby="why-first-step">
      <h2 id="why-first-step">Find one thing you want to be part of.</h2>
      <p>You do not need a full plan. Browse Hubs and look for a place, an interest or a conversation that feels relevant to you. Use the Tivorah app to join in and keep the connection going.</p>
      <p><Link className="button" href="/hubs">Explore Hubs <span aria-hidden="true">→</span></Link></p>
      <p>Bringing people together yourself? Learn about <Link href="/hub-organisers">running a Hub</Link> or <Link href="/service-providers">offering a service</Link>.</p>
    </section>
  </article>;
}
