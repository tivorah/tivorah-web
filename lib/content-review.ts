/**
 * "Consider editing your post" on the website (same flow as the app's api/contentReview.ts).
 * When the API answers a post with 422 CONTENT_NUDGE or CONTENT_BLOCKED, `api()` asks here and
 * waits: "Post anyway" (nudges only) sends it again confirmed; "Edit" fails the request quietly.
 */
export type ContentReviewKind = "nudge" | "block";
export type ContentReviewChoice = "post" | "edit";
export type ContentReviewRequest = { kind: ContentReviewKind; message: string; resolve: (choice: ContentReviewChoice) => void };

export const CONTENT_REVIEW_CODES = new Set(["CONTENT_NUDGE", "CONTENT_BLOCKED"]);
export const CONFIRM_CONTENT_HEADER = "X-Tivorah-Confirm-Content";

let listener: ((request: ContentReviewRequest | null) => void) | null = null;
let current: ContentReviewRequest | null = null;

/** The dialog registers itself; only one is mounted (in the root layout). */
export function onContentReview(next: typeof listener) {
  listener = next;
  return () => { if (listener === next) listener = null; };
}

export function askContentReview(kind: ContentReviewKind, message: string): Promise<ContentReviewChoice> {
  // No dialog on the page (e.g. tests): treat as "edit" so nothing is posted unconfirmed.
  if (!listener) return Promise.resolve("edit");
  current?.resolve("edit");
  return new Promise((resolve) => {
    current = { kind, message, resolve: (choice) => { current = null; listener?.(null); resolve(choice); } };
    listener?.(current);
  });
}
