"use client";
import { useMemo, useState } from "react";
import { Person, Snapshot, STATUS, fullName, reasonLabel, targetLabel, when, type DetailedReport } from "./report-card";
import { ShowcaseMediaReview } from "./showcase-media-review";

// Moderation as an inbox: reports on the left, the chosen report on the right, and one clear
// decision at the bottom. Urgent reasons and repeat reports come first; after a decision the next
// report opens, so a moderator can work straight down the queue. Showcase videos have their own tab.

type Request = (path: string, init?: RequestInit) => Promise<any>;
type Filter = "todo" | "resolved" | "dismissed";

const URGENT = new Set(["threat", "illegal", "sexual"]);
const isUrgent = (report: DetailedReport) => URGENT.has(report.reason) || report.reason.startsWith("hash_bank_match:");
const isOpen = (report: DetailedReport) => ["open", "reviewing", "appealed"].includes(report.status);
/** Reports still waiting for a decision (used for the sidebar count too). */
export const openReportCount = (reports: DetailedReport[]) => reports.filter(isOpen).length;

const ago = (value?: string | null) => {
  if (!value) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

/** Urgent first, then the most reported, then the oldest (fair queue order). */
const queueOrder = (a: DetailedReport, b: DetailedReport) =>
  Number(isUrgent(b)) - Number(isUrgent(a))
  || (b.timesReported ?? 1) - (a.timesReported ?? 1)
  || new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();

export function Moderation({ reports, request, onUpdate }: {
  reports: DetailedReport[];
  request: Request;
  onUpdate: (report: DetailedReport, status: string, resolution?: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"reports" | "videos">("reports");
  const [filter, setFilter] = useState<Filter>("todo");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDetailOnPhone, setShowDetailOnPhone] = useState(false);

  const groups = useMemo(() => ({
    todo: reports.filter(isOpen).sort(queueOrder),
    resolved: reports.filter((report) => report.status === "resolved"),
    dismissed: reports.filter((report) => report.status === "dismissed"),
  }), [reports]);
  const list = groups[filter];
  const selected = list.find((report) => report.id === selectedId) ?? list[0] ?? null;

  const choose = (id: number) => { setSelectedId(id); setShowDetailOnPhone(true); };
  const decide = async (report: DetailedReport, status: string, note?: string) => {
    // Open the next report in the queue once this one is decided.
    const position = list.findIndex((entry) => entry.id === report.id);
    const next = list[position + 1] ?? list[position - 1] ?? null;
    await onUpdate(report, status, note);
    if (status === "resolved" || status === "dismissed") { setSelectedId(next?.id ?? null); if (!next) setShowDetailOnPhone(false); }
  };

  return (
    <div className="mod">
      <div className="mod-tabs" role="tablist" aria-label="Moderation">
        <button type="button" role="tab" aria-selected={tab === "reports"} onClick={() => setTab("reports")}>
          Reports {groups.todo.length ? <b>{groups.todo.length}</b> : null}
        </button>
        <button type="button" role="tab" aria-selected={tab === "videos"} onClick={() => setTab("videos")}>Showcase videos</button>
      </div>

      {tab === "videos" ? <div className="mod-videos"><ShowcaseMediaReview request={request} /></div> : (
        <>
          <div className="mod-filters" role="group" aria-label="Show reports">
            {([["todo", "To review"], ["resolved", "Resolved"], ["dismissed", "Dismissed"]] as [Filter, string][]).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setSelectedId(null); setShowDetailOnPhone(false); }}>
                {label} <span>{groups[value].length}</span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="mod-empty">
              <strong>{filter === "todo" ? "All caught up" : `No ${filter} reports`}</strong>
              <p>{filter === "todo" ? "There are no reports waiting for a decision. New reports from members and automated screening appear here." : "Reports you close will be listed here for reference."}</p>
            </div>
          ) : (
            <div className={`mod-inbox${showDetailOnPhone ? " mod-inbox-detail" : ""}`}>
              <ul className="mod-list" aria-label={`${list.length} reports`}>
                {list.map((report) => (
                  <li key={report.id}>
                    <button type="button" aria-current={selected?.id === report.id ? "true" : undefined} onClick={() => choose(report.id)}>
                      <span className="mod-list-top">
                        <strong>{reasonLabel(report.reason)}</strong>
                        <small>{ago(report.createdAt)}</small>
                      </span>
                      <span className="mod-list-sub">
                        {targetLabel(report.targetType)}
                        {report.reportedPerson ? ` · ${fullName(report.reportedPerson)}` : report.reportedHub ? ` · ${report.reportedHub.name}` : ""}
                      </span>
                      <span className="mod-list-tags">
                        {isUrgent(report) ? <em className="mod-tag mod-tag-urgent">Urgent</em> : null}
                        {(report.timesReported ?? 1) > 1 ? <em className="mod-tag mod-tag-warn">Reported {report.timesReported}×</em> : null}
                        {report.status === "reviewing" ? <em className="mod-tag">In review</em> : null}
                        {report.status === "appealed" ? <em className="mod-tag">Appealed</em> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {selected ? <ReportDetail key={selected.id} report={selected} request={request} onBack={() => setShowDetailOnPhone(false)} onDecide={(status, note) => decide(selected, status, note)} /> : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportDetail({ report, request, onBack, onDecide }: {
  report: DetailedReport;
  request: Request;
  onBack: () => void;
  onDecide: (status: string, note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState(report.resolution ?? "");
  const [busy, setBusy] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountActive, setAccountActive] = useState(report.reportedPerson?.isActive !== false);
  const [message, setMessage] = useState("");
  const automated = report.source === "automated" || !report.reporter;
  const open = ["open", "reviewing", "appealed"].includes(report.status);

  const act = async (status: string) => {
    setBusy(status);
    setMessage("");
    try { await onDecide(status, note.trim() || undefined); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "That didn’t save. Try again."); }
    finally { setBusy(""); }
  };
  const toggleAccount = async () => {
    const person = report.reportedPerson;
    if (!person) return;
    const suspending = accountActive;
    if (suspending && !window.confirm(`Suspend ${fullName(person)}? They won’t be able to sign in until an admin restores the account.`)) return;
    setAccountBusy(true);
    setMessage("");
    try {
      await request(`/api/v1/admin/users/${person.id}/access`, { method: "PATCH", body: JSON.stringify({ isActive: !suspending }) });
      setAccountActive(!suspending);
      setMessage(suspending ? "Account suspended." : "Account restored.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The account couldn’t be updated.");
    } finally {
      setAccountBusy(false);
    }
  };

  return (
    <article className="mod-detail" aria-labelledby={`mod-${report.id}`}>
      <button type="button" className="mod-back" onClick={onBack}>← All reports</button>
      <header className="mod-detail-head">
        <p className="product-eyebrow">{targetLabel(report.targetType).toUpperCase()} · REPORT #{report.id}</p>
        <h2 id={`mod-${report.id}`}>{reasonLabel(report.reason)}</h2>
        <p>
          {automated ? "Flagged by automated screening" : `Reported by ${report.reporter ? fullName(report.reporter) : "a member"}`} · {when(report.createdAt)}
          {(report.timesReported ?? 1) > 1 ? ` · reported ${report.timesReported} times in total` : ""}
        </p>
        <span className={`mod-status mod-status-${report.status}`}>{STATUS[report.status] ?? report.status}</span>
      </header>

      <section className="mod-block">
        <h3>1. What was reported</h3>
        <Snapshot evidence={report.evidence ?? {}} />
      </section>

      <section className="mod-block">
        <h3>2. Why it was reported</h3>
        <p className="mod-quote">{report.details?.trim() || "The reporter didn’t add any details."}</p>
        {report.screenshotUrl ? (
          <a href={report.screenshotUrl} target="_blank" rel="noreferrer" className="mod-screenshot">
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed evidence link */}
            <img src={report.screenshotUrl} alt="Screenshot attached by the reporter" />
            <small>Reporter’s screenshot · secure link, valid for 5 minutes</small>
          </a>
        ) : null}
      </section>

      <section className="mod-block">
        <h3>3. Who’s involved</h3>
        <div className="mod-people">
          <div>
            <Person label={report.reportedHub ? `Hub owner · ${report.reportedHub.name}` : "Reported person"} person={report.reportedPerson} fallback="Not identified from this report" />
            {report.reportedPerson ? (
              <button type="button" className={accountActive ? "mod-danger" : "product-secondary"} disabled={accountBusy} onClick={() => void toggleAccount()}>
                {accountBusy ? "Saving…" : accountActive ? "Suspend this account" : "Restore this account"}
              </button>
            ) : null}
          </div>
          <Person label="Reported by" person={report.reporter} fallback={automated ? "Tivorah automated screening" : "The reporter’s account no longer exists"} />
        </div>
      </section>

      <section className="mod-decision" aria-label="Decision">
        {open ? (
          <>
            <h3>4. Your decision</h3>
            <label htmlFor={`mod-note-${report.id}`}>Note for the record <span>(optional, staff only)</span></label>
            <textarea id={`mod-note-${report.id}`} rows={2} maxLength={2000} value={note} placeholder="e.g. Removed the post and warned the member." onChange={(event) => setNote(event.currentTarget.value)} />
            <div className="mod-decision-actions">
              <button type="button" className="product-primary" disabled={!!busy} onClick={() => void act("resolved")}>
                {busy === "resolved" ? "Saving…" : "Resolve: action taken"}
              </button>
              <button type="button" className="product-secondary" disabled={!!busy} onClick={() => void act("dismissed")}>
                {busy === "dismissed" ? "Saving…" : "Dismiss: no rule broken"}
              </button>
              {report.status !== "reviewing" ? (
                <button type="button" className="mod-link" disabled={!!busy} onClick={() => void act("reviewing")}>
                  {busy === "reviewing" ? "Saving…" : "I’m looking into it"}
                </button>
              ) : null}
            </div>
            <p className="mod-hint">Resolving or dismissing closes the report and opens the next one.</p>
          </>
        ) : (
          <>
            <h3>Outcome</h3>
            <p>{report.status === "resolved" ? "Resolved: action was taken." : "Dismissed: no rule was broken."}{report.assignee ? ` By ${fullName(report.assignee)}` : ""}{report.resolvedAt ? ` · ${when(report.resolvedAt)}` : ""}</p>
            {report.resolution ? <p className="mod-quote">{report.resolution}</p> : null}
            <button type="button" className="product-secondary" disabled={!!busy} onClick={() => void act("reviewing")}>{busy === "reviewing" ? "Saving…" : "Reopen"}</button>
          </>
        )}
        {message ? <p role="status" className="mod-message">{message}</p> : null}
      </section>
    </article>
  );
}
