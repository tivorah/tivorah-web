"use client";

// Counts page changes inside this browser tab, so "Back" buttons know whether
// there is a Tivorah page to return to (client-side navigation does not update
// document.referrer).
let depth = 0;
export const noteNavigation = () => { depth += 1; };
export const hasInAppHistory = () => depth > 1;
