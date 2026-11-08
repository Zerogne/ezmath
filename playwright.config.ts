import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Browser tests run against a production build in mock mode: the Supabase variables are blanked, so the
 * app serves the bundled mock tests and needs no database or secrets (the same in CI and locally).
 */
const mockEnv = { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN: "", ROLLBAR_SERVER_TOKEN: "", NEXT_PUBLIC_ROLLBAR_EZMATH_CLIENT_TOKEN_1794145568: "", ROLLBAR_EZMATH_SERVER_TOKEN_1794145568: "", ADMIN_DEMO_MODE: "" };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", locale: "mn-MN" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: /smoke/ },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: mockEnv,
    timeout: 600_000,
    reuseExistingServer: !process.env.CI,
  },
});
