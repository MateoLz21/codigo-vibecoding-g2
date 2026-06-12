// NOTE: The Shipment model has no `tracking_number` field.
// The shipment is identified by its auto-increment `id`, shown in the detail page
// title "Envío #{id}".
//
// Backend fix applied: ShipmentSerializer now includes `items` (reverse FK, read-only)
// so the detail page can display items without a separate API call.
//
// Dependency chain: supplier → warehouse → product (for items)
//                   customer (for shipment)
//                   transport (optional in form, pre-seeded for select verification)
import { request } from "@playwright/test"
import { test, expect } from "./fixtures"

const PFX = "E2E-Ship"
// Used as a stable search key to find E2E shipments in cleanup
// (search_fields includes destination_address)
const DEST_PFX = "E2E-Ship-Dest"
const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"
// Unique per run — guards against soft-deleted rows whose unique constraints remain active
// (customer.email, transport.plate_number, product.sku)
const RUN = Date.now().toString(36)

// ── Shared dependency IDs ─────────────────────────────────────────────────────
let supplierId = 0
let warehouseId = 0
let customerId = 0
let customerName = ""
let transportId = 0
let plateNumber = ""
let productId = 0
let productName = ""
let productSku = ""

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

// ── Select helper (form-item label approach) ──────────────────────────────────
// The SelectValue children in this codebase is a render function that returns
// undefined for unselected state → trigger text is invisible → can't filter by
// placeholder. Scope the trigger lookup via the FormLabel text inside FormItem.
async function selectInForm(
  page: import("@playwright/test").Page,
  labelText: string,
  optionText: string,
) {
  await page
    .locator('[data-slot="form-item"]')
    .filter({ has: page.getByText(labelText, { exact: true }) })
    .locator('[data-slot="select-trigger"]')
    .click()
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: optionText })
    .click()
}

// ── Seed helpers ──────────────────────────────────────────────────────────────
function shipmentPayload(label: string) {
  return {
    customer: customerId,
    origin_warehouse: warehouseId,
    origin_address: "Av. Origen E2E 100",
    destination_address: `${DEST_PFX}-${label}`,
    shipping_date: "2027-01-15",
  }
}

// ── Purge E2E shipments, then dependency fixtures ─────────────────────────────
async function cleanupAll() {
  const ctx = await mkCtx()

  // Shipments: search by destination_address prefix (search_fields includes it)
  const shipRes = await ctx.get(`/api/v1/shipments/?search=${encodeURIComponent(DEST_PFX)}`)
  const { results: ships } = (await shipRes.json()) as { results: { id: number }[] }
  for (const s of ships) await ctx.delete(`/api/v1/shipments/${s.id}/`)

  // Dependency fixtures (soft-delete by stored ID)
  if (productId) await ctx.delete(`/api/v1/products/${productId}/`)
  if (supplierId) await ctx.delete(`/api/v1/suppliers/${supplierId}/`)
  if (transportId) await ctx.delete(`/api/v1/transport/${transportId}/`)
  if (customerId) await ctx.delete(`/api/v1/customers/${customerId}/`)
  if (warehouseId) await ctx.delete(`/api/v1/warehouses/${warehouseId}/`)

  await ctx.dispose()
}

