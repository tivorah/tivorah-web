// Same thresholds as the mobile sheets (tivorah-mobile/constants/sheet.ts).
export const SHEET_DISMISS_DISTANCE = 110;
export const SHEET_DISMISS_VELOCITY = 1.1; // px per ms

/** Whether a downward drag should close the sheet when released. */
export const shouldDismissSheet = (dy: number, velocity: number) =>
  dy > SHEET_DISMISS_DISTANCE || (dy > 24 && velocity > SHEET_DISMISS_VELOCITY);

/** How far the on-screen keyboard covers the bottom of the layout viewport (iOS Safari). */
export const keyboardInset = (layoutHeight: number, visualHeight: number, visualOffsetTop: number) =>
  Math.max(0, Math.round(layoutHeight - visualHeight - visualOffsetTop));
