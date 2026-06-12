import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { WarehouseForm } from "@/app/(dashboard)/warehouses/warehouse-form"
import type { Warehouse } from "@/lib/types/warehouse"

const BASE = "http://localhost:8000"

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Almacén Central",
  address: "Av. Principal 123",
  city: "Lima",
  country: "Peru",
  latitude: null,
  longitude: null,
  capacity_m3: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("WarehouseForm — create mode", () => {
  it("shows 'Requerido' for each empty required field on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />)

    // Click submit without filling any required field
    await user.click(screen.getByRole("button", { name: /Crear almacén/i }))

    // name, address, city are empty → 3 "Requerido" messages
    // country defaults to "Peru" so it passes
    const errors = await screen.findAllByText("Requerido")
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })

  it("calls POST /warehouses/ with correct payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/warehouses/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockWarehouse, { status: 201 })
      })
    )
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Almacén Central"), "Mi Almacén")
    await user.type(screen.getByPlaceholderText("Av. Principal 123"), "Calle 1")
    await user.type(screen.getByPlaceholderText("Lima"), "Arequipa")
    // country already defaults to "Peru"

    await user.click(screen.getByRole("button", { name: /Crear almacén/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      name: "Mi Almacén",
      address: "Calle 1",
      city: "Arequipa",
      country: "Peru",
    })
  })

  it("converts empty optional fields to null before sending", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${BASE}/api/v1/warehouses/`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockWarehouse, { status: 201 })
      })
    )
    renderWithQuery(<WarehouseForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Almacén Central"), "Test")
    await user.type(screen.getByPlaceholderText("Av. Principal 123"), "Av. 1")
    await user.type(screen.getByPlaceholderText("Lima"), "Lima")
    // leave latitude, longitude, capacity_m3 empty (they default to "")

    await user.click(screen.getByRole("button", { name: /Crear almacén/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.latitude).toBeNull()
    expect(capturedBody!.longitude).toBeNull()
    expect(capturedBody!.capacity_m3).toBeNull()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("WarehouseForm — edit mode", () => {
  it("prefills all fields from the warehouse prop", () => {
    renderWithQuery(<WarehouseForm warehouse={mockWarehouse} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("Almacén Central")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Av. Principal 123")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Lima")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Peru")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button (not 'Crear almacén')", () => {
    renderWithQuery(<WarehouseForm warehouse={mockWarehouse} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH /warehouses/:id/ with updated payload", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/warehouses/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockWarehouse, name: "Nuevo Nombre" })
      })
    )
    renderWithQuery(<WarehouseForm warehouse={mockWarehouse} onSuccess={vi.fn()} />)

    const nameInput = screen.getByDisplayValue("Almacén Central")
    await user.clear(nameInput)
    await user.type(nameInput, "Nuevo Nombre")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({ name: "Nuevo Nombre" })
  })
})
