"use client";

import { useId, useState } from "react";

// The shop's one "about" block (the hero line is the tagline): the seller's
// story on the left with "Read more", and the practical details on the right.
export function AboutSummary({ story, details }: { story: string; details: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const long = story.length > 280;
  const short = long ? `${story.slice(0, 280).replace(/\s+\S*$/, "")}…` : story;
  return <section className={`shop-about-summary${details.length ? "" : " no-details"}`} aria-label="About this shop">
    {story ? <div className="shop-about-text">
      <h2 className="shop-about-label">Story</h2>
      <p id={id} className="shop-about-story">{open ? story : short}</p>
      {long ? <button type="button" className="shop-read-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        {open ? "Show less" : "Read more"}
      </button> : null}
    </div> : null}
    {details.length ? <div className="shop-about-facts">
      <h2 className="shop-about-label">Good to know</h2>
      <dl className="shop-details-list">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div> : null}
  </section>;
}
