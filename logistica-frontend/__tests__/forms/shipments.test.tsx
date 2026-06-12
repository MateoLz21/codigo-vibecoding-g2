import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { ShipmentForm } from "@/app/(dashboard)/shipments/shipment-form"
import type { Shipment } from "@/lib/types/shipment"

const BASE = "http://localhost:8000"

const customersPage = {
  count: 1, next: null, previous: null,
  results: [{ id: 2, name: "Cliente Test", customer_type: "company", is_active: true }],
}
const warehousesPage = {
  count: 1, next: null, previous: null,
  results: [{ id: 3, name: "Almacén Central", is_active: true }],
}
const transportPage = {
  count: 1, next: null, previous: null,
  results: [{ id: 4, plate_number: "ABC-123", vehicle_type: "truck", is_active: true }],
}
const routesPage = {
  count: 1, next: null, previous: null,
  results: [{ id: 5, name: "Ruta Lima Norte", is_active: true }],
}

const mockShipment: Shipment = {
  id: 1,
  customer: { id: 2, name: "Cliente Test" },
  transport: null,
  route: null,
  origin_warehouse: { id: 3, name: "Almacén Central" },
  status: "pending",
  origin_address: "Av. Industrial 100",
  destination_address: "Jr. Comercio 456",
  shipping_date: "2024-06-01",
  estimated_delivery_date: null,
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  shipping_cost: "2.50",
  notes: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

beforeEach(() => {
  server.use(
    http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(customersPage)),
    http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(warehousesPage)),
    http.get(`${BASE}/api/v1/transport/`, () => HttpResponse.json(transportPage)),
    http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(routesPage)),
  )
})

// ─── create mode ──────────────────────────────────────────────────────────────

describe("ShipmentForm — create mode", () => {
  it("renders 'Crear envío' button", async () => {
    renderWithQuery(<ShipmentForm onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Crear envío/i })).toBeInTheDocument()
  })

  it("shows 'Requerido' for empty text fields on submit", async () => {
    const { container } = renderWithQuery(<ShipmentForm onSuccess={vi.fn()} />)
    const form = container.querySelector("form")!

    // Ensure date field stays empty
    const dateInputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: "" } })

    fireEvent.submit(form)

    await waitFor(() => {
      const messages = screen.getAllByText("Requerido")
      expect(messages.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("shows 'Requerido' for empty shipping_date on submit", async () => {
    const { container } = renderWithQuery(<ShipmentForm onSuccess={vi.fn()} />)
    const dateInputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: "" } })
    fireEvent.submit(container.querySelector("form")!)
    await waitFor(() => {
      const messages = screen.getAllByText("Requerido")
      expect(messages.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ─── edit mode ────────────────────────────────────────────────────────────────

describe("ShipmentForm — edit mode", () => {
  it("renders 'Guardar cambios' button", async () => {
    renderWithQuery(<ShipmentForm shipment={mockShipment} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("prefills text fields from shipment prop", async () => {
    renderWithQuery(<ShipmentForm shipment={mockShipment} onSuccess={vi.fn()} />)
    expect(screen.getByDisplayValue("Av. Industrial 100")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Jr. Comercio 456")).toBeInTheDocument()
  })

  it("calls PATCH with correct payload including null conversions", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/shipments/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockShipment)
      })
    )
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const { container } = renderWithQuery(
      <ShipmentForm shipment={mockShipment} onSuccess={onSuccess} />
    )

    const originInput = screen.getByDisplayValue("Av. Industrial 100")
    await user.clear(originInput)
    await user.type(originInput, "Nueva Dirección 500")

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    const b = body as Record<string, unknown>
    expect(b.customer).toBe(2)
    expect(b.origin_warehouse).toBe(3)
    expect(b.transport).toBeNull()
    expect(b.route).toBeNull()
    expect(b.origin_address).toBe("Nueva Dirección 500")
    expect(b.destination_address).toBe("Jr. Comercio 456")
    expect(b.shipping_date).toBe("2024-06-01")
    expect(b.estimated_delivery_date).toBeNull()
    expect(b.notes).toBeNull()
  })
})
