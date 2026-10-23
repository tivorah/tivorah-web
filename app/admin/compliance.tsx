'use client';
import { useEffect, useState } from 'react';
import { SelectField } from '../../components/ui/select-field';
import { countryFlag } from '../../lib/api/places';

type Status = 'todo' | 'in_progress' | 'done' | 'not_needed';
type Task = {
  key: string; title: string; description: string; scope: 'AU' | 'global' | string[]; threshold: number | null; link?: string; recommended?: boolean;
  members: number | null; status: Status; notes: string | null; version: number; actionNeeded: boolean; triggered: boolean; completedAt: string | null; lastAlertedAt?: string | null;
};
type Overview = { countries: { code: string | null; name: string; members: number }[]; tasks: Task[]; actionNeeded: number; alertEmail?: string };

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'done', label: 'Done' }, { value: 'not_needed', label: 'Not needed' },
];
const scopeLabel = (scope: Task['scope']) => scope === 'AU' ? 'Australia' : scope === 'global' ? 'Everywhere' : scope.length > 3 ? 'European Union' : scope.map((code) => `${countryFlag(code)} ${code}`).join(', ');

/** Admin → Legal & compliance: members by country and the checklist of legal tasks. */
export default function Compliance({ request }: { request: (path: string, init?: RequestInit) => Promise<any> }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setBusy(true); setError('');
    try { setOverview(await request('/api/v1/admin/compliance')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load the compliance checklist.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(task: Task, patch: { status?: Status; notes?: string | null; threshold?: number | null }) {
    setError('');
    try { setOverview(await request(`/api/v1/admin/compliance/tasks/${task.key}`, { method: 'PATCH', body: JSON.stringify({ version: task.version, ...patch }) })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Reload and try again.'); void load(); }
  }

  const tasks = overview?.tasks ?? [];
  const settled = (task: Task) => task.status === 'done' || task.status === 'not_needed';
  const groups: { title: string; hint: string; items: Task[]; open: boolean }[] = [
    { title: 'Needs action', hint: 'Required now: launch tasks, and countries that have reached their member threshold.', items: tasks.filter((task) => task.actionNeeded), open: true },
    { title: 'Coming up', hint: 'Country tasks that switch on when enough members live there. Do them before marketing in that country.', items: tasks.filter((task) => !settled(task) && !task.actionNeeded && !task.recommended), open: true },
    { title: 'Recommended', hint: 'Good practice; not legally required in every case.', items: tasks.filter((task) => !settled(task) && task.recommended), open: true },
    { title: 'Done or not needed', hint: '', items: tasks.filter(settled), open: false },
  ];

  return <section className="admin-settings compliance" aria-label="Legal and compliance" aria-busy={busy}>
    <h2>Legal &amp; compliance</h2>
    <p>What Tivorah must do to stay compliant as members join from different countries. Each task says what to check; it isn&apos;t legal advice, so confirm details with a lawyer. Changes are recorded in the audit log.</p>
    {error ? <div role="alert"><p>{error}</p><button className="admin-secondary" onClick={() => void load()} disabled={busy}>Reload</button></div> : null}
    {!overview ? <p role="status">{busy ? 'Loading checklist…' : 'Checklist unavailable.'}</p> : <>
      <p className="compliance-summary" role="status">{overview.actionNeeded ? `${overview.actionNeeded} ${overview.actionNeeded === 1 ? 'task needs' : 'tasks need'} action.` : 'Nothing needs action right now.'}</p>
      {overview.alertEmail ? <p>Alerts are emailed to <strong>{overview.alertEmail}</strong> when a task becomes due, then weekly until it&apos;s done or not needed.</p> : null}

      <h3>Members by country</h3>
      <p>Where members say they live (their profile location). Country tasks below use these numbers.</p>
      <table className="compliance-countries">
        <thead><tr><th scope="col">Country</th><th scope="col">Members</th></tr></thead>
        <tbody>{overview.countries.map((row) => <tr key={row.code ?? 'unknown'}><td>{row.code ? `${countryFlag(row.code)} ` : ''}{row.name}</td><td>{row.members.toLocaleString()}</td></tr>)}</tbody>
      </table>

      {groups.map((group) => group.items.length ? <details key={group.title} className="compliance-group" open={group.open}>
        <summary><h3>{group.title} <span>({group.items.length})</span></h3></summary>
        {group.hint ? <p>{group.hint}</p> : null}
        {group.items.map((task) => <TaskCard key={task.key} task={task} onSave={(patch) => save(task, patch)} />)}
      </details> : null)}
    </>}
  </section>;
}

function TaskCard({ task, onSave }: { task: Task; onSave: (patch: { status?: Status; notes?: string | null; threshold?: number | null }) => Promise<void> }) {
  const [notes, setNotes] = useState(task.notes ?? '');
  const [threshold, setThreshold] = useState(task.threshold != null ? String(task.threshold) : '');
  const [saving, setSaving] = useState(false);
  const countryTask = Array.isArray(task.scope);
  const run = async (patch: Parameters<typeof onSave>[0]) => { setSaving(true); try { await onSave(patch); } finally { setSaving(false); } };
  const changed = notes !== (task.notes ?? '') || (countryTask && threshold !== (task.threshold != null ? String(task.threshold) : ''));
  return <article className={`compliance-task${task.actionNeeded ? ' is-due' : ''}`} aria-busy={saving}>
    <header>
      <h4>{task.title}</h4>
      <span className="compliance-scope">{scopeLabel(task.scope)}</span>
    </header>
    <p>{task.description}</p>
    {countryTask ? <p className="compliance-progress"><strong>{(task.members ?? 0).toLocaleString()}</strong> of {task.threshold?.toLocaleString()} members{task.triggered ? ' — threshold reached' : ''}</p> : null}
    {task.link ? <p><a href={task.link} target="_blank" rel="noopener noreferrer">Official guidance ↗</a></p> : null}
    <div className="compliance-controls">
      <label>Status<SelectField label="Status" value={task.status} onChange={(value) => void run({ status: value as Status })} options={STATUS_OPTIONS} /></label>
      {countryTask ? <label>Member threshold<input type="number" min={1} value={threshold} onChange={(e) => setThreshold(e.target.value)} /></label> : null}
    </div>
    <label>Notes (what was done, by whom, reference numbers)<textarea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
    {changed ? <button type="button" className="admin-secondary" disabled={saving} onClick={() => void run({ notes: notes.trim() || null, ...(countryTask && threshold ? { threshold: Number(threshold) } : {}) })}>{saving ? 'Saving…' : 'Save notes'}</button> : null}
    {task.completedAt ? <p className="compliance-done">Completed {new Date(task.completedAt).toLocaleDateString('en-AU')}</p> : null}
    {task.actionNeeded && task.lastAlertedAt ? <p className="compliance-emailed">Last emailed {new Date(task.lastAlertedAt).toLocaleDateString('en-AU')}</p> : null}
  </article>;
}
