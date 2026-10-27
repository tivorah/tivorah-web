'use client';
import { useState } from 'react';
import { SelectField } from '../../components/ui/select-field';

type Platform = 'ios' | 'android' | 'web';
type Reach = 'api' | 'app' | 'web';
export type FeatureFlag = {
  id: number; key: string; name: string; description?: string; enabled: boolean;
  presentation: 'hidden' | 'coming_soon' | 'maintenance'; maintenanceMessage?: string | null;
  version: number; environment?: string; platforms?: string[]; effectiveAt?: string | null;
  config?: { group?: string; hideFromNav?: boolean; [key: string]: unknown };
  /** From the API's feature catalogue: where this switch takes effect ([] = nothing reads it yet). */
  reaches?: Reach[] | null; payment?: boolean; appOnly?: boolean;
};
export type FeatureHistoryRow = { id: number; version: number; action: string; createdAt: string; snapshot?: { enabled?: boolean } };
export type FeatureSetup = { environment: string; missing: { key: string; name: string; group: string; enabledByDefault: boolean }[] };

const platforms: { key: Platform; label: string }[] = [{ key: 'ios', label: 'iPhone' }, { key: 'android', label: 'Android' }, { key: 'web', label: 'Web' }];
const reachLabels: Record<Reach, string> = { api: 'Server', app: 'App', web: 'Website' };
const whenOff = { hidden: 'Hide it', coming_soon: 'Say it’s coming soon', maintenance: 'Say it’s under maintenance' };
// The app's bottom bar, in order. Profile is always there. On the website the same setting removes
// the section from the header links.
const navTabs = [{ key: 'marketplace', label: 'Shop', web: 'Shop and Services' }, { key: 'events', label: 'Events', web: 'Events' }, { key: 'communities', label: 'Hubs', web: 'Hubs' }, { key: 'chat', label: 'Chat', web: null }] as const;
const filters = { all: 'All features', on: 'On', off: 'Off', unused: 'Not connected yet' };

const platformList = (keys: string[]) => {
  const names = platforms.filter(platform => keys.includes(platform.key)).map(platform => platform.label);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? 'no platform';
};

/**
 * Admin → Features: switch each part of Tivorah on or off for everyone, per platform, with what
 * people are told while it's off. Changes reach open apps straight away and are kept in history.
 */
