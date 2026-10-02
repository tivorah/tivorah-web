// Loading state for a web conversation (/account/messages/[id]). Built from the
// real conversation classes in messages.tsx (heading, topic strip, thread,
// bubbles and compose row), so the messages drop into place without a jump.
// Only placeholders shimmer, using the shared `tivorah-shimmer` treatment.

const bubbles: { mine: boolean; lines: number[] }[] = [
  { mine: false, lines: [92, 64] },
  { mine: true, lines: [70] },
  { mine: false, lines: [84] },
  { mine: true, lines: [96, 52] },
  { mine: false, lines: [58] },
];

export function MessageThreadLoading() {
  return (
    <section className="message-conversation message-thread-skeleton" role="status" aria-busy="true" aria-label="Loading conversation">
      <div className="account-ticket-breadcrumb" aria-hidden="true">
        <span className="tivorah-shimmer message-skeleton-crumb" />
        <span className="tivorah-shimmer message-skeleton-crumb" />
        <span className="tivorah-shimmer message-skeleton-crumb short" />
      </div>
      <header className="message-thread-heading" aria-hidden="true">
        <span className="message-avatar tivorah-shimmer" />
        <div>
          <span className="tivorah-shimmer message-skeleton-eyebrow" />
          <span className="tivorah-shimmer message-skeleton-name" />
        </div>
        <span className="tivorah-shimmer message-skeleton-live" />
      </header>
      <div className="message-topic" aria-hidden="true">
        <span className="tivorah-shimmer message-skeleton-topic-kind" />
        <span className="tivorah-shimmer message-skeleton-topic-title" />
      </div>
      <div className="message-thread" aria-hidden="true">
        {bubbles.map((bubble, index) => (
          <div key={index} className={`message-bubble message-skeleton-bubble${bubble.mine ? " mine" : ""}`}>
            {bubble.lines.map((width, line) => (
              <span key={line} className="tivorah-shimmer message-skeleton-line" style={{ width: `${width}%` }} />
            ))}
            <span className="tivorah-shimmer message-skeleton-time" />
          </div>
        ))}
      </div>
      <div className="message-compose" aria-hidden="true">
        <span className="tivorah-shimmer message-skeleton-label" />
        <div className="message-compose-row">
          <span className="message-attach-button tivorah-shimmer" />
          <span className="message-attach-button tivorah-shimmer" />
          <span className="tivorah-shimmer message-skeleton-input" />
          <span className="tivorah-shimmer message-skeleton-send" />
        </div>
        <span className="tivorah-shimmer message-skeleton-hint" />
      </div>
    </section>
  );
}
