"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sheet } from "./sheet";
import { onContentReview, type ContentReviewRequest } from "../../lib/content-review";

/** Mounted once in the root layout; opened by api() when a post needs a second look. */
export function ContentReviewDialog() {
  const [request, setRequest] = useState<ContentReviewRequest | null>(null);
  useEffect(() => onContentReview(setRequest), []);
  const blocked = request?.kind === "block";
  return (
    <Sheet open={Boolean(request)} onClose={() => request?.resolve("edit")}
      title={blocked ? "This can’t be posted" : "Consider editing your post"}
      description={request?.message}
      footer={<>
        <Link className="content-review-mistake" href="/contact?subject=Content%20check%20mistake" onClick={() => request?.resolve("edit")}>Think we made a mistake? Let us know</Link>
        <span className="tv-sheet-foot-actions">
          {blocked ? null : <button type="button" className="product-secondary" onClick={() => request?.resolve("post")}>Post anyway</button>}
          <button type="button" className="product-primary press-fx" onClick={() => request?.resolve("edit")} autoFocus>Edit</button>
        </span>
      </>}>
      <p className="content-review-icon" aria-hidden="true">{blocked ? "⛔" : "⚠️"}</p>
    </Sheet>
  );
}
