import { test, expect } from "@playwright/test"

const USERNAME = process.env.E2E_USERNAME ?? "admin"
const PASSWORD = process.env.E2E_PASSWORD ?? "admin1234"

// ── Login tests — no saved auth state ─────────────────────────
test.describe("Login flows", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("valid credentials → /dashboard with Sidebar + Header visible", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="username"]', USERNAME)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 15_000 })
    await expect(page.locator("aside")).toBeVisible({ timeout: 8_000 })
    await expect(page.locator("header")).toBeVisible()
  })

  test("invalid credentials → error visible, URL stays /login", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="username"]', "no_existe")
    await page.fill('input[name="password"]', "contrasena_mala")
    await page.click('button[type="submit"]')
    await expect(page.getByText("Credenciales incorrectas")).toBeVisible({ timeout: 8_000 })
    expect(page.url()).toContain("/login")
  })

  // The (dashboard) route group makes the URL /warehouses, not /dashboard/warehouses
  test("no token → /warehouses redirects to /login (AuthGuard)", async ({ page }) => {
    await page.goto("/warehouses")
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain("/login")
  })
})

// ── Session tests — with saved storageState ────────────────────
test.describe("Session management", () => {
  test("logout clears session and redirects to /login; /dashboard also redirects", async ({
    page,
  }) => {
    await page.goto("/warehouses")
    await expect(page.locator("header")).toBeVisible({ timeout: 10_000 })
    // Open user dropdown
    await page.locator('[aria-label="Menú de usuario"]').click()
    await page.getByText("Cerrar sesión").click()
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain("/login")
    // Re-visit a protected route — must redirect again
    await page.goto("/dashboard")
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain("/login")
  })
})

// ── Token refresh — optional advanced case ─────────────────────
test.describe("Token refresh", () => {
  test("expired accessToken triggers silent refresh; user stays on page", async ({ page }) => {
    // The saved storageState persists only refreshToken (accessToken is never stored).
    // On a fresh page load, accessToken=null in Zustand → first warehouses call
    // returns 401 → the response interceptor in client.ts uses refreshToken to
    // obtain a new accessToken and retries the original request.
    let refreshCalled = false
    await page.route(/\/api\/v1\/auth\/token\/refresh\//, async (route) => {
      refreshCalled = true
      await route.continue()
    })

    // Wait for the warehouses 200 response — it only arrives after the 401→refresh→retry cycle
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/warehouses/") && res.status() === 200,
        { timeout: 15_000 },
      ),
      page.goto("/warehouses"),
    ])

    await expect(page.locator("h1")).toContainText("Almacenes")
    expect(refreshCalled).toBe(true)
    expect(page.url()).not.toContain("/login")
  })
})
