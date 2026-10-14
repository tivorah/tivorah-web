"use client";
import { useState, type FormEvent } from "react";
import { SelectField } from "../../components/ui/select-field";

type Request = (path: string, init?: RequestInit) => Promise<any>;
export type AdminBroadcast = { id: number; title: string; body?: string; category: string; status: string; recipientCount: number; deliveredCount: number; failedCount: number; createdAt: string; targetRoles?: string[] };
export type AdminDelivery = { id: number; status: string; errorCode?: string; errorMessage?: string; attemptedAt: string; provider?: string };
export type AdminTemplate = { id: number; key: string; name: string; category: string; title: string; body: string; deepLink?: string | null; active: boolean; updatedAt?: string };

const CATEGORIES = [
  { value: "activity", label: "Activity" }, { value: "chat", label: "Chat" }, { value: "communities", label: "Hubs" }, { value: "events", label: "Events" },
  { value: "marketplace", label: "Shop" }, { value: "safety", label: "Safety" }, { value: "marketing", label: "News and offers" },
];
const categoryLabel = (value: string) => CATEGORIES.find((item) => item.value === value)?.label ?? value;
const AUDIENCE = [
  { group: "Members", roles: [{ value: "user", label: "Members" }, { value: "tester", label: "Testers" }] },
  { group: "Tivorah team", roles: [{ value: "moderator", label: "Moderators" }, { value: "support", label: "Support" }, { value: "finance", label: "Finance" }, { value: "event_operations", label: "Event operations" }, { value: "analyst", label: "Analysts" }, { value: "admin", label: "Admins" }, { value: "owner", label: "Owners" }] },
];
const roleLabel = (value: string) => AUDIENCE.flatMap((group) => group.roles).find((role) => role.value === value)?.label ?? value;
const STATUS: Record<string, string> = { queued: "Queued", sending: "Sending", processing: "Sending", completed: "Sent", sent: "Sent", failed: "Failed", delivered: "Delivered", error: "Failed", ok: "Delivered" };
const when = (value?: string) => (value ? new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "—");
const failedStatus = (status: string) => ["failed", "error"].includes(status);
type Tab = "compose" | "templates" | "history" | "deliveries";

