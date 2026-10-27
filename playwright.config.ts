import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:7456",
    // Every test starts with the analytics question answered ("No thanks"), so the consent banner
    // doesn't sit over the page; tests/analytics-consent.spec.ts covers the banner itself.
    storageState: "tests/fixtures/answered-consent.json",
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
  },
  workers: 1,
  timeout: 45000,
  reporter: "list",
});
