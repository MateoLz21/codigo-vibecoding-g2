import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { DriverForm } from "@/app/(dashboard)/drivers/driver-form"
import type { Driver } from "@/lib/types/driver"

const BASE = "http://localhost:8000"

const mockDriver: Driver = {
  id: 1,
  user: {
    id: 10,
    username: "carlos.gomez",
    first_name: "Carlos",
    last_name: "Gómez",
    email: "carlos@logistica.com",
  },
  license_number: "Q12345678",
  license_expiry: "2025-12-31",
  phone: "+51 999 000 111",
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("DriverForm — create mode", () => {
  it("shows 'Requerido' when required fields empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<DriverForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear conductor/i }))

    const errors = await screen.findAllByText("Requerido")
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it("shows 'Mínimo 6 caracteres' when password too short", async () => {
    const user = userEvent.setup()
    renderWithQuery(<DriverForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("juan.perez"), "driver1")
    await user.type(screen.getByPlaceholderText("••••••"), "abc")

    await user.click(screen.getByRole("button", { name: /Crear conductor/i }))

    expect(await screen.findByText("Mínimo 6 caracteres")).toBeInTheDocument()
  })

  it("shows 'Email inválido' for invalid email format", async () => {
    const user = userEvent.setup()
    const { container } = renderWithQuery(<DriverForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("juan.perez"), "driver1")
    await user.type(screen.getByPlaceholderText("••••••"), "secret123")
    await user.type(screen.getByPlaceholderText("Juan"), "Pedro")
    await user.type(screen.getByPlaceholderText("Pérez"), "López")
    await user.type(screen.getByPlaceholderText("juan@ejemplo.com"), "notanemail")
    await user.type(screen.getByPlaceholderText("Q12345678"), "Q99999999")
    fireEvent.change(container.querySelector('input[type="date"]')!, {
      target: { value: "2026-06-30" },
    })

    // fireEvent.submit bypasses jsdom HTML5 constraint validation on type="email"
    fireEvent.submit(screen.getByRole("button", { name: /Crear conductor/i }).closest("form")!)

    expect(await screen.findByText("Email inválido")).toBeInTheDocument()
  })

  it("calls POST /drivers/ with nested user payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/drivers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockDriver, { status: 201 })
      })
    )
    const { container } = renderWithQuery(<DriverForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("juan.perez"), "driver1")
    await user.type(screen.getByPlaceholderText("••••••"), "secret123")
    await user.type(screen.getByPlaceholderText("Juan"), "Pedro")
    await user.type(screen.getByPlaceholderText("Pérez"), "López")
    await user.type(screen.getByPlaceholderText("juan@ejemplo.com"), "pedro@test.com")
    await user.type(screen.getByPlaceholderText("Q12345678"), "Q99999999")
    fireEvent.change(container.querySelector('input[type="date"]')!, {
      target: { value: "2026-06-30" },
    })

    await user.click(screen.getByRole("button", { name: /Crear conductor/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      user: {
        username: "driver1",
        first_name: "Pedro",
        last_name: "López",
        email: "pedro@test.com",
      },
      license_number: "Q99999999",
      is_available: true,
    })
  })

  it("converts empty phone to null before sending", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${BASE}/api/v1/drivers/`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockDriver, { status: 201 })
      })
    )
    const { container } = renderWithQuery(<DriverForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("juan.perez"), "driver1")
    await user.type(screen.getByPlaceholderText("••••••"), "secret123")
    await user.type(screen.getByPlaceholderText("Juan"), "Pedro")
    await user.type(screen.getByPlaceholderText("Pérez"), "López")
    await user.type(screen.getByPlaceholderText("juan@ejemplo.com"), "pedro@test.com")
    await user.type(screen.getByPlaceholderText("Q12345678"), "Q99999999")
    fireEvent.change(container.querySelector('input[type="date"]')!, {
      target: { value: "2026-06-30" },
    })

    await user.click(screen.getByRole("button", { name: /Crear conductor/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.phone).toBeNull()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("DriverForm — edit mode", () => {
  it("prefills fields from the driver prop", () => {
    renderWithQuery(<DriverForm driver={mockDriver} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("Carlos")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Gómez")).toBeInTheDocument()
    expect(screen.getByDisplayValue("carlos@logistica.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Q12345678")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2025-12-31")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<DriverForm driver={mockDriver} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH /drivers/:id/ with nested user payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/drivers/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockDriver)
      })
    )
    renderWithQuery(<DriverForm driver={mockDriver} onSuccess={vi.fn()} />)

    const firstNameInput = screen.getByDisplayValue("Carlos")
    await user.clear(firstNameInput)
    await user.type(firstNameInput, "Carlos Updated")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      user: { first_name: "Carlos Updated" },
    })
  })
})
