import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { TransportForm } from "@/app/(dashboard)/transport/transport-form"
import type { Transport } from "@/lib/types/transport"

const BASE = "http://localhost:8000"

const mockTransport: Transport = {
  id: 1,
  plate_number: "XYZ-789",
  vehicle_type: "van",
  brand: "Mercedes",
  model: "Sprinter",
  year: 2022,
  max_capacity_kg: "800.00",
  driver: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("TransportForm — create mode", () => {
  it("shows 'Requerido' when required fields are empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<TransportForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear vehículo/i }))

    const errors = await screen.findAllByText("Requerido")
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it("shows 'Año inválido' for non-numeric year", async () => {
    const user = userEvent.setup()
    renderWithQuery(<TransportForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("ABC-123"), "TEST-001")
    await user.type(screen.getByPlaceholderText("Toyota"), "Ford")
    await user.type(screen.getByPlaceholderText("Hilux"), "Ranger")
    await user.type(screen.getByPlaceholderText("2020"), "abc")

    await user.click(screen.getByRole("button", { name: /Crear vehículo/i }))

    expect(await screen.findByText("Año inválido")).toBeInTheDocument()
  })

  it("shows 'Año inválido' for year below 1900", async () => {
    const user = userEvent.setup()
    renderWithQuery(<TransportForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("ABC-123"), "TEST-001")
    await user.type(screen.getByPlaceholderText("Toyota"), "Ford")
    await user.type(screen.getByPlaceholderText("Hilux"), "Ranger")
    await user.type(screen.getByPlaceholderText("2020"), "1800")

    await user.click(screen.getByRole("button", { name: /Crear vehículo/i }))

    expect(await screen.findByText("Año inválido")).toBeInTheDocument()
  })

  it("calls POST /transport/ with correct payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/transport/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockTransport, { status: 201 })
      })
    )
    renderWithQuery(<TransportForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("ABC-123"), "TEST-001")
    await user.type(screen.getByPlaceholderText("Toyota"), "Ford")
    await user.type(screen.getByPlaceholderText("Hilux"), "Ranger")
    await user.type(screen.getByPlaceholderText("2020"), "2021")

    await user.click(screen.getByRole("button", { name: /Crear vehículo/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      plate_number: "TEST-001",
      brand: "Ford",
      model: "Ranger",
      year: 2021,
      vehicle_type: "truck",
    })
  })

  it("converts empty max_capacity_kg to null before sending", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${BASE}/api/v1/transport/`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockTransport, { status: 201 })
      })
    )
    renderWithQuery(<TransportForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("ABC-123"), "TEST-001")
    await user.type(screen.getByPlaceholderText("Toyota"), "Ford")
    await user.type(screen.getByPlaceholderText("Hilux"), "Ranger")
    await user.type(screen.getByPlaceholderText("2020"), "2021")

    await user.click(screen.getByRole("button", { name: /Crear vehículo/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.max_capacity_kg).toBeNull()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("TransportForm — edit mode", () => {
  it("prefills fields from the transport prop", () => {
    renderWithQuery(<TransportForm transport={mockTransport} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("XYZ-789")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Mercedes")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Sprinter")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2022")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<TransportForm transport={mockTransport} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH /transport/:id/ on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/transport/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockTransport, brand: "Ford" })
      })
    )
    renderWithQuery(<TransportForm transport={mockTransport} onSuccess={vi.fn()} />)

    const brandInput = screen.getByDisplayValue("Mercedes")
    await user.clear(brandInput)
    await user.type(brandInput, "Ford")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({ brand: "Ford" })
  })
})
