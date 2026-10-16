import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";

// WCAG 2.2 A/AA check of the main public pages at phone and desktop widths (axe-core). Serious and
// critical problems fail the test; every finding is written to A11Y_REPORT_DIR when set.
const pages = ["/", "/events", "/shop", "/services", "/hubs", "/auth/signin", "/auth/signup", "/privacy", "/terms", "/about", "/contact"];
const widths = [390, 1280];

for (const width of widths) {
  for (const path of pages) {
    test(`${path} meets WCAG 2.2 AA at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/auth/get-session**", (route) => route.fulfill({ json: null }));
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const findings = results.violations.map((violation) => ({
        id: violation.id, impact: violation.impact, help: violation.help, count: violation.nodes.length,
        targets: violation.nodes.slice(0, 5).map((node) => ({ target: node.target.join(" "), summary: node.failureSummary?.split("\n").slice(0, 3).join(" ") })),
      }));
      if (process.env.A11Y_REPORT_DIR) writeFileSync(`${process.env.A11Y_REPORT_DIR}/${width}${path.replace(/\//g, "_") || "_home"}.json`, JSON.stringify(findings, null, 2));
      expect(findings.filter((finding) => finding.impact === "serious" || finding.impact === "critical"), JSON.stringify(findings, null, 1)).toEqual([]);
    });
  }
}
