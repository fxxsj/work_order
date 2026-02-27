import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:8080"
  },
  webServer: {
    command: "pnpm -C apps/web dev --host 127.0.0.1 --port 8080 --strictPort",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 60_000
  }
});
