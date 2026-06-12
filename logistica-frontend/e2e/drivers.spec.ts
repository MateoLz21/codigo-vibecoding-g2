// NOTE: Driver model has no transport FK in this implementation.
// The form only contains user credentials + license fields.
// Transport is a separate module (vehicles) not related to Driver in the DB.
import { request } from "@playwright/test"
import { test, expect } from "./fixtures"

const LIC_PFX = "E2DLIC"   // prefix for license_number → identifies E2E drivers in cleanup
const LNAME_PFX = "E2E-Drv" // prefix for last_name → used to locate rows in the table
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"
// Both license_number and username have DB-level unique constraints (license_number on
// Driver; username on Django's auth_user). Soft-deleted rows still occupy those values,
// so we suffix every value with RUN to guarantee uniqueness across test runs.
const RUN = Date.now().toString(36)

async function mkCtx() {
  const auth = await request.newContext()
  const tok = await auth.post(`${API_URL}/api/v1/auth/token/`, {
    data: {
      username: process.env.E2E_USERNAME ?? "admin",
      password: process.env.E2E_PASSWORD ?? "admin1234",
    },
  })
  const { access } = (await tok.json()) as { access: string }
  await auth.dispose()
  return request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${access}` },
  })
}

/** Soft-delete all active E2E drivers (identified by license_number prefix). */
async function cleanupAll() {
  const ctx = await mkCtx()
  const { results } = (await (
    await ctx.get("/api/v1/drivers/")
  ).json()) as { results: Array<{ id: number; license_number: string }> }
  for (const d of results.filter((d) => d.license_number.startsWith(LIC_PFX)))
    await ctx.delete(`/api/v1/drivers/${d.id}/`)
  await ctx.dispose()
}

/** Factory for a full driver payload seeded via API. */
function drv(label: string) {
  const slug = label.toLowerCase()
  return {
    user: {
      username: `e2drvr-${slug}-${RUN}`,
      password: "test1234",
      first_name: "E2E",
      last_name: `${LNAME_PFX}-${label}`,
      email: `e2drvr-${slug}-${RUN}@test.com`,
    },
    license_number: `${LIC_PFX}-${label}-${RUN}`,
    license_expiry: "2027-12-31",
    is_available: true,
  }
}

// Full name as rendered in the "Nombre completo" column
function fullName(label: string) {
  return `E2E ${LNAME_PFX}-${label}`
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Drivers CRUD", () => {
  test.beforeAll(cleanupAll)
  test.afterAll(cleanupAll)

  // ── Lista ───────────────────────────────────────────────────────────────────
  // Verifies that user-derived fields (full_name = first_name + last_name,
  // license_number) reach the table from the nested user object in the GET response.
  test("lista muestra campos derivados del user: full_name y license_number", async ({
    page,
    api,
  }) => {
    const seed = drv("Lista")
    const id = await api.seed("drivers", seed)
    try {
      await page.goto("/drivers")
      await expect(page.locator("h1")).toContainText("Conductores", { timeout: 10_000 })
      // license_number column
      await expect(
        page.getByRole("cell", { name: seed.license_number }),
      ).toBeVisible({ timeout: 10_000 })
      // "Nombre completo" column — derived from user.first_name + user.last_name
      await expect(
        page.getByRole("cell", { name: fullName("Lista") }),
      ).toBeVisible()
    } finally {
      await api.remove("drivers", id)
    }
  })

  // ── Crear ───────────────────────────────────────────────────────────────────
  // Fills the create form (user credentials + license data) and verifies the
  // resulting row shows the user-derived full_name. Also confirms username is
  // saved correctly by inspecting the POST response body.
  test("crear conductor desde formulario aparece en la lista", async ({ page, api }) => {
    await page.goto("/drivers")
    await expect(page.locator("h1")).toContainText("Conductores", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo conductor" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo conductor" })).toBeVisible()

    const username = `e2drvr-form-${RUN}`
    const licNum = `${LIC_PFX}-FORM-${RUN}`

    // Datos de acceso
    await page.getByPlaceholder("juan.perez").fill(username)
    await page.getByPlaceholder("••••••").fill("test1234")
    // Datos personales
    await page.getByPlaceholder("Juan", { exact: true }).fill("E2E")
    await page.getByPlaceholder("Pérez").fill(`${LNAME_PFX}-Form`)
    await page.getByPlaceholder("juan@ejemplo.com").fill(`${username}@test.com`)
    // Datos del conductor
    await page.getByPlaceholder("Q12345678").fill(licNum)
    // Date input has no placeholder — there is only one date input in the form
    await page.locator('input[type="date"]').fill("2028-06-15")
    // phone: leave empty (optional)

    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/v1/drivers/") && r.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: "Crear conductor" }).click(),
    ])

    const body = (await res.json()) as { id: number; user: { username: string } }
    // Verify username was persisted in the nested user object
    expect(body.user.username).toBe(username)

    // Row appears in table with user-derived full_name
    await expect(
      page.getByRole("cell", { name: fullName("Form") }),
    ).toBeVisible({ timeout: 10_000 })

    // Cleanup the created driver
    await api.remove("drivers", body.id)
  })

  // ── Validación ──────────────────────────────────────────────────────────────
  test("formulario vacío muestra errores Zod y no cierra el Sheet", async ({ page }) => {
    await page.goto("/drivers")
    await expect(page.locator("h1")).toContainText("Conductores", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo conductor" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo conductor" })).toBeVisible()

    await page.getByRole("button", { name: "Crear conductor" }).click()

    await expect(page.getByText("Requerido").first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole("heading", { name: "Nuevo conductor" })).toBeVisible()
  })

  // ── Editar ──────────────────────────────────────────────────────────────────
  // Opens the edit form and verifies email is pre-filled from the nested user
  // object (user-derived field). Then changes first_name and confirms the update
  // is reflected in the "Nombre completo" table column.
  test("editar conductor: email pre-rellenado, cambio de nombre refleja en tabla", async ({
    page,
    api,
  }) => {
    const seed = drv("Editar")
    const id = await api.seed("drivers", seed)
    try {
      await page.goto("/drivers")
      const row = page.getByRole("row").filter({ hasText: seed.license_number })
      await expect(row).toBeVisible({ timeout: 10_000 })

      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("heading", { name: "Editar conductor" })).toBeVisible()

      // email field pre-filled from user.email (user-derived field)
      await expect(page.getByPlaceholder("juan@ejemplo.com")).toHaveValue(
        seed.user.email,
      )

      // Change first_name
      const nameInput = page.getByPlaceholder("Juan", { exact: true })
      await nameInput.clear()
      await nameInput.fill("Editado")

      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/drivers/${id}/`) && r.request().method() === "PATCH",
          { timeout: 10_000 },
        ),
        page.getByRole("button", { name: "Guardar cambios" }).click(),
      ])

      // "Nombre completo" column now shows updated first_name + unchanged last_name
      await expect(
        page.getByRole("cell", { name: `Editado ${LNAME_PFX}-Editar` }),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove("drivers", id)
    }
  })

  // ── Eliminar ────────────────────────────────────────────────────────────────
  // Soft delete sets user.is_active=False; the queryset filters user__is_active=True
  // so the row disappears from the list without a physical DB delete.
  test("eliminar con confirmación oculta el registro (soft delete via user.is_active)", async ({
    page,
    api,
  }) => {
    const seed = drv("Eliminar")
    const id = await api.seed("drivers", seed)
    try {
      await page.goto("/drivers")
      const row = page.getByRole("row").filter({ hasText: seed.license_number })
      await expect(row).toBeVisible({ timeout: 10_000 })

      page.once("dialog", (d) => d.accept())
      await row.getByRole("button", { name: "Eliminar" }).click()

      await expect(
        page.getByRole("cell", { name: seed.license_number }),
      ).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove("drivers", id) // already soft-deleted → 404, silently ignored
    }
  })

  // ── Búsqueda (server-side) ──────────────────────────────────────────────────
  test("búsqueda server-side filtra conductores por nombre", async ({ page, api }) => {
    const ids: number[] = []
    try {
      ids.push(await api.seed("drivers", drv("Srch-Alfa")))
      ids.push(await api.seed("drivers", drv("Srch-Beta")))
      ids.push(await api.seed("drivers", drv("Srch-Gamma")))

      await page.goto("/drivers")
      await expect(
        page.getByRole("cell", { name: fullName("Srch-Alfa") }),
      ).toBeVisible({ timeout: 10_000 })

      // Trigger server-side search (?search=Srch-Gamma)
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/api/v1/drivers/") && r.url().includes("Srch-Gamma"),
          { timeout: 10_000 },
        ),
        page.fill('input[placeholder="Buscar por nombre, licencia..."]', "Srch-Gamma"),
      ])

      await expect(
        page.getByRole("cell", { name: fullName("Srch-Gamma") }),
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.getByRole("cell", { name: fullName("Srch-Alfa") }),
      ).not.toBeVisible()
      await expect(
        page.getByRole("cell", { name: fullName("Srch-Beta") }),
      ).not.toBeVisible()
    } finally {
      for (const id of ids) await api.remove("drivers", id)
    }
  })
})
