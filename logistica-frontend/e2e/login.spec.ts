import { expect, test } from "@playwright/test"

// Run without any saved auth state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Login page", () => {
  test("valid credentials redirect away from /login", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="username"]', process.env.E2E_USERNAME ?? "admin")
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD ?? "admin1234")
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 15_000 })
    expect(page.url()).not.toContain("/login")
  })

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="username"]', "usuario_inexistente")
    await page.fill('input[name="password"]', "pass_incorrecta")
    await page.click('button[type="submit"]')

    await expect(page.getByText("Credenciales incorrectas")).toBeVisible({ timeout: 8_000 })
  })
})
