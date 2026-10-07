'use client';
import { useEffect, useState } from 'react';
import { SelectField } from '../../components/ui/select-field';
type Policy = { version: number; environment: string; countries: string[]; options: { code: string; name: string }[] };
export default function PaymentCountries({ request }: { request: (path: string, init?: RequestInit) => Promise<any> }) {
  const [policy, setPolicy] = useState<Policy | null>(null), [draft, setDraft] = useState<string[]>([]), [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  async function load() { setBusy(true); setError(''); try { const result = await request('/api/v1/admin/payment-countries'); setPolicy(result); setDraft(result.countries); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load countries.'); } finally { setBusy(false); } }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function save() {
    if (!policy || busy || error) return;
    setBusy(true); setNotice('');
    try { const result = await request('/api/v1/admin/payment-countries', { method: 'PUT', body: JSON.stringify({ version: policy.version, countries: draft }) }); setPolicy(result); setDraft(result.countries); setNotice('Seller payment countries saved.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save countries.'); }
    finally { setBusy(false); }
  }
  return <section className="admin-settings payment-country-policy" aria-label="Seller payment countries">
    <h2>Seller payment countries</h2>
    <p>Allow new online payments for sellers established in these countries. Hubs, listings, enquiries and bookings without online payment remain available. The buyer’s country does not control seller eligibility.</p>
    {error ? <div role="alert"><p>{error}</p><button className="admin-secondary" onClick={() => void load()} disabled={busy}>Reload country settings</button></div> : null}
    {!policy ? <p role="status">{busy ? 'Loading countries…' : 'Country settings unavailable.'}</p> : <fieldset disabled={busy || !!error} style={{ border: 0, padding: 0 }}>
      <p>Environment: {policy.environment}. Stripe account country is checked on the server.</p>
      <ul>{draft.map(code => <li key={code}>{policy.options.find(option => option.code === code)?.name ?? code} <button type="button" className="admin-secondary" aria-label={`Remove ${code} from payment countries`} onClick={() => setDraft(values => values.filter(value => value !== code))}>Remove</button></li>)}</ul>
      {!draft.length ? <p>No countries selected: new seller payments will be disabled everywhere.</p> : null}
      <label>Add a seller country<SelectField label="Add a seller country" value={choice} onChange={setChoice} options={policy.options.filter(option => !draft.includes(option.code)).map(option => ({ value: option.code, label: option.name }))} /></label>
      <button type="button" className="admin-secondary" disabled={!choice || draft.includes(choice)} onClick={() => { setDraft(values => [...values, choice].sort()); setChoice(''); }}>Add country</button>
      <p>Adding a country is a rollout decision, not confirmation of Stripe support or legal readiness. Verify payout support, tax and local requirements first. Removing a country does not cancel completed orders, stop bank payouts or disable refunds. Checkout sessions already opened may remain payable until they expire.</p>
      <button type="button" className="admin-primary" disabled={JSON.stringify(draft) === JSON.stringify(policy.countries)} onClick={() => void save()}>{busy ? 'Saving…' : 'Save payment countries'}</button>
    </fieldset>}
    {notice ? <p role="status">{notice}</p> : null}
  </section>;
}