export default function FeatureManager({ flags, loading, busy, update, history, toggleHistory, rollback, setup, setUpMissing }: {
  flags: FeatureFlag[];
  loading: boolean;
  busy: number | 'setup' | null;
  update: (flag: FeatureFlag, patch: Partial<FeatureFlag>) => Promise<boolean>;
  history: Record<number, FeatureHistoryRow[]>;
  toggleHistory: (flag: FeatureFlag) => Promise<void>;
  rollback: (flag: FeatureFlag, version: number) => Promise<void>;
  setup: FeatureSetup | null;
  setUpMissing: () => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<keyof typeof filters>('all');
  const [messages, setMessages] = useState<Record<number, string>>({});
  const locked = busy !== null || loading;

  const unused = (flag: FeatureFlag) => Array.isArray(flag.reaches) && flag.reaches.length === 0;
  const visible = flags.filter(flag => flag.key !== 'seller_payment_countries'
    && `${flag.name} ${flag.key} ${flag.description || ''}`.toLowerCase().includes(search.trim().toLowerCase())
    && (filter === 'all' || (filter === 'on' ? flag.enabled : filter === 'off' ? !flag.enabled : unused(flag))));
  const groups = visible.reduce<Record<string, FeatureFlag[]>>((all, flag) => { (all[flag.config?.group || 'Other features'] ??= []).push(flag); return all; }, {});
  const counted = flags.filter(flag => flag.key !== 'seller_payment_countries');

  const toggle = (flag: FeatureFlag) => {
    const where = platformList(flag.platforms ?? ['ios', 'android', 'web']);
    const payment = flag.payment ? ' Connected sellers get a notice they must acknowledge.' : '';
    const question = flag.enabled
      ? `Turn off ${flag.name}? People on ${where} lose it within a minute, and the server refuses it.${payment}`
      : `Turn on ${flag.name} for everyone on ${where}?${payment}`;
    if (!window.confirm(question)) return;
    void update(flag, { enabled: !flag.enabled });
  };

  const togglePlatform = (flag: FeatureFlag, platform: Platform) => {
    const current = flag.platforms ?? ['ios', 'android', 'web'];
    const on = current.includes(platform);
    const next = on ? current.filter(key => key !== platform) : [...current, platform];
    const label = platforms.find(item => item.key === platform)!.label;
    if (!window.confirm(on ? `Turn off ${flag.name} on ${label} only? Other platforms keep it.` : `Turn on ${flag.name} on ${label} as well?`)) return;
    void update(flag, { platforms: platforms.map(item => item.key).filter(key => next.includes(key)) });
  };

  const toggleNav = (flag: FeatureFlag, label: string, web: string | null) => {
    const hidden = flag.config?.hideFromNav === true;
    const where = web ? ` and the website’s header (${web})` : '';
    if (!window.confirm(hidden ? `Show ${label} in the app’s bottom nav${where} again?` : `Hide ${label} from the app’s bottom nav${where}? Only the tab goes: the bar narrows around the other tabs, and its content still shows on shop pages, in Hubs and from links. To switch it off completely, turn the feature off instead.`)) return;
    void update(flag, { config: { ...flag.config, hideFromNav: !hidden } });
  };

  const restore = (flag: FeatureFlag, row: FeatureHistoryRow) => {
    if (!window.confirm(`Restore ${flag.name} to how it was in version ${row.version}${row.snapshot?.enabled === undefined ? '' : ` (${row.snapshot.enabled ? 'on' : 'off'})`}? This is saved as a new version.`)) return;
    void rollback(flag, row.version);
  };

  return <section className="admin-settings feature-workspace">
    <div className="workspace-intro"><div><span className="panel-kicker">App availability</span><h2>Feature controls</h2><p>Switch parts of Tivorah on or off for everyone. Open apps and web pages update straight away; every change is kept in history.</p></div></div>

    <div className="feature-summary"><div><strong>{counted.filter(flag => flag.enabled).length}</strong><span>On</span></div><div><strong>{counted.filter(flag => !flag.enabled).length}</strong><span>Off</span></div><div><strong>{setup?.environment || flags[0]?.environment || 'Current'}</strong><span>Environment</span></div></div>

    {flags.some(flag => navTabs.some(tab => tab.key === flag.key)) ? <section className="feature-nav" aria-labelledby="feature-nav-title">
      <div><h3 id="feature-nav-title">Bottom navigation</h3><p>Choose which tabs show in the app’s bottom bar. Hiding a tab only removes it from the bar (which narrows around the tabs that are left); its content still shows on shop pages, in Hubs and from links. Profile always shows.</p></div>
      <div className="feature-nav-preview" aria-label="Bottom bar preview">{[...navTabs.filter(tab => { const flag = flags.find(item => item.key === tab.key); return Boolean(flag?.enabled && flag.config?.hideFromNav !== true); }).map(tab => tab.label), 'Profile'].map(label => <span key={label}>{label}</span>)}</div>
      <ul>{navTabs.map(tab => {
        const flag = flags.find(item => item.key === tab.key);
        if (!flag) return null;
        const inNav = flag.enabled && flag.config?.hideFromNav !== true;
        return <li key={tab.key}>
          <span><strong id={`nav-${flag.id}`}>{tab.label}</strong><small>{!flag.enabled ? 'Feature is off, so it’s not in the bar.' : inNav ? 'In the bottom bar' : 'Hidden from the bar; still shows on shop pages and in Hubs'}</small></span>
          <button type="button" role="switch" aria-checked={inNav} aria-labelledby={`nav-${flag.id}`} className="feature-toggle" disabled={locked || !flag.enabled} onClick={() => toggleNav(flag, tab.label, tab.web)}>
            <span className="feature-toggle-track" aria-hidden="true"><span /></span><span className="feature-toggle-label">{inNav ? 'Shown' : 'Hidden'}</span>
          </button>
        </li>;
      })}</ul>
    </section> : null}

    {setup?.missing.length ? <div className="feature-setup" role="status">
      <div><strong>{setup.missing.length === 1 ? '1 feature has no switch yet' : `${setup.missing.length} features have no switch yet`}</strong>
        <p>Until it’s set up, nothing here can turn {setup.missing.length === 1 ? 'it' : 'them'} off: {setup.missing.map(item => item.name).join(', ')}. Setting up adds each one in its usual starting state and doesn’t change any existing switch.</p></div>
      <button type="button" className="admin-primary" disabled={locked} aria-busy={busy === 'setup'} onClick={() => void setUpMissing()}>{busy === 'setup' ? 'Setting up…' : 'Set up switches'}</button>
    </div> : null}

    <div className="workspace-filters"><label>Find a feature<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search features" type="search" /></label><label>Show<SelectField label="Show" value={filter} onChange={value => setFilter(value as keyof typeof filters)} options={Object.entries(filters).map(([value, label]) => ({ value, label }))} /></label></div>

    {loading && !flags.length ? <p role="status">Loading features…</p> : !Object.keys(groups).length ? <div className="workspace-empty"><h3>{flags.length ? 'No matching features' : 'No features configured'}</h3><p>{flags.length ? 'Try another search or filter.' : 'Use Set up switches above, or refresh to check this environment again.'}</p></div> : Object.entries(groups).map(([group, rows]) => <section key={group} className="feature-group-panel"><h3>{group.replaceAll('_', ' ')}</h3><div className="feature-card-grid">{rows.map(flag => {
      const on = flag.platforms ?? ['ios', 'android', 'web'];
      const message = messages[flag.id] ?? flag.maintenanceMessage ?? '';
      const messageChanged = message.trim() !== (flag.maintenanceMessage ?? '').trim();
      return <article key={flag.id} className={`feature-control-card${flag.enabled ? ' is-on' : ''}`} aria-busy={busy === flag.id}>
        <div className="feature-card-heading">
          <div><h4 id={`feature-${flag.id}`}>{flag.name}</h4>{flag.description ? <p>{flag.description}</p> : null}</div>
          <button type="button" role="switch" aria-checked={flag.enabled} aria-labelledby={`feature-${flag.id}`} className="feature-toggle" disabled={locked} onClick={() => toggle(flag)}>
            <span className="feature-toggle-track" aria-hidden="true"><span /></span><span className="feature-toggle-label">{flag.enabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {unused(flag) ? <p className="feature-note is-warning">Not connected yet: nothing in the app, website or server reads this switch, so changing it has no effect.</p>
          : flag.reaches?.length ? <p className="feature-reach">Takes effect in: {flag.reaches.map(reach => <span key={reach}>{reachLabels[reach]}</span>)}{flag.appOnly ? <small> Made entirely in the app, so hiding it there turns it off completely.</small> : !flag.reaches.includes('api') ? <small> The server doesn’t check this one, so it hides the feature rather than blocking it.</small> : null}</p> : null}
        {flag.payment ? <p className="feature-note">Payment feature: turning it on or off also hides its fee row on connected sellers’ Payouts screen and sends them a notice they must acknowledge on next sign-in.</p> : null}

        <fieldset className="feature-platforms" disabled={locked}><legend>Platforms</legend>
          {platforms.map(platform => {
            const active = on.includes(platform.key);
            const last = active && on.length === 1;
            return <button key={platform.key} type="button" aria-pressed={active} disabled={last} title={last ? 'At least one platform stays on. Turn the feature off instead.' : undefined} onClick={() => togglePlatform(flag, platform.key)}>{active ? '✓ ' : ''}{platform.label}</button>;
          })}
        </fieldset>

        {!flag.enabled ? <div className="feature-off">
          <label>While it’s off<SelectField label={`While ${flag.name} is off`} disabled={locked} value={flag.presentation} onChange={value => void update(flag, { presentation: value as FeatureFlag['presentation'] })} options={Object.entries(whenOff).map(([value, label]) => ({ value, label }))} /></label>
          <label>Message people see <small>(optional, shown if they reach it anyway, e.g. from an older app version)</small>
            <textarea rows={2} maxLength={240} value={message} disabled={locked} placeholder={flag.presentation === 'coming_soon' ? 'This feature is coming soon' : 'This feature is currently unavailable'} onChange={e => setMessages(all => ({ ...all, [flag.id]: e.target.value }))} />
          </label>
          {messageChanged ? <button type="button" className="admin-secondary" disabled={locked} onClick={() => void update(flag, { maintenanceMessage: message.trim() || null }).then(saved => { if (saved) setMessages(({ [flag.id]: _saved, ...rest }) => rest); })}>Save message</button> : null}
        </div> : null}

        <details onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open && !history[flag.id]?.length) void toggleHistory(flag); }}>
          <summary>Details and history</summary>
          <p>Key: {flag.key}<br />Version: {flag.version}{flag.effectiveAt ? <><br />Starts: {new Date(flag.effectiveAt).toLocaleString()}</> : null}</p>
          {history[flag.id]?.length ? <ol className="feature-history-list">{history[flag.id]!.map(row => <li key={row.id}>
            <span>v{row.version} · {row.action.startsWith('rollback:') ? `restored v${row.action.slice(9)}` : row.action}{row.snapshot?.enabled === undefined ? '' : ` · ${row.snapshot.enabled ? 'on' : 'off'}`} · {new Date(row.createdAt).toLocaleString()}</span>
            {row.version !== flag.version ? <button type="button" className="admin-secondary" disabled={locked} onClick={() => restore(flag, row)}>Restore</button> : <em>Current</em>}
          </li>)}</ol> : <p>Loading history…</p>}
        </details>
      </article>;
    })}</div></section>)}
  </section>;
}
