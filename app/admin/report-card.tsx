"use client";
import { useState } from "react";

export type ReportPerson = {
  id: number;
  username: string;
  email?: string | null;
  role?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photo?: unknown;
  city?: string | null;
};

export type DetailedReport = {
  id: number;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  source?: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  evidence?: Record<string, unknown>;
  reporter?: ReportPerson | null;
  assignee?: ReportPerson | null;
  reportedPerson?: ReportPerson | null;
  reportedHub?: { id: number; name: string } | null;
  timesReported?: number;
  screenshotUrl?: string | null;
};

const REASONS: Record<string, string> = {
  harassment: "Harassment or bullying", hate: "Hate speech", threat: "Threat or violence", scam: "Scam or fraud",
  impersonation: "Impersonation", illegal: "Illegal activity", sexual: "Sexual content", spam: "Spam", other: "Something else",
};
const TARGETS: Record<string, string> = {
  user: "Account", community: "Hub", post: "Post", message: "Message", banter: "Banter post", thread: "Thread reply", event: "Event", job: "Job", product: "Listing",
};
export const STATUS: Record<string, string> = { open: "Open", reviewing: "In review", resolved: "Resolved", dismissed: "Dismissed", appealed: "Appealed" };

export const reasonLabel = (reason: string) => REASONS[reason] ?? (reason.startsWith("hash_bank_match:") ? `Known harmful image (${reason.split(":")[1]})` : reason.replaceAll("_", " "));
export const targetLabel = (type: string) => TARGETS[type] ?? (type.startsWith("image:") ? `Image (${type.slice(6)})` : type);
export const when = (value?: string | null) => (value ? new Date(value).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "—");
export const photoUrl = (photo: unknown) => (typeof photo === "string" ? photo : photo && typeof photo === "object" && typeof (photo as { url?: unknown }).url === "string" ? (photo as { url: string }).url : null);
export const fullName = (person: ReportPerson) => [person.firstName, person.lastName].filter(Boolean).join(" ") || `@${person.username}`;

export function Person({ label, person, fallback }: { label: string; person?: ReportPerson | null; fallback: string }) {
  const photo = person ? photoUrl(person.photo) : null;
  return (
    <div className="report-person">
      <p className="report-label">{label}</p>
      {person ? (
        <div className="report-person-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- member photos are served by the media host */}
          {photo ? <img src={photo} alt={`Photo of ${fullName(person)}`} className="report-avatar" /> : <span className="report-avatar" aria-hidden="true">{fullName(person).replace("@", "").slice(0, 1).toUpperCase()}</span>}
          <div>
            <strong>{fullName(person)}</strong>
            <small>@{person.username} · id {person.id}</small>
            {person.email ? <small><a href={`mailto:${person.email}`}>{person.email}</a></small> : null}
            <small>
              {person.role && person.role !== "user" ? `${person.role} · ` : ""}
              {person.isActive === false ? "Suspended account · " : ""}
              {person.city ? `${person.city} · ` : ""}
              Member since {person.createdAt ? new Date(person.createdAt).toLocaleDateString("en-AU", { month: "short", year: "numeric" }) : "—"}
            </small>
          </div>
        </div>
      ) : <p className="report-muted">{fallback}</p>}
    </div>
  );
}

/** A reported quote banter: the message it quoted, as it was when reported. */
function QuotedContext({ quoted }: { quoted?: Record<string, unknown> | null }) {
  if (!quoted) return null;
  const author = quoted.author as { username?: string; firstName?: string | null } | undefined;
  return <blockquote className="report-quoted">
    <p className="report-label">Quoted {quoted.type === "thread" ? "reply" : "banter"}{author?.username ? ` by @${author.username}` : ""}</p>
    <p>{quoted.state === "available" ? String(quoted.message ?? "") || "(media only)" : quoted.state === "deleted" ? "The quoted message had already been deleted." : "Hidden from the reporter (blocked)."}</p>
  </blockquote>;
}

