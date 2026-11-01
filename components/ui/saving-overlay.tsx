"use client";
/**
 * A full-screen "please wait" while something is being created or published, the same on every
 * form (as in the app's SavingOverlay): a darkened backdrop, a card with the brand spinner, what is
 * happening and a line asking people to stay. Nothing behind it can be clicked twice.
 */
export function SavingOverlay({ visible, title, body = "Please wait and keep this page open." }: { visible: boolean; title: string; body?: string }) {
  if (!visible) return null;
  return (
    <div className="saving-overlay" role="dialog" aria-modal="true" aria-live="polite" aria-label={`${title} Please wait.`}>
      <div className="saving-overlay-card">
        <span className="saving-overlay-spinner" aria-hidden="true" />
        <p className="saving-overlay-title">{title}</p>
        <p className="saving-overlay-body">{body}</p>
      </div>
    </div>
  );
}
