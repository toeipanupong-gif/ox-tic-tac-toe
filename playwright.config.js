import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // local: next dev (ไม่ต้อง build) · CI: build แล้ว start
    command: isCI
      ? "node scripts/run.mjs prisma generate && node scripts/run.mjs next build && node scripts/run.mjs next start"
      : "node scripts/run.mjs next dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