// ── Purge orphans from previous runs (by name prefix, before seeding fresh ones) ─
async function purgeOrphanDeps() {
  const ctx = await mkCtx()

  // Products
  const pRes = await ctx.get("/api/v1/products/")
  const { results: prods } = (await pRes.json()) as { results: { id: number; name: string }[] }
  for (const p of prods.filter((p) => p.name.startsWith(PFX)))
    await ctx.delete(`/api/v1/products/${p.id}/`)

  // Suppliers
  const sRes = await ctx.get("/api/v1/suppliers/")
  const { results: sups } = (await sRes.json()) as { results: { id: number; name: string }[] }
  for (const s of sups.filter((s) => s.name.startsWith(PFX)))
    await ctx.delete(`/api/v1/suppliers/${s.id}/`)

  // Customers
  const cRes = await ctx.get("/api/v1/customers/")
  const { results: custs } = (await cRes.json()) as { results: { id: number; name: string }[] }
  for (const c of custs.filter((c) => c.name.startsWith(PFX)))
    await ctx.delete(`/api/v1/customers/${c.id}/`)

  // Warehouses
  const wRes = await ctx.get("/api/v1/warehouses/")
  const { results: whs } = (await wRes.json()) as { results: { id: number; name: string }[] }
  for (const w of whs.filter((w) => w.name.startsWith(PFX)))
    await ctx.delete(`/api/v1/warehouses/${w.id}/`)

  // Transport (by plate prefix)
  const tRes = await ctx.get("/api/v1/transport/")
  const { results: trans } = (await tRes.json()) as {
    results: { id: number; plate_number: string }[]
  }
  for (const t of trans.filter((t) => t.plate_number.startsWith("E2ESHIP")))
    await ctx.delete(`/api/v1/transport/${t.id}/`)

  await ctx.dispose()
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Shipments CRUD + Items", () => {
  test.beforeAll(async () => {
    const ctx = await mkCtx()

    // Purge orphaned E2E shipments first, then dependency fixtures
    const shipRes = await ctx.get(
      `/api/v1/shipments/?search=${encodeURIComponent(DEST_PFX)}`,
    )
    const { results: ships } = (await shipRes.json()) as { results: { id: number }[] }
    for (const s of ships) await ctx.delete(`/api/v1/shipments/${s.id}/`)
    await ctx.dispose()

    await purgeOrphanDeps()

    // Seed fresh dependency fixtures
    const ctx2 = await mkCtx()

    const sup = (await (
      await ctx2.post("/api/v1/suppliers/", { data: { name: `${PFX}-Proveedor` } })
    ).json()) as { id: number }
    supplierId = sup.id

    const wh = (await (
      await ctx2.post("/api/v1/warehouses/", {
        data: { name: `${PFX}-Almacén`, address: "Av. E2E", city: "Lima", country: "Peru" },
      })
    ).json()) as { id: number }
    warehouseId = wh.id

    plateNumber = `E2ESHIP${RUN}`.slice(0, 20)
    const transport = (await (
      await ctx2.post("/api/v1/transport/", {
        data: {
          plate_number: plateNumber,
          vehicle_type: "van",
          max_capacity_kg: "1000.00",
        },
      })
    ).json()) as { id: number; plate_number: string }
    transportId = transport.id
    plateNumber = transport.plate_number

    const cust = (await (
      await ctx2.post("/api/v1/customers/", {
        data: {
          name: `${PFX}-Cliente`,
          customer_type: "company",
          email: `e2eship${RUN}@test.com`,
        },
      })
    ).json()) as { id: number; name: string }
    customerId = cust.id
    customerName = cust.name

    const prod = (await (
      await ctx2.post("/api/v1/products/", {
        data: {
          name: `${PFX}-Producto`,
          sku: `E2EPRD-${RUN}`,
          unit_price: "50.00",
          weight_kg: "2.000",
          stock: 100,
          supplier: supplierId,
          warehouse: warehouseId,
        },
      })
    ).json()) as { id: number; name: string; sku: string }
    productId = prod.id
    productName = prod.name
    productSku = prod.sku

    await ctx2.dispose()
  })

  test.afterAll(cleanupAll)

  // ── Crear envío ───────────────────────────────────────────────────────────────
  // Verifies the form (customer select, warehouse select, date, addresses) and
  // that the new row appears in the list with status "Pendiente".
  test("crear envío: selects populados, aparece en lista con estado Pendiente", async ({
    page,
  }) => {
    await page.goto("/shipments")
    await expect(page.locator("h1")).toContainText("Envíos", { timeout: 10_000 })

    await page.getByRole("button", { name: "Nuevo envío" }).click()
    await expect(page.getByRole("heading", { name: "Nuevo envío" })).toBeVisible()

    // Required selects (render function → empty trigger → use form-item label)
    await selectInForm(page, "Cliente", customerName)
    await selectInForm(page, "Almacén origen", `${PFX}-Almacén`)

    // Optional transport select — verify seeded transport is selectable
    await selectInForm(page, "Transporte (opcional)", plateNumber)

    // Text inputs
    await page.getByPlaceholder("Av. Industrial 100").fill("Av. Origen Test 100")
    await page.getByPlaceholder("Jr. Comercio 456").fill(`${DEST_PFX}-Form`)

    // FormControl wraps input in a <div id=formItemId> — getByLabel finds the div, not the
    // input. Scope to the FormItem that contains this label, then target the date input.
    await page
      .locator('[data-slot="form-item"]')
      .filter({ has: page.getByText("Fecha de envío", { exact: true }) })
      .locator('input[type="date"]')
      .fill("2027-03-01")

    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/v1/shipments/") && r.request().method() === "POST",
        { timeout: 10_000 },
      ),
      page.getByRole("button", { name: "Crear envío" }).click(),
    ])

    const body = (await res.json()) as { id: number; status: string }
    expect(body.status).toBe("pending")

    // Row in list — customer name cell + "Pendiente" badge
    await expect(
      page.getByRole("cell", { name: customerName }),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText("Pendiente").first()).toBeVisible()
  })

  // ── Status transition ─────────────────────────────────────────────────────────
  // Seeds a shipment at pending, navigates to its detail page, changes status
  // to in_transit via the "Cambiar estado" select, and verifies the badge updates.
  test("status: pending → in_transit vía select en detalle; badge se actualiza", async ({
    page,
    api,
  }) => {
    const shipId = await api.seed("shipments", shipmentPayload("Status"))
    try {
      await page.goto(`/shipments/${shipId}`)
      await expect(page.locator("h1")).toContainText(`Envío #${shipId}`, { timeout: 10_000 })

      // Initial badge shows "Pendiente"
      await expect(page.getByText("Pendiente").first()).toBeVisible()

      // base-ui SelectValue without children renders the raw value string ("pending"),
      // NOT the option label ("Pendiente"). Filter by the raw value.
      const statusTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: "pending" })
      await statusTrigger.click()

      // Click the item and wait for the PATCH together — avoids the race where the
      // response arrives before waitForResponse is registered.
      await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/shipments/${shipId}/`) &&
            r.request().method() === "PATCH",
          { timeout: 10_000 },
        ),
        page
          .locator('[data-slot="select-item"]')
          .filter({ hasText: "En tránsito" })
          .click(),
      ])

      // Badge in the header changes to "En tránsito"
      await expect(page.getByText("En tránsito").first()).toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove("shipments", shipId)
    }
  })

  // ── Items: agregar, listar, eliminar ──────────────────────────────────────────
  // Verifies the full item lifecycle inside the shipment detail page.
  // Requires ShipmentSerializer.items (added above) so items appear without a
  // separate API call after creating them.
  test("items: agregar ítem, verlo en tabla, eliminarlo", async ({ page, api }) => {
    const shipId = await api.seed("shipments", shipmentPayload("Items"))
    try {
      await page.goto(`/shipments/${shipId}`)
      await expect(page.locator("h1")).toContainText(`Envío #${shipId}`, { timeout: 10_000 })

      // No items yet
      await expect(page.getByText("Sin ítems registrados.")).toBeVisible()

      // ── Agregar ítem ──────────────────────────────────────────────────────────
      await page.getByRole("button", { name: "Agregar ítem" }).click()
      await expect(page.getByRole("heading", { name: "Agregar ítem" })).toBeVisible()

      // Product select (render function → empty trigger → form-item label)
      await selectInForm(page, "Producto", productName)

      // Quantity input (default "1", change to 3)
      const qtyInput = page.getByPlaceholder("1")
      await qtyInput.clear()
      await qtyInput.fill("3")

      const [itemRes] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/shipments/${shipId}/items/`) &&
            r.request().method() === "POST",
          { timeout: 10_000 },
        ),
        page.getByRole("button", { name: "Agregar ítem" }).click(),
      ])
      expect(itemRes.status()).toBe(201)

      // Sheet closes; item appears in the table
      await expect(page.getByRole("heading", { name: "Agregar ítem" })).not.toBeVisible({
        timeout: 5_000,
      })
      await expect(
        page.getByRole("cell", { name: productName }),
      ).toBeVisible({ timeout: 8_000 })
      await expect(page.getByRole("cell", { name: productSku })).toBeVisible()
      // quantity column — exact: true avoids substring match against the SKU cell
      await expect(page.getByRole("cell", { name: "3", exact: true })).toBeVisible()

      // ── Eliminar ítem ─────────────────────────────────────────────────────────
      const itemRow = page.getByRole("row").filter({ hasText: productName })
      page.once("dialog", (d) => d.accept())
      await itemRow.getByRole("button", { name: "Eliminar" }).click()

      await page.waitForResponse(
        (r) =>
          r.url().includes(`/api/v1/shipments/${shipId}/items/`) &&
          r.request().method() === "DELETE",
        { timeout: 10_000 },
      )

      await expect(
        page.getByRole("cell", { name: productName }),
      ).not.toBeVisible({ timeout: 8_000 })
      await expect(page.getByText("Sin ítems registrados.")).toBeVisible()
    } finally {
      await api.remove("shipments", shipId)
    }
  })

  // ── Soft delete ───────────────────────────────────────────────────────────────
  test("eliminar envío con confirmación lo oculta de la lista (soft delete)", async ({
    page,
    api,
  }) => {
    const shipId = await api.seed("shipments", shipmentPayload("Delete"))
    try {
      await page.goto("/shipments")
      // Identify the exact row by the href of its "Detalle" link — avoids ambiguity
      // when multiple E2E shipments share the same customerName in the table.
      const row = page
        .getByRole("row")
        .filter({ has: page.locator(`a[href="/shipments/${shipId}"]`) })
      await expect(row).toBeVisible({ timeout: 10_000 })

      page.once("dialog", (d) => d.accept())
      const [deleteRes] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/v1/shipments/${shipId}/`) &&
            r.request().method() === "DELETE",
          { timeout: 10_000 },
        ),
        row.getByRole("button", { name: "Eliminar" }).click(),
      ])
      expect(deleteRes.status()).toBe(204)

      // After re-fetch the row disappears (soft delete → is_active=False)
      await expect(
        page.locator(`a[href="/shipments/${shipId}"]`),
      ).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove("shipments", shipId)
    }
  })
})
