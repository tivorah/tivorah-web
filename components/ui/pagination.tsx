"use client";

import { useEffect, useState } from "react";

// Shared list paging for the web: 10 items per page everywhere, Previous / Next,
// and "Page X of Y" when the total is known (server lists may only know "is there more").
export const PAGE_SIZE = 10;

export function Pagination({ page, pageCount, hasNext, onChange, label, busy }: {
  page: number;
  /** Total pages when known (client-side lists). */
  pageCount?: number;
  /** For server lists that only report whether more items exist. */
  hasNext?: boolean;
  onChange: (page: number) => void;
  /** e.g. "Conversation" → "Conversation pages". */
  label: string;
  busy?: boolean;
}) {
  const next = pageCount !== undefined ? page < pageCount : !!hasNext;
  if (page <= 1 && !next) return null;
  return <nav className="account-ticket-pagination" aria-label={`${label} pages`}>
    <button type="button" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span aria-live="polite">{pageCount !== undefined ? `Page ${page} of ${pageCount}` : `Page ${page}`}</span>
    <button type="button" disabled={busy || !next} onClick={() => onChange(page + 1)}>Next</button>
  </nav>;
}

/** Client-side paging over an already-loaded array, clamped when the list shrinks. */
export function usePagedList<T>(items: T[], size = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  useEffect(() => { if (page !== current) setPage(current); }, [page, current]);
  return { page: current, setPage, pageCount, visible: items.slice((current - 1) * size, current * size) };
}
