import Link from 'next/link';
import { pageMetadata } from '../../lib/site';
import { faqs, groups, startHere, topics } from './content';
import { GuideBrowser } from './guide-browser';
import styles from './guide.module.css';

export const metadata = pageMetadata(
  'How to use Tivorah',
  'A plain-English guide to Tivorah: joining and pinning Hubs, Banter, booking event tickets, private chats and view once photos, buying and selling, jobs, your profile and staying safe.',
  '/guide',
);

export default function GuidePage() {
  return <article className={`content ${styles.guide}`}>
    <span className="eyebrow">Help with Tivorah</span>
    <h1 id="guide-top">How to use Tivorah</h1>
    <p>Step-by-step help for the things people do most. Search for what you want to do, or jump to a section. Button names are shown exactly as they appear in the app.</p>

    <section aria-labelledby="start-here" className={styles.start}>
      <h2 id="start-here">Start here</h2>
      <ol>{startHere.map(step => <li key={step}>{step}</li>)}</ol>
    </section>

    <GuideBrowser groups={groups} topics={topics} faqs={faqs} />

    <section aria-labelledby="more-help" className={styles.help}>
      <h2 id="more-help">Still need help?</h2>
      <p><Link href="/contact">Contact the Tivorah team</Link> or visit the <Link href="/safety">Safety Centre</Link>. In the app, both are in Profile → Settings &amp; privacy → Help &amp; information. Never include passwords or verification codes in a support message.</p>
      <p>Tivorah is not an emergency service. If you or someone else is in immediate danger, call 000.</p>
    </section>
  </article>;
}
