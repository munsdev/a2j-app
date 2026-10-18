import { defineConfig, devices } from "@playwright/test";

/* End-to-end tests against the production build (npm run build first, or let webServer do it). */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  /* reduced motion: scans and screenshots see the settled page, not a frame of an entrance animation */
  use: {
    baseURL: "http://localhost:8765/",
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  webServer: {
    command: "npx vite preview --port 8765 --strictPort",
    url: "http://localhost:8765/",
    reuseExistingServer: true,
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } },
  ],
});