/** The reported content as it was when reported, then every captured field so nothing is missed. */
export function Snapshot({ evidence }: { evidence: Record<string, unknown> }) {
  const snapshot = (evidence.contentSnapshot ?? null) as Record<string, unknown> | null;
  const text = snapshot ? [snapshot.title, snapshot.message, snapshot.description].filter((value) => typeof value === "string" && value.trim()) as string[] : [];
  const images = snapshot ? ([] as unknown[]).concat(snapshot.images ?? [], snapshot.img ?? [], snapshot.files ?? []).map(photoUrl).filter(Boolean) as string[] : [];
  const facts: [string, unknown][] = snapshot ? [["Status", snapshot.status], ["Starts", snapshot.startsAt ? when(String(snapshot.startsAt)) : null], ["Location", snapshot.location], ["Price", snapshot.priceCents != null ? `${(Number(snapshot.priceCents) / 100).toFixed(2)} ${snapshot.currency ?? ""}` : null], ["Posted", snapshot.createdAt ? when(String(snapshot.createdAt)) : null]] : [];
  return (
    <div className="report-snapshot">
      <p className="report-label">Reported content</p>
      {snapshot ? (
        <>
          {text.map((value, index) => <p key={index} className={index === 0 ? "report-snapshot-title" : "report-snapshot-text"}>{value}</p>)}
          {images.length ? <div className="report-images">{images.slice(0, 6).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- reported media is shown as captured
            <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="Image from the reported content" /></a>
          ))}</div> : null}
          <QuotedContext quoted={snapshot.quoted as Record<string, unknown> | null | undefined} />
          <dl className="report-facts">{facts.filter(([, value]) => value != null && value !== "").map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>
        </>
      ) : <p className="report-muted">No content snapshot was captured for this report type.</p>}
      <details className="report-raw">
        <summary>All captured data</summary>
        <pre>{JSON.stringify(evidence, null, 2)}</pre>
      </details>
    </div>
  );
}

export function ReportCard({ report, onUpdate }: { report: DetailedReport; onUpdate: (status: string, resolution?: string) => Promise<void> }) {
  const [note, setNote] = useState(report.resolution ?? "");
  const [busy, setBusy] = useState("");
  const automated = report.source === "automated" || !report.reporter;
  const act = async (status: string) => {
    setBusy(status);
    try { await onUpdate(status, note.trim() || undefined); } finally { setBusy(""); }
  };
  return (
    <article className="report-card" aria-labelledby={`report-${report.id}-title`}>
      <header className="report-header">
        <div>
          <p className="report-label">Report #{report.id} · {targetLabel(report.targetType)} {report.targetId.length < 24 ? `#${report.targetId}` : ""}</p>
          <h4 id={`report-${report.id}-title`}>{reasonLabel(report.reason)}</h4>
          <p className="report-muted">Filed {when(report.createdAt)}{report.updatedAt && report.updatedAt !== report.createdAt ? ` · updated ${when(report.updatedAt)}` : ""}</p>
        </div>
        <div className="report-badges">
          <span className={`report-status report-status-${report.status}`}>{STATUS[report.status] ?? report.status}</span>
          {automated ? <span className="report-badge">Automated</span> : <span className="report-badge">Member report</span>}
          {(report.timesReported ?? 1) > 1 ? <span className="report-badge report-badge-warn">Reported {report.timesReported} times</span> : null}
        </div>
      </header>

      <div className="report-people">
        <Person label="Reported by" person={report.reporter} fallback={automated ? "Tivorah automated screening" : "Reporter account no longer exists"} />
        {report.reportedHub ? (
          <div className="report-person">
            <p className="report-label">Reported Hub</p>
            <p><strong>{report.reportedHub.name}</strong> <small className="report-muted">· id {report.reportedHub.id}</small></p>
          </div>
        ) : null}
        <Person label={report.reportedHub ? "Hub owner" : "Reported person"} person={report.reportedPerson} fallback="Not identified from this report" />
      </div>

      <div className="report-body">
        <p className="report-label">What the reporter said</p>
        <p className="report-details">{report.details?.trim() || "No extra details were given."}</p>
      </div>

      {report.screenshotUrl ? (
        <div className="report-body">
          <p className="report-label">Screenshot from the reporter</p>
          <a href={report.screenshotUrl} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed evidence link */}
            <img className="report-screenshot" src={report.screenshotUrl} alt="Screenshot attached by the reporter" />
          </a>
          <p className="report-muted">Secure link, valid for 5 minutes. Refresh to see it again.</p>
        </div>
      ) : null}

      <Snapshot evidence={report.evidence ?? {}} />

      <div className="report-body">
        <p className="report-label">Handling</p>
        <p className="report-muted">{report.assignee ? `Handled by ${fullName(report.assignee)}` : "Not picked up yet"}{report.resolvedAt ? ` · closed ${when(report.resolvedAt)}` : ""}</p>
        <label htmlFor={`report-${report.id}-note`}>Resolution note <span className="report-muted">(saved with the next action)</span></label>
        <textarea id={`report-${report.id}-note`} rows={2} maxLength={2000} value={note} onChange={(event) => setNote(event.currentTarget.value)} />
        <div className="report-actions">
          <button type="button" disabled={!!busy} onClick={() => void act("reviewing")}>{busy === "reviewing" ? "Saving…" : "Mark in review"}</button>
          <button type="button" disabled={!!busy} onClick={() => void act("resolved")}>{busy === "resolved" ? "Saving…" : "Resolve"}</button>
          <button type="button" className="secondary" disabled={!!busy} onClick={() => void act("dismissed")}>{busy === "dismissed" ? "Saving…" : "Dismiss"}</button>
        </div>
      </div>
    </article>
  );
}
