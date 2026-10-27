"use client";
import { useId, useMemo, useState } from "react";
import { Sheet } from "../../ui/sheet";
import { FEATURED_RULE_COUNT, type HubRule } from "./shared";

/**
 * Hub rules, as in the app: the five most common presets, then "See all rules", a sheet like the
 * app's Choose categories (search, grouped by topic, a check per rule, Done). Rules chosen from the
 * sheet are listed, ticked, under the five so they can be unticked here too.
 */
export function RuleChooser({ presets, value, onChange, max }: { presets: HubRule[]; value: string[]; onChange: (keys: string[]) => void; max: number }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchId = useId();
  const featured = presets.slice(0, FEATURED_RULE_COUNT);
  const more = presets.slice(FEATURED_RULE_COUNT).filter((rule) => value.includes(rule.key));
  const full = value.length >= max;
  const toggle = (key: string) => onChange(value.includes(key) ? value.filter((item) => item !== key) : full ? value : [...value, key]);
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const map = new Map<string, HubRule[]>();
    for (const rule of presets) if (!query || rule.text.toLowerCase().includes(query)) map.set(rule.group || "More rules", [...(map.get(rule.group || "More rules") ?? []), rule]);
    return [...map];
  }, [presets, search]);
  const row = (rule: HubRule) => {
    const on = value.includes(rule.key);
    // A check circle like the app's lists (on/off settings elsewhere use toggles).
    return <button key={rule.key} type="button" role="checkbox" aria-checked={on} disabled={!on && full} className={`hub-rule-row${on ? " is-on" : ""}`} onClick={() => toggle(rule.key)}>
      <span>{rule.text}</span>
      <span className="hub-rule-check" aria-hidden="true" />
    </button>;
  };

  return <div className="hub-rules">
    <div className="hub-rule-list">
      {featured.map(row)}
      {more.map(row)}
      {presets.length > FEATURED_RULE_COUNT ? <button type="button" className="hub-rule-more" onClick={() => setOpen(true)}>
        <span>See all {presets.length} rules</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8.59 16.58 13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
      </button> : null}
    </div>
    <Sheet open={open} onClose={() => { setOpen(false); setSearch(""); }} title="Hub rules" description={`Pick up to ${max} · ${value.length} selected`}
      footer={<button type="button" className="product-primary" onClick={() => { setOpen(false); setSearch(""); }}>{value.length ? `Done (${value.length})` : "Done"}</button>}>
      <div className="hub-rule-sheet">
        <label htmlFor={searchId} className="sr-only">Search Hub rules</label>
        <input id={searchId} type="search" className="hub-interest-search" placeholder="Search rules" value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
        {groups.length ? groups.map(([group, rules]) => <section key={group} aria-label={group}>
          <h3 className="hub-rule-group">{group}</h3>
          <div className="hub-rule-group-list">{rules.map(row)}</div>
        </section>) : <p className="hub-field-hint">No rule found. You can write your own on the form.</p>}
      </div>
    </Sheet>
  </div>;
}
