'use client';

import { type SyntheticEvent, useEffect, useId, useMemo, useState } from 'react';
import type { GuideFaq, GuideGroup, GuideTopic } from './content';
import styles from './guide.module.css';

const normalise = (value: string) => value.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
const topicText = (topic: GuideTopic) => normalise([topic.title, topic.summary, topic.where ?? '', ...topic.steps, topic.tip, ...(topic.keywords ?? [])].join(' '));

/** Opens the topic named in the address (#topic-id), so shared links land on an open answer. */
function useHashTopic(ids: Set<string>) {
  const [hashId, setHashId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!ids.has(id)) return;
      setHashId(id);
      // Wait a frame so the opened answer has its full height before scrolling to it.
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ids]);
  return hashId;
}

const faqText = (faq: GuideFaq) => normalise(`${faq.question} ${faq.answer} ${(faq.keywords ?? []).join(' ')}`);

export function GuideBrowser({ groups, topics, faqs }: { groups: readonly GuideGroup[]; topics: readonly GuideTopic[]; faqs: readonly GuideFaq[] }) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const byId = useMemo(() => new Map(topics.map(topic => [topic.id, topic])), [topics]);
  const ids = useMemo(() => new Set([...topics.map(topic => topic.id), ...faqs.map(faq => faq.id)]), [topics, faqs]);
  const hashId = useHashTopic(ids);
  useEffect(() => { if (hashId) setOpen(current => ({ ...current, [hashId]: true })); }, [hashId]);

  const terms = normalise(query).split(' ').filter(Boolean);
  const searching = terms.length > 0;
  // A whole phrase ("view once") wins over its words found far apart; otherwise every word must appear.
  const phrase = terms.join(' ');
  const matchesText = (text: string, byPhrase: boolean) => (byPhrase ? text.includes(phrase) : terms.every(term => text.includes(term)));
  const byPhrase = terms.length > 1 && [...topics.map(topicText), ...faqs.map(faqText)].some(text => text.includes(phrase));
  const matches = terms.length ? new Set(topics.filter(topic => matchesText(topicText(topic), byPhrase)).map(topic => topic.id)) : null;
  const visibleGroups = groups
    .map(group => ({ ...group, ids: group.topics.filter(id => !matches || matches.has(id)) }))
    .filter(group => group.ids.length > 0);
  const visibleFaqs = faqs.filter(faq => !terms.length || matchesText(faqText(faq), byPhrase));
  const count = (matches?.size ?? 0) + (searching ? visibleFaqs.length : 0);
  const toggle = (id: string) => (event: SyntheticEvent<HTMLDetailsElement>) => {
    const next = event.currentTarget.open;
    if (!searching && next !== Boolean(open[id])) setOpen(current => ({ ...current, [id]: next }));
  };

  return <>
    <div className={styles.finder}>
      <div role="search" className={styles.search}>
        <label htmlFor={searchId}>Search the guide</label>
        <div className={styles.searchRow}>
          <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="For example: ticket, pin, view once" autoComplete="off" enterKeyHint="search" />
          {searching ? <button type="button" className={styles.clear} onClick={() => setQuery('')}>Clear</button> : null}
        </div>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{searching ? (count === 1 ? '1 topic matches' : `${count} topics match`) : ''}</p>
      {!searching ? <nav aria-label="Guide sections" className={styles.chips}>
        <ul>{groups.map(group => <li key={group.id}><a href={`#${group.id}`}>{group.title}</a></li>)}<li><a href="#common-questions">Common questions</a></li></ul>
      </nav> : null}
    </div>

    {searching && !visibleGroups.length && !visibleFaqs.length ? <div className={styles.empty}>
      <p><strong>Nothing matches “{query.trim()}”.</strong> Try a simpler word, such as “ticket”, “Hub”, “chat” or “payout”.</p>
      <button type="button" className={styles.clear} onClick={() => setQuery('')}>Show all topics</button>
    </div> : null}

    {visibleGroups.map(group => <section key={group.id} aria-labelledby={group.id} className={styles.group}>
      <h2 id={group.id}>{group.title}</h2>
      <p className={styles.groupIntro}>{group.intro}</p>
      {group.ids.map(id => {
        const topic = byId.get(id)!;
        // While searching, matching answers open so people can read them straight away.
        const expanded = searching || Boolean(open[id]);
        return <details key={id} id={id} className={styles.topic} open={expanded} onToggle={toggle(id)}>
          <summary>
            <span className={styles.topicTitle}>{topic.title}</span>
            <span className={styles.topicSummary}>{topic.summary}</span>
          </summary>
          <div className={styles.answer}>
            {topic.where ? <p className={styles.where}><span>Where:</span> {topic.where}</p> : null}
            <ol>{topic.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <p className={styles.tip}><strong>Tip:</strong> {topic.tip}</p>
          </div>
        </details>;
      })}
      <a className={styles.back} href="#guide-top">Back to top</a>
    </section>)}

    {visibleFaqs.length ? <section aria-labelledby="common-questions" className={styles.group}>
      <h2 id="common-questions">Common questions</h2>
      {visibleFaqs.map(faq => <details key={faq.id} id={faq.id} className={styles.topic} open={searching || Boolean(open[faq.id])} onToggle={toggle(faq.id)}>
        <summary><span className={styles.topicTitle}>{faq.question}</span></summary>
        <div className={styles.answer}><p>{faq.answer}</p></div>
      </details>)}
      <a className={styles.back} href="#guide-top">Back to top</a>
    </section> : null}
  </>;
}