export function NotificationsWorkspace({ request, templates, broadcasts, deliveries, onChanged }: { request: Request; templates: AdminTemplate[]; broadcasts: AdminBroadcast[]; deliveries: AdminDelivery[]; onChanged: () => Promise<void> | void }) {
  const [tab, setTab] = useState<Tab>("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("activity");
  const [deepLink, setDeepLink] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [composeFeedback, setComposeFeedback] = useState({ text: "", error: false });
  const [templateFeedback, setTemplateFeedback] = useState({ text: "", error: false });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);
  const [historyShown, setHistoryShown] = useState(10);
  const [deliveriesShown, setDeliveriesShown] = useState(20);

  const deepLinkError = deepLink && (!deepLink.startsWith("/") || deepLink.startsWith("//")) ? "Use an app path that starts with /, for example /events." : "";
  const sentTotal = broadcasts.reduce((total, item) => total + Number(item.deliveredCount ?? 0), 0);
  const attempted = deliveries.length;
  const failedRecent = deliveries.filter((item) => failedStatus(item.status)).length;
  const successRate = attempted ? Math.round(((attempted - failedRecent) / attempted) * 100) : null;
  const visibleDeliveries = deliveries.filter((item) => !failedOnly || failedStatus(item.status));

  function applyTemplate(template: AdminTemplate) {
    setTitle(template.title);
    setBody(template.body);
    setCategory(template.category);
    setDeepLink(template.deepLink ?? "");
    setTab("compose");
    setComposeFeedback({ text: `Filled in from “${template.name}”. Review before sending.`, error: false });
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim() || deepLinkError) {
      setComposeFeedback({ text: deepLinkError || "Add a title and a message.", error: true });
      return;
    }
    const audience = roles.length ? roles.map(roleLabel).join(", ") : "everyone with an active Tivorah account";
    if (!window.confirm(`Send “${title.trim()}” to ${audience}? This can’t be recalled once delivered.`)) return;
    setSending(true);
    setComposeFeedback({ text: "", error: false });
    try {
      await request("/api/v1/admin/broadcasts", { method: "POST", body: JSON.stringify({ title: title.trim(), body: body.trim(), category, deepLink: deepLink.trim() || undefined, targetRoles: roles }) });
      setTitle(""); setBody(""); setDeepLink(""); setRoles([]);
      setComposeFeedback({ text: "Broadcast queued. Progress appears in History.", error: false });
      await onChanged();
    } catch (cause) {
      setComposeFeedback({ text: cause instanceof Error ? cause.message : "The broadcast wasn’t queued. Please try again.", error: true });
    } finally {
      setSending(false);
    }
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSavingTemplate(true);
    setTemplateFeedback({ text: "", error: false });
    try {
      await request("/api/v1/admin/notification-templates", { method: "POST", body: JSON.stringify({
        key: form.get("key"), name: form.get("name"), category: form.get("category") || "activity", title: form.get("title"), body: form.get("body"), deepLink: form.get("deepLink") || undefined, active: true,
      }) });
      formElement.reset();
      setTemplateFeedback({ text: "Template saved. Saving with an existing key updates that template.", error: false });
      await onChanged();
    } catch (cause) {
      setTemplateFeedback({ text: cause instanceof Error ? cause.message : "The template wasn’t saved.", error: true });
    } finally {
      setSavingTemplate(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "compose", label: "Send a broadcast" },
    { id: "templates", label: `Templates (${templates.length})` },
    { id: "history", label: `History (${broadcasts.length})` },
    { id: "deliveries", label: failedRecent ? `Delivery log · ${failedRecent} failed` : "Delivery log" },
  ];

  return (
    <div className="notify">
      <section className="notify-stats" aria-label="Notification summary">
        <div><span>Templates</span><strong>{templates.length}</strong></div>
        <div><span>Broadcasts</span><strong>{broadcasts.length}</strong></div>
        <div><span>Devices reached</span><strong>{sentTotal.toLocaleString("en-AU")}</strong></div>
        <div><span>Recent delivery success</span><strong>{successRate == null ? "—" : `${successRate}%`}</strong></div>
      </section>

      <div className="notify-tabs" role="group" aria-label="Notification tools">
        {tabs.map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>

      {tab === "compose" ? (
        <div className="notify-compose">
          <form className="notify-panel notify-form" onSubmit={send} noValidate>
            <h3>Send a broadcast</h3>
            {templates.some((item) => item.active) ? (
              <SelectField label="Start from a template (optional)" value="" placeholder="Choose a template" options={templates.filter((item) => item.active).map((item) => ({ value: String(item.id), label: item.name }))}
                onChange={(value) => { const template = templates.find((item) => String(item.id) === value); if (template) applyTemplate(template); }} />
            ) : null}
            <div className="notify-field">
              <label htmlFor="broadcast-title">Title</label>
              <input id="broadcast-title" value={title} maxLength={100} onChange={(event) => setTitle(event.currentTarget.value)} />
              <small>{title.length}/100</small>
            </div>
            <div className="notify-field">
              <label htmlFor="broadcast-body">Message</label>
              <textarea id="broadcast-body" value={body} maxLength={1000} rows={4} onChange={(event) => setBody(event.currentTarget.value)} />
              <small>{body.length}/1000</small>
            </div>
            <SelectField label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
            <div className="notify-field">
              <label htmlFor="broadcast-link">Opens in the app <span className="notify-optional">(optional)</span></label>
              <input id="broadcast-link" value={deepLink} placeholder="/events" aria-invalid={deepLinkError ? true : undefined} aria-describedby="broadcast-link-hint" onChange={(event) => setDeepLink(event.currentTarget.value)} />
              <small id="broadcast-link-hint" className={deepLinkError ? "notify-error" : undefined}>{deepLinkError || "Where tapping the notification takes people. Leave empty to open Notifications."}</small>
            </div>
            <fieldset className="notify-audience">
              <legend>Who receives it</legend>
              <p>{roles.length ? `Only: ${roles.map(roleLabel).join(", ")}` : "Everyone with an active account. Choose groups below to narrow it."}</p>
              {AUDIENCE.map((group) => (
                <div key={group.group} className="notify-audience-group">
                  <span>{group.group}</span>
                  <div>{group.roles.map((role) => (
                    <label key={role.value} className="notify-chip">
                      <input type="checkbox" checked={roles.includes(role.value)} onChange={() => setRoles(roles.includes(role.value) ? roles.filter((value) => value !== role.value) : [...roles, role.value])} />
                      <span>{role.label}</span>
                    </label>
                  ))}</div>
                </div>
              ))}
            </fieldset>
            {composeFeedback.text ? <p className={composeFeedback.error ? "notify-feedback notify-error" : "notify-feedback"} role={composeFeedback.error ? "alert" : "status"}>{composeFeedback.text}</p> : null}
            <button type="submit" className="notify-primary" disabled={sending} aria-busy={sending || undefined}>{sending ? "Queuing…" : roles.length ? "Send to selected groups" : "Send to everyone"}</button>
          </form>
          <aside className="notify-panel notify-preview" aria-label="Preview">
            <h3>Preview</h3>
            <div className="notify-phone">
              <div className="notify-banner">
                <span className="notify-app">TIVORAH · {categoryLabel(category).toUpperCase()}</span>
                <strong>{title.trim() || "Notification title"}</strong>
                <p>{body.trim() || "Your message appears here, as people will see it on their lock screen."}</p>
              </div>
            </div>
            <p className="notify-muted">Phones may shorten long messages. Keep the key point in the first line.</p>
          </aside>
        </div>
      ) : null}

      {tab === "templates" ? (
        <div className="notify-two">
          <section className="notify-panel" aria-labelledby="templates-title">
            <h3 id="templates-title">Saved templates</h3>
            {templates.length === 0 ? <p className="notify-muted">No templates yet. Save messages you send often, like event reminders or safety notices.</p> : (
              <ul className="notify-list">{templates.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.key} · {categoryLabel(item.category)} · {item.active ? "Active" : "Inactive"}</small>
                    <p>{item.title} — {item.body}</p>
                  </div>
                  <button type="button" className="notify-secondary" onClick={() => applyTemplate(item)}>Use</button>
                </li>
              ))}</ul>
            )}
          </section>
          <form className="notify-panel notify-form" onSubmit={saveTemplate}>
            <h3>New or updated template</h3>
            <div className="notify-field"><label htmlFor="template-name">Name</label><input id="template-name" name="name" required minLength={2} maxLength={150} /></div>
            <div className="notify-field"><label htmlFor="template-key">Key</label><input id="template-key" name="key" required pattern="[a-z0-9_.\-]+" maxLength={100} aria-describedby="template-key-hint" /><small id="template-key-hint">Lowercase, for example event.reminder. Reusing a key updates that template.</small></div>
            <SelectField name="category" label="Category" defaultValue="activity" options={CATEGORIES} />
            <div className="notify-field"><label htmlFor="template-title">Title</label><input id="template-title" name="title" required maxLength={100} /></div>
            <div className="notify-field"><label htmlFor="template-body">Message</label><textarea id="template-body" name="body" required maxLength={1000} rows={4} /></div>
            <div className="notify-field"><label htmlFor="template-link">Opens in the app <span className="notify-optional">(optional)</span></label><input id="template-link" name="deepLink" placeholder="/events" /></div>
            {templateFeedback.text ? <p className={templateFeedback.error ? "notify-feedback notify-error" : "notify-feedback"} role={templateFeedback.error ? "alert" : "status"}>{templateFeedback.text}</p> : null}
            <button type="submit" className="notify-primary" disabled={savingTemplate} aria-busy={savingTemplate || undefined}>{savingTemplate ? "Saving…" : "Save template"}</button>
          </form>
        </div>
      ) : null}

      {tab === "history" ? (
        <section className="notify-panel" aria-labelledby="history-title">
          <h3 id="history-title">Broadcast history</h3>
          {broadcasts.length === 0 ? <p className="notify-muted">No broadcasts yet.</p> : (
            <ul className="notify-list">{broadcasts.slice(0, historyShown).map((item) => {
              const recipients = Number(item.recipientCount ?? 0);
              const delivered = Number(item.deliveredCount ?? 0);
              const percent = recipients ? Math.min(100, Math.round((delivered / recipients) * 100)) : 0;
              return (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{categoryLabel(item.category)} · {when(item.createdAt)}{item.targetRoles?.length ? ` · ${item.targetRoles.map(roleLabel).join(", ")}` : " · Everyone"}</small>
                    <div className="notify-progress" role="img" aria-label={`${delivered} of ${recipients} devices delivered, ${item.failedCount} failed`}><span style={{ width: `${percent}%` }} /></div>
                    <small>{delivered.toLocaleString("en-AU")} of {recipients.toLocaleString("en-AU")} devices{item.failedCount ? ` · ${item.failedCount} failed` : ""}</small>
                  </div>
                  <span className={`notify-status notify-status-${failedStatus(item.status) ? "failed" : item.status}`}>{STATUS[item.status] ?? item.status}</span>
                </li>
              );
            })}</ul>
          )}
          {broadcasts.length > historyShown ? <button type="button" className="notify-secondary" onClick={() => setHistoryShown((value) => value + 10)}>Show more</button> : null}
        </section>
      ) : null}

      {tab === "deliveries" ? (
        <section className="notify-panel" aria-labelledby="deliveries-title">
          <div className="notify-panel-heading">
            <h3 id="deliveries-title">Recent delivery attempts</h3>
            <label className="notify-toggle"><input type="checkbox" checked={failedOnly} onChange={(event) => setFailedOnly(event.currentTarget.checked)} /> Failed only</label>
          </div>
          {visibleDeliveries.length === 0 ? <p className="notify-muted">{failedOnly ? "No failed deliveries in the recent log." : "No delivery attempts yet."}</p> : (
            <ul className="notify-list">{visibleDeliveries.slice(0, deliveriesShown).map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{when(item.attemptedAt)}</strong>
                  {item.errorCode || item.errorMessage ? <small className="notify-error">{[item.errorCode, item.errorMessage].filter(Boolean).join(" — ")}</small> : <small>Delivered to the device service{item.provider ? ` (${item.provider})` : ""}</small>}
                </div>
                <span className={`notify-status notify-status-${failedStatus(item.status) ? "failed" : item.status}`}>{STATUS[item.status] ?? item.status}</span>
              </li>
            ))}</ul>
          )}
          {visibleDeliveries.length > deliveriesShown ? <button type="button" className="notify-secondary" onClick={() => setDeliveriesShown((value) => value + 20)}>Show more</button> : null}
        </section>
      ) : null}
    </div>
  );
}
