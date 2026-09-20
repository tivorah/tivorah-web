import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Tivorah", description: "About Tivorah Pty Ltd and the community platform we are building in Australia." };

export default function About() {
  return <article className="content">
    <span className="eyebrow">About Tivorah</span>
    <h1>Belonging starts with connection.</h1>
    <p>Tivorah is an Australian-founded community platform designed to help people find communities where they feel understood, meet people nearby and turn online introductions into useful real-world connections.</p>
    <p>At the centre of Tivorah are Hubs: groups built around a location, culture, profession, life experience or shared interest. Members can talk, discover events, share opportunities and find useful local services in a community context.</p>
    <h2>The company</h2>
    <p><strong>TIVORAH PTY LTD</strong> is an Australian proprietary company based in <strong>Parafield Gardens, South Australia</strong>.</p>
    <dl><dt>Australian Business Number</dt><dd>94 702 094 844</dd><dt>ABN status</dt><dd>Active</dd><dt>Public business location</dt><dd>Parafield Gardens, South Australia, Australia</dd></dl>
    <p>For privacy and security, Tivorah does not publish a residential or full street address on this website. Formal notices can be directed through our <Link href="/contact">contact and complaints page</Link>.</p>
    <h2>What guides us</h2>
    <p>Community context can support trust, but it is not an identity, qualification, licence or background check. Tivorah combines clear rules, member reporting and moderation with reminders to verify claims that matter.</p>
    <p>Read <Link href="/why-tivorah">Why Tivorah</Link>, our <Link href="/community-guidelines">Community Guidelines</Link> and our <Link href="/safety">Safety Centre</Link>.</p>
  </article>;
}
