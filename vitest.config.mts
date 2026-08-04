import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Satisfy the Zod env validation in src/config/env.ts at import time so
    // modules that read `env`/`siteConfig` (robots, sitemap, about, ...) load.
    env: {
      SESSION_SECRET: "test-session-secret-that-is-long-enough",
      NEXT_PUBLIC_API_URL: "https://api.test.local",
      NEXT_PUBLIC_SITE_URL: "https://test.local",
      NEXT_PUBLIC_SITE_NAME: "Test Starter",
      NEXT_PUBLIC_SITE_DESCRIPTION: "A starter template used in tests.",
      NEXT_PUBLIC_TWITTER_HANDLE: "@teststarter",
    },
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    // Keep Playwright E2E specs (test/e2e) out of the Vitest run.
    exclude: ["test/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Measure app code under src/, not tests or generated/config files.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        "src/types/**",
        "src/**/layout.tsx",
        "src/instrumentation*.ts",
      ],
    },
  },
});
