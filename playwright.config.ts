import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";

function resolveLocalChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const winShell = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "ms-playwright",
    "chromium_headless_shell-1254",
    "chrome-headless-shell-win64",
    "chrome-headless-shell.exe"
  );
  if (fs.existsSync(winShell)) return winShell;

  const winFull = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "ms-playwright",
    "chromium-1254",
    "chrome-win64",
    "chrome.exe"
  );
  if (fs.existsSync(winFull)) return winFull;
  return undefined;
}

const executablePath = resolveLocalChromiumExecutable();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3010",
    timezoneId: "Asia/Manila",
    locale: "en-US",
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: "chromium-manila",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        timezoneId: "Asia/Manila",
      },
    },
  ],
  webServer: {
    command: "corepack pnpm build && corepack pnpm start --port 3010",
    url: "http://localhost:3010/api/health",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
