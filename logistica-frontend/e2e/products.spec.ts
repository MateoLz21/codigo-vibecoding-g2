import { request } from "@playwright/test"
import { test, expect } from "./fixtures"

const PFX = "E2E-Prod"
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"
// Unique suffix per run: keeps SKUs distinct even across soft-deleted leftovers
// (sku has DB-level unique=True; soft-deleted rows still occupy the slot).
const RUN = Date.now().toString(36)

// ── Shared fixtures created once for the whole suite ──────────────────────────
let supplierId = 0
let warehouseId = 0
let supplierName = ""
let warehouseName = ""

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

/** Remove every active E2E-Prod product, then the shared supplier + warehouse. */
async function cleanupAll() {
  const ctx = await mkCtx()
  const { results: prods } = (await (
    await ctx.get("/api/v1/products/")
  ).json()) as { results: Array<{ id: number; name: string }> }
  for (const p of prods.filter((p) => p.name.startsWith(PFX)))
    await ctx.delete(`/api/v1/products/${p.id}/`)

  if (supplierId) await ctx.delete(`/api/v1/suppliers/${supplierId}/`)
  if (warehouseId) await ctx.delete(`/api/v1/warehouses/${warehouseId}/`)
  await ctx.dispose()
}

// ── Helper: click a Select trigger (located by its FormLabel text) and pick an item ──
// The SelectValue children in this form is a render function returning undefined when
// nothing is selected, so the trigger is empty — we can't filter by placeholder text.
// Instead we scope the trigger lookup to the FormItem that contains the matching label.
async function selectOption(
  page: import("@playwright/test").Page,
  labelText: string,
  optionText: string,
) {
  await page
    .locator('[data-slot="form-item"]')
    .filter({ has: page.getByText(labelText, { exact: true }) })
    .locator('[data-slot="select-trigger"]')
    .click()
  // Options render in a portal; only the open popup's items are in the DOM
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: optionText })
    .click()
}

