import { request } from "@playwright/test"
import { test, expect } from "./fixtures"

const PFX = "E2E-Wh"
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"

function wh(label: string, city = "Lima") {
  return { name: `${PFX} ${label}`, address: `Av. Test ${label}`, city, country: "Peru" }
}

/** Remove all active warehouses whose name starts with PFX. */
async function cleanupAll() {
  const auth = await request.newContext()
  const tok = await auth.post(`${API_URL}/api/v1/auth/token/`, {
    data: {
      username: process.env.E2E_USERNAME ?? "admin",
      password: process.env.E2E_PASSWORD ?? "admin1234",
    },
  })
  const { access } = (await tok.json()) as { access: string }
  await auth.dispose()

  const ctx = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${access}` },
  })
  const { results } = (await (await ctx.get("/api/v1/warehouses/")).json()) as {
    results: Array<{ id: number; name: string }>
  }
  for (const w of results.filter((w) => w.name.startsWith(PFX))) {
    await ctx.delete(`/api/v1/warehouses/${w.id}/`)
  }
  await ctx.dispose()
}

test.describe("Warehouses CRUD", () => {
  test.beforeAll(cleanupAll)
  test.afterAll(cleanupAll)

  // ── Lista ─────────────────────────────────────────────────────
  test("lista renderiza la tabla con datos sembrados", async ({ page, api }) => {
    const id = await api.seed("warehouses", wh("Lista"))
    try {
      await page.goto("/warehouses")
      await expect(
        page.getByRole("cell", { name: `${PFX} Lista` }),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove("warehouses", id)
    }
  })

  // ── Crear ──────────────────────────────────────────────────────
  test("crear almacén desde formulario aparece en la lista", async ({ page, api }) => {
    await page.goto("/warehouses")
    await expect(page.locator("h1")).toContainText("Almacenes", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo almacén" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo almacén" })).toBeVisible()

    await page.getByPlaceholder("Almacén Central").fill(`${PFX} Crear`)
    await page.getByPlaceholder("Av. Principal 123").fill("Av. Nueva 100")
    await page.getByPlaceholder("Lima").fill("Piura")
    // País defaults to "Peru" — skip

    const [res] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/v1/warehouses/") && r.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: "Crear almacén" }).click(),
    ])
    const { id } = (await res.json()) as { id: number }

    await expect(
      page.getByRole("cell", { name: `${PFX} Crear` }),
    ).toBeVisible({ timeout: 10_000 })

    await api.remove("warehouses", id)
  })

  // ── Validación ─────────────────────────────────────────────────
  test("formulario vacío muestra errores Zod y no cierra el Sheet", async ({ page }) => {
    await page.goto("/warehouses")
    await expect(page.locator("h1")).toContainText("Almacenes", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo almacén" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo almacén" })).toBeVisible()

    await page.getByRole("button", { name: "Crear almacén" }).click()

    await expect(page.getByText("Requerido").first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole("heading", { name: "Nuevo almacén" })).toBeVisible()
  })

  // ── Editar ─────────────────────────────────────────────────────
  test("editar almacén refleja el cambio en la tabla", async ({ page, api }) => {
    const id = await api.seed("warehouses", wh("Editar"))
    try {
      await page.goto("/warehouses")
      const row = page.getByRole("row").filter({ hasText: `${PFX} Editar` })
      await expect(row).toBeVisible({ timeout: 10_000 })

      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("heading", { name: "Editar almacén" })).toBeVisible()

      const nameInput = page.getByPlaceholder("Almacén Central")
      await nameInput.clear()
      await nameInput.fill(`${PFX} Editado`)

      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/warehouses/${id}/`) &&
            r.request().method() === "PATCH",
          { timeout: 10_000 },
        ),
        page.getByRole("button", { name: "Guardar cambios" }).click(),
      ])

      await expect(
        page.getByRole("cell", { name: `${PFX} Editado` }),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove("warehouses", id)
    }
  })

  // ── Eliminar ───────────────────────────────────────────────────
  test("eliminar con confirmación oculta el registro de la tabla (soft delete)", async ({
    page,
    api,
  }) => {
    const id = await api.seed("warehouses", wh("Eliminar"))
    try {
      await page.goto("/warehouses")
      const row = page.getByRole("row").filter({ hasText: `${PFX} Eliminar` })
      await expect(row).toBeVisible({ timeout: 10_000 })

      // window.confirm("¿Eliminar este almacén?") — accept
      page.once("dialog", (d) => d.accept())
      await row.getByRole("button", { name: "Eliminar" }).click()

      // queryset filters is_active=True → soft-deleted row disappears
      await expect(
        page.getByRole("cell", { name: `${PFX} Eliminar` }),
      ).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove("warehouses", id) // already soft-deleted → 404, silently ignored
    }
  })

  // ── Búsqueda / filtro ──────────────────────────────────────────
  test("búsqueda filtra filas por nombre en la tabla", async ({ page, api }) => {
    const ids: number[] = []
    try {
      ids.push(await api.seed("warehouses", wh("Filtro-Alfa", "Lima")))
      ids.push(await api.seed("warehouses", wh("Filtro-Beta", "Cusco")))
      ids.push(await api.seed("warehouses", wh("Filtro-Gamma", "Arequipa")))

      await page.goto("/warehouses")
      await expect(
        page.getByRole("cell", { name: `${PFX} Filtro-Alfa` }),
      ).toBeVisible({ timeout: 10_000 })

      await page.fill('input[placeholder="Buscar por nombre o ciudad..."]', "Filtro-Gamma")

      await expect(
        page.getByRole("cell", { name: `${PFX} Filtro-Gamma` }),
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.getByRole("cell", { name: `${PFX} Filtro-Alfa` }),
      ).not.toBeVisible()
      await expect(
        page.getByRole("cell", { name: `${PFX} Filtro-Beta` }),
      ).not.toBeVisible()
    } finally {
      for (const id of ids) await api.remove("warehouses", id)
    }
  })
})
