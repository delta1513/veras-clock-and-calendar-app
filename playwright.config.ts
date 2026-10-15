import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Some sandboxes ship a pre-installed Chromium that is older than the one this
// Playwright version expects. Use it when it is there; otherwise Playwright
// uses its own download.
const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = existsSync(PREINSTALLED_CHROMIUM)
  ? PREINSTALLED_CHROMIUM
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    launchOptions: { executablePath },
  },
  projects: [
    {
      name: "phone",
      // Vera uses a phone, one-handed, so that is the viewport under test.
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Building and serving out/ means every test run also proves the static
  // export works exactly as it will when hosted.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT} --no-clipboard`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
