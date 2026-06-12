import { test as setup } from "@playwright/test"
import path from "path"
import fs from "fs"

const AUTH_FILE = "playwright/.auth/user.json"

setup("authenticate", async ({ page }) => {
  const username = process.env.E2E_USERNAME ?? "admin"
  const password = process.env.E2E_PASSWORD ?? "admin1234"

  await page.goto("/login")
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 15_000 })

  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  await page.context().storageState({ path: AUTH_FILE })
})
