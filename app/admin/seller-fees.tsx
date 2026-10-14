'use client';
import { FormEvent, useEffect, useState } from 'react';
import { SelectField } from '../../components/ui/select-field';

// Account pricing: waive Tivorah's fee for one seller, or give them their own rate. Beats the
// platform rules above; with no rule at all, Tivorah charges nothing.

type Feature = 'all' | 'item' | 'service' | 'event';
type Seller = { id: number; username: string | null; name: string | null; email: string };
type Override = { id: number; userId: number; feature: Feature; mode: 'free' | 'custom'; percentageBps: number; fixedFeeCents: number; chargedTo: 'buyer' | 'provider'; note: string | null; active: boolean; version: number; seller: Seller };
type Draft = Omit<Override, 'id' | 'version' | 'seller'> & { id?: number; version?: number; seller: Seller };
const featureLabels: Record<Feature, string> = { all: 'Everything', event: 'Event tickets', service: 'Services', item: 'Items' };
const dollars = (cents: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
const who = (seller: Seller) => seller.name?.trim() || (seller.username ? `@${seller.username}` : seller.email);
const rate = (row: Pick<Override, 'mode' | 'percentageBps' | 'fixedFeeCents' | 'chargedTo'>) => row.mode === 'free' ? 'No Tivorah fee' : `${row.percentageBps / 100}% + ${dollars(row.fixedFeeCents)} · paid by ${row.chargedTo === 'buyer' ? 'buyer' : 'seller'}`;

export default function SellerFees({ request }: { request: (path: string, init?: RequestInit) => Promise<any> }) {
  const [rows, setRows] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<Seller[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { setRows(await request('/api/v1/admin/seller-fees')); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load account pricing.'); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function find(event: FormEvent) {
    event.preventDefault();
    if (search.trim().length < 2) return;
    setBusy(true); setError('');
    try { setMatches(await request(`/api/v1/admin/seller-fees/find?query=${encodeURIComponent(search.trim())}`)); } catch (e) { setError(e instanceof Error ? e.message : 'Search failed.'); } finally { setBusy(false); }
  }
  const start = (seller: Seller) => { setDraft({ seller, userId: seller.id, feature: 'all', mode: 'free', percentageBps: 0, fixedFeeCents: 0, chargedTo: 'provider', note: '', active: true }); setMatches(null); setSearch(''); setMessage(''); };
  const patch = (value: Partial<Draft>) => setDraft((current) => current ? { ...current, ...value } : current);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { seller: _seller, id, ...body } = draft;
      await request(`/api/v1/admin/seller-fees${id ? `/${id}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ ...body, note: body.note || undefined }) });
      setDraft(null); setMessage('Account pricing saved. It applies to new checkouts; existing orders keep their fee. The seller has been notified.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save account pricing.'); } finally { setBusy(false); }
  }
  async function remove(row: Override) {
    if (!window.confirm(`Remove ${who(row.seller)}’s account pricing for ${featureLabels[row.feature].toLowerCase()}? They’ll go back to the platform rules.`)) return;
    setBusy(true); setError('');
    try { await request(`/api/v1/admin/seller-fees/${row.id}`, { method: 'DELETE' }); setMessage('Account pricing removed. Platform rules apply again.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not remove account pricing.'); } finally { setBusy(false); }
  }
  const shown = rows.filter((row) => !filter || `${who(row.seller)} ${row.seller.username ?? ''} ${row.seller.email}`.toLowerCase().includes(filter.toLowerCase()));

  return <section className="admin-settings pricing-workspace">
    <div className="workspace-intro"><div><span className="panel-kicker">Revenue settings</span><h2>Account pricing</h2><p>Waive Tivorah’s fee for a seller, or give them their own rate. This beats the platform rules above. With no rule at all, Tivorah charges nothing.</p></div><button className="admin-secondary" onClick={() => void load()} disabled={loading || busy}>Refresh</button></div>
    {error ? <div className="workspace-error" role="alert">{error}</div> : null}
    <p role="status" className="workspace-feedback">{message}</p>

    {!draft ? <form className="pricing-editor" onSubmit={find}><h3>Add account pricing</h3><div className="pricing-fields">
      <label>Find a seller<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Username, email, name or user ID" minLength={2} maxLength={120} /></label>
    </div><div className="workspace-actions"><button disabled={busy || search.trim().length < 2}>{busy ? 'Searching…' : 'Search'}</button></div>
      {matches ? matches.length ? <ul className="seller-fee-matches">{matches.map((seller) => <li key={seller.id}><span><strong>{who(seller)}</strong> {seller.username ? `@${seller.username} · ` : ''}{seller.email} · #{seller.id}</span><button type="button" className="admin-secondary" onClick={() => start(seller)}>Set pricing</button></li>)}</ul> : <p>No accounts found.</p> : null}
    </form> : <form className="pricing-editor" onSubmit={save} aria-busy={busy}><h3>{draft.id ? 'Edit' : 'New'} account pricing · {who(draft.seller)}</h3><div className="pricing-fields">
      <label>Applies to<SelectField label="Applies to" value={draft.feature} disabled={!!draft.id} onChange={(value) => patch({ feature: value as Feature })} options={(Object.keys(featureLabels) as Feature[]).map((key) => ({ value: key, label: featureLabels[key] }))} /></label>
      <label>Tivorah fee<SelectField label="Tivorah fee" value={draft.mode} onChange={(value) => patch({ mode: value as Draft['mode'] })} options={[{ value: 'free', label: 'Free — no Tivorah fee' }, { value: 'custom', label: 'Custom rate' }]} /></label>
      {draft.mode === 'custom' ? <>
        <label>Percentage fee (%)<input required type="number" min="0" max="100" step="0.01" value={draft.percentageBps / 100} onChange={(e) => patch({ percentageBps: Math.round(Number(e.target.value) * 100) })} /></label>
        <label>Fixed fee (AUD)<input required type="number" min="0" max="1000" step="0.01" value={draft.fixedFeeCents / 100} onChange={(e) => patch({ fixedFeeCents: Math.round(Number(e.target.value) * 100) })} /></label>
        <label>Paid by<SelectField label="Paid by" value={draft.chargedTo} onChange={(value) => patch({ chargedTo: value as Draft['chargedTo'] })} options={[{ value: 'provider', label: 'Seller / provider / organiser' }, { value: 'buyer', label: 'Buyer' }]} /></label>
      </> : null}
      <label>Status<SelectField label="Status" value={draft.active ? 'on' : 'off'} onChange={(value) => patch({ active: value === 'on' })} options={[{ value: 'on', label: 'Active' }, { value: 'off', label: 'Paused (platform rules apply)' }]} /></label>
      <label>Internal note (optional)<input maxLength={300} value={draft.note ?? ''} onChange={(e) => patch({ note: e.target.value })} placeholder="e.g. Launch partner, free until June 2027" /></label>
    </div>
      <p>{draft.mode === 'free' ? 'This seller pays no Tivorah fee on ' : `On a A$100 sale this seller’s Tivorah fee is ${dollars(Math.round(10000 * draft.percentageBps / 10000) + draft.fixedFeeCents)} on `}{featureLabels[draft.feature].toLowerCase()}.{draft.feature === 'all' ? ' A feature-specific setting for the same seller takes priority.' : ''}</p>
      <div className="workspace-actions"><button disabled={busy}>{busy ? 'Saving…' : 'Save account pricing'}</button><button type="button" className="admin-secondary" disabled={busy} onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}

    <div className="workspace-list-heading"><div><h3>Accounts with their own pricing</h3><p>{rows.length} account setting{rows.length === 1 ? '' : 's'}</p></div>{rows.length > 5 ? <input aria-label="Filter accounts" placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} /> : null}</div>
    {loading ? <p role="status">Loading account pricing…</p> : !shown.length ? <div className="workspace-empty"><h3>No account pricing</h3><p>Every seller uses the platform rules.</p></div> : <div className="pricing-rule-list">{shown.map((row) => <article key={row.id} className="pricing-rule"><div><span className="workspace-status">{row.active ? featureLabels[row.feature] : `${featureLabels[row.feature]} · paused`}</span><h4>{who(row.seller)}</h4><p>{rate(row)}</p><small>{row.seller.username ? `@${row.seller.username} · ` : ''}{row.seller.email}{row.note ? ` · ${row.note}` : ''} · Version {row.version}</small></div><div className="workspace-actions"><button className="admin-secondary" disabled={busy} onClick={() => { setDraft({ ...row, note: row.note ?? '' }); setMessage(''); }}>Edit</button><button className="admin-danger" disabled={busy} onClick={() => void remove(row)}>Remove</button></div></article>)}</div>}
  </section>;
}
