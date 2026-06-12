import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { ProductForm } from "@/app/(dashboard)/products/product-form"
import type { Product } from "@/lib/types/product"

const BASE = "http://localhost:8000"

// ProductForm calls useSuppliers + useWarehouses — register handlers so queries
// resolve without warnings. Edit-mode tests use defaultValues (string IDs from
// the product prop) so Select interaction is never needed.
const suppliersPage = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 5,
      name: "Proveedor Test",
      tax_id: null,
      email: null,
      phone: null,
      address: null,
      contact_name: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
}

const warehousesPage = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 3,
      name: "Almacén Test",
      address: "Dir",
      city: "Lima",
      country: "PE",
      capacity_m3: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
}

beforeEach(() => {
  server.use(
    http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(suppliersPage)),
    http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(warehousesPage))
  )
})

const mockProduct: Product = {
  id: 1,
  supplier: { id: 5, name: "Proveedor Test" },
  warehouse: { id: 3, name: "Almacén Test" },
  name: "Laptop HP 15",
  sku: "LAP-HP-001",
  description: null,
  weight_kg: "2.50",
  unit_price: "2500.00",
  stock: 10,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode — validation ─────────────────────────────────────────────────

describe("ProductForm — create mode", () => {
  it("shows 'Requerido' when required text fields empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear producto/i }))

    const errors = await screen.findAllByText("Requerido")
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it("shows 'Debe ser mayor a 0' for zero unit_price", async () => {
    const user = userEvent.setup()
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Laptop HP 15"), "Mi Producto")
    await user.type(screen.getByPlaceholderText("LAP-HP-001"), "SKU-001")
    await user.type(screen.getByPlaceholderText("99.90"), "0")

    await user.click(screen.getByRole("button", { name: /Crear producto/i }))

    expect(await screen.findByText("Debe ser mayor a 0")).toBeInTheDocument()
  })

  it("shows 'Debe ser un número >= 0' for non-numeric weight_kg", async () => {
    const user = userEvent.setup()
    renderWithQuery(<ProductForm onSuccess={vi.fn()} />)

    // weight_kg defaults to "0"; clear it and type invalid value
    const weightInput = screen.getByPlaceholderText("1.50")
    await user.clear(weightInput)
    await user.type(weightInput, "abc")

    await user.click(screen.getByRole("button", { name: /Crear producto/i }))

    expect(await screen.findByText("Debe ser un número >= 0")).toBeInTheDocument()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("ProductForm — edit mode", () => {
  it("prefills fields from the product prop", () => {
    renderWithQuery(<ProductForm product={mockProduct} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("Laptop HP 15")).toBeInTheDocument()
    expect(screen.getByDisplayValue("LAP-HP-001")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2500.00")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2.50")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<ProductForm product={mockProduct} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH with correct payload, converting string IDs to numbers", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/products/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockProduct)
      })
    )
    renderWithQuery(<ProductForm product={mockProduct} onSuccess={vi.fn()} />)

    const nameInput = screen.getByDisplayValue("Laptop HP 15")
    await user.clear(nameInput)
    await user.type(nameInput, "Laptop Updated")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      name: "Laptop Updated",
      supplier: 5,
      warehouse: 3,
      unit_price: "2500.00",
      stock: 10,
      description: null,
      weight_kg: "2.50",
    })
  })
})
