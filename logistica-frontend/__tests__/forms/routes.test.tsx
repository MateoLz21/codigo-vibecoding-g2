import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { RouteForm } from "@/app/(dashboard)/routes/route-form"
import type { Route } from "@/lib/types/route"

const BASE = "http://localhost:8000"

const warehousesPage = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 3,
      name: "Almacén Central",
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
    http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(warehousesPage))
  )
})

// mockRoute with null estimated_duration_hours so we can verify null conversion
const mockRoute: Route = {
  id: 1,
  name: "Ruta Lima Norte",
  origin_warehouse: { id: 3, name: "Almacén Central" },
  estimated_duration_hours: null,
  is_active: true,
  stops: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("RouteForm — create mode", () => {
  it("shows 'Requerido' when name is empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<RouteForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear ruta/i }))

    const errors = await screen.findAllByText("Requerido")
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it("shows 'Crear ruta' button in create mode", () => {
    renderWithQuery(<RouteForm onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Crear ruta/i })).toBeInTheDocument()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("RouteForm — edit mode", () => {
  it("prefills name from the route prop", () => {
    renderWithQuery(<RouteForm route={mockRoute} onSuccess={vi.fn()} />)
    expect(screen.getByDisplayValue("Ruta Lima Norte")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<RouteForm route={mockRoute} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH with correct payload, converting string ID to number and empty duration to null", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/routes/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockRoute)
      })
    )
    renderWithQuery(<RouteForm route={mockRoute} onSuccess={vi.fn()} />)

    const nameInput = screen.getByDisplayValue("Ruta Lima Norte")
    await user.clear(nameInput)
    await user.type(nameInput, "Ruta Actualizada")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      name: "Ruta Actualizada",
      origin_warehouse: 3,
      estimated_duration_hours: null,
    })
  })
})