// ── Product payload factory ───────────────────────────────────────────────────
function prod(label: string, skuSuffix: string) {
  return {
    supplier: supplierId,
    warehouse: warehouseId,
    name: `${PFX} ${label}`,
    sku: `E2E-SKU-${skuSuffix}-${RUN}`,
    unit_price: "10.00",
    weight_kg: "1.000",
    stock: 5,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Products CRUD", () => {
  test.beforeAll(async () => {
    const ctx = await mkCtx()

    // Purge any active orphaned E2E products from previous runs
    const { results: prods } = (await (
      await ctx.get("/api/v1/products/")
    ).json()) as { results: Array<{ id: number; name: string }> }
    for (const p of prods.filter((p) => p.name.startsWith(PFX)))
      await ctx.delete(`/api/v1/products/${p.id}/`)

    // Purge orphaned E2E suppliers / warehouses
    const { results: sups } = (await (
      await ctx.get("/api/v1/suppliers/")
    ).json()) as { results: Array<{ id: number; name: string }> }
    for (const s of sups.filter((s) => s.name.startsWith(PFX)))
      await ctx.delete(`/api/v1/suppliers/${s.id}/`)

    const { results: whs } = (await (
      await ctx.get("/api/v1/warehouses/")
    ).json()) as { results: Array<{ id: number; name: string }> }
    for (const w of whs.filter((w) => w.name.startsWith(PFX)))
      await ctx.delete(`/api/v1/warehouses/${w.id}/`)

    // Create fresh dependency fixtures
    const supBody = (await (
      await ctx.post("/api/v1/suppliers/", { data: { name: `${PFX} Proveedor` } })
    ).json()) as { id: number; name: string }
    supplierId = supBody.id
    supplierName = supBody.name

    const whBody = (await (
      await ctx.post("/api/v1/warehouses/", {
        data: { name: `${PFX} Almacén`, address: "Av. E2E", city: "Lima", country: "Peru" },
      })
    ).json()) as { id: number; name: string }
    warehouseId = whBody.id
    warehouseName = whBody.name

    await ctx.dispose()
  })

  test.afterAll(cleanupAll)

  // ── Lista ───────────────────────────────────────────────────────────────────
  test("lista renderiza la tabla con datos sembrados", async ({ page, api }) => {
    const id = await api.seed("products", prod("Lista", "LISTA"))
    try {
      await page.goto("/products")
      await expect(
        page.getByRole("cell", { name: `${PFX} Lista` }),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove("products", id)
    }
  })

  // ── Crear (selects populados) ───────────────────────────────────────────────
  test("crear producto con selects poblados aparece en la lista", async ({ page, api }) => {
    await page.goto("/products")
    await expect(page.locator("h1")).toContainText("Productos", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo producto" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible()

    await page.getByPlaceholder("Laptop HP 15").fill(`${PFX} Crear`)
    await page.getByPlaceholder("LAP-HP-001").fill(`E2E-SKU-CREAR-${RUN}`)
    await page.getByPlaceholder("99.90").fill("25.00")
    await page.getByPlaceholder("1.50").fill("0.500")

    // Verify selects populate and can be chosen
    await selectOption(page, "Proveedor", supplierName)
    await selectOption(page, "Almacén", warehouseName)

    // After selection the trigger should show the chosen name
    await expect(
      page
        .locator('[data-slot="form-item"]')
        .filter({ has: page.getByText("Proveedor", { exact: true }) })
        .locator('[data-slot="select-trigger"]'),
    ).toContainText(supplierName)
    await expect(
      page
        .locator('[data-slot="form-item"]')
        .filter({ has: page.getByText("Almacén", { exact: true }) })
        .locator('[data-slot="select-trigger"]'),
    ).toContainText(warehouseName)

    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/v1/products/") && r.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: "Crear producto" }).click(),
    ])
    const { id } = (await res.json()) as { id: number }

    await expect(
      page.getByRole("cell", { name: `${PFX} Crear` }),
    ).toBeVisible({ timeout: 10_000 })

    await api.remove("products", id)
  })

  // ── Validación ──────────────────────────────────────────────────────────────
  test("formulario vacío muestra errores Zod y no cierra el Sheet", async ({ page }) => {
    await page.goto("/products")
    await expect(page.locator("h1")).toContainText("Productos", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo producto" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible()

    await page.getByRole("button", { name: "Crear producto" }).click()

    await expect(page.getByText("Requerido").first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible()
  })

  // ── Editar ──────────────────────────────────────────────────────────────────
  test("editar producto refleja el cambio en la tabla", async ({ page, api }) => {
    const id = await api.seed("products", prod("Editar", "EDITAR"))
    try {
      await page.goto("/products")
      const row = page.getByRole("row").filter({ hasText: `${PFX} Editar` })
      await expect(row).toBeVisible({ timeout: 10_000 })

      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("heading", { name: "Editar producto" })).toBeVisible()

      const nameInput = page.getByPlaceholder("Laptop HP 15")
      await nameInput.clear()
      await nameInput.fill(`${PFX} Editado`)

      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/products/${id}/`) && r.request().method() === "PATCH",
          { timeout: 10_000 },
        ),
        page.getByRole("button", { name: "Guardar cambios" }).click(),
      ])

      await expect(
        page.getByRole("cell", { name: `${PFX} Editado` }),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove("products", id)
    }
  })

  // ── Eliminar ────────────────────────────────────────────────────────────────
  test("eliminar con confirmación oculta el registro de la tabla (soft delete)", async ({
    page,
    api,
  }) => {
    const id = await api.seed("products", prod("Eliminar", "ELIMINAR"))
    try {
      await page.goto("/products")
      const row = page.getByRole("row").filter({ hasText: `${PFX} Eliminar` })
      await expect(row).toBeVisible({ timeout: 10_000 })

      page.once("dialog", (d) => d.accept())
      await row.getByRole("button", { name: "Eliminar" }).click()

      await expect(
        page.getByRole("cell", { name: `${PFX} Eliminar` }),
      ).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove("products", id) // 404 silently — already soft-deleted
    }
  })

  // ── SKU duplicado ───────────────────────────────────────────────────────────
  test("SKU duplicado → backend rechaza con 400 y formulario permanece abierto", async ({
    page,
    api,
  }) => {
    const dupeSku = `E2E-SKU-DUPE-${RUN}`
    const id = await api.seed("products", {
      ...prod("SKU-Base", "DUPE"),
      sku: dupeSku,
    })
    try {
      await page.goto("/products")
      await expect(page.locator("h1")).toContainText("Productos", { timeout: 10_000 })

      await page.getByRole("button", { name: "Nuevo producto" }).click()
      await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible()

      await page.getByPlaceholder("Laptop HP 15").fill(`${PFX} Dupe`)
      await page.getByPlaceholder("LAP-HP-001").fill(dupeSku) // same SKU → 400
      await page.getByPlaceholder("99.90").fill("15.00")

      await selectOption(page, "Proveedor", supplierName)
      await selectOption(page, "Almacén", warehouseName)

      const [res] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/api/v1/products/") && r.request().method() === "POST",
          { timeout: 10_000 },
        ),
        page.getByRole("button", { name: "Crear producto" }).click(),
      ])

      // Backend rejects duplicate SKU
      expect(res.status()).toBe(400)
      // onSuccess never called → Sheet stays open
      await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible()
    } finally {
      await api.remove("products", id)
    }
  })

  // ── Búsqueda (server-side) ──────────────────────────────────────────────────
  test("búsqueda server-side filtra productos por nombre", async ({ page, api }) => {
    const ids: number[] = []
    try {
      ids.push(await api.seed("products", prod("Buscar-Alfa", "SRCH-A")))
      ids.push(await api.seed("products", prod("Buscar-Beta", "SRCH-B")))
      ids.push(await api.seed("products", prod("Buscar-Gamma", "SRCH-G")))

      await page.goto("/products")
      await expect(
        page.getByRole("cell", { name: `${PFX} Buscar-Alfa` }),
      ).toBeVisible({ timeout: 10_000 })

      // Type search term — triggers a new API request (?search=Buscar-Gamma)
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/api/v1/products/") && r.url().includes("Buscar-Gamma"),
          { timeout: 10_000 },
        ),
        page.fill('input[placeholder="Buscar por nombre, SKU..."]', "Buscar-Gamma"),
      ])

      await expect(
        page.getByRole("cell", { name: `${PFX} Buscar-Gamma` }),
      ).toBeVisible({ timeout: 5_000 })
      await expect(
        page.getByRole("cell", { name: `${PFX} Buscar-Alfa` }),
      ).not.toBeVisible()
      await expect(
        page.getByRole("cell", { name: `${PFX} Buscar-Beta` }),
      ).not.toBeVisible()
    } finally {
      for (const id of ids) await api.remove("products", id)
    }
  })
})
