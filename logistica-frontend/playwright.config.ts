/**
 * Prerequisites before running E2E tests:
 *
 * 1. Backend running:  cd logistica-api && python manage.py runserver 8000
 * 2. Frontend running: cd logistica-frontend && npm run dev   (port 3000)
 * 3. Test user exists in Django:
 *      python manage.py shell -c "
 *        from django.contrib.auth import get_user_model
 *        U = get_user_model()
 *        U.objects.create_superuser('admin', 'admin@test.com', 'admin1234')
 *      "
 *    Or set E2E_USERNAME / E2E_PASSWORD env vars pointing to an existing user.
 *
 * webServer is intentionally omitted — servers are managed manually.
 */

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "login-tests",
      testMatch: /login\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: /login\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
  ],
  reporter: [["html"], ["list"]],
})
