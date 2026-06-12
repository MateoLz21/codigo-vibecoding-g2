import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { CustomerForm } from "@/app/(dashboard)/customers/customer-form"
import type { Customer } from "@/lib/types/customer"

const BASE = "http://localhost:8000"

const mockCustomer: Customer = {
  id: 1,
  name: "Cliente SA",
  customer_type: "company",
  tax_id: "20123456789",
  email: "cliente@empresa.com",
  phone: "+51 999 999 999",
  address: "Av. Principal 123",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("CustomerForm — create mode", () => {
  it("shows 'Requerido' when name is empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear cliente/i }))

    expect(await screen.findByText("Requerido")).toBeInTheDocument()
  })

  it("shows 'Email inválido' when email format is wrong", async () => {
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Empresa S.A."), "Test")
    await user.type(screen.getByPlaceholderText("contacto@empresa.com"), "notanemail")
    // fireEvent.submit bypasses jsdom HTML5 constraint validation on type="email"
    fireEvent.submit(screen.getByRole("button", { name: /Crear cliente/i }).closest("form")!)

    expect(await screen.findByText("Email inválido")).toBeInTheDocument()
  })

  it("calls POST /customers/ with correct payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/customers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockCustomer, { status: 201 })
      })
    )
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Empresa S.A."), "Mi Cliente")
    await user.click(screen.getByRole("button", { name: /Crear cliente/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({
      name: "Mi Cliente",
      customer_type: "company",
    })
  })

  it("converts empty optional fields to null before sending", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${BASE}/api/v1/customers/`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockCustomer, { status: 201 })
      })
    )
    renderWithQuery(<CustomerForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Empresa S.A."), "Solo Nombre")
    await user.click(screen.getByRole("button", { name: /Crear cliente/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.tax_id).toBeNull()
    expect(capturedBody!.email).toBeNull()
    expect(capturedBody!.phone).toBeNull()
    expect(capturedBody!.address).toBeNull()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("CustomerForm — edit mode", () => {
  it("prefills text fields from the customer prop", () => {
    renderWithQuery(<CustomerForm customer={mockCustomer} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("Cliente SA")).toBeInTheDocument()
    expect(screen.getByDisplayValue("cliente@empresa.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("+51 999 999 999")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<CustomerForm customer={mockCustomer} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH /customers/:id/ on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/customers/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockCustomer, name: "Nuevo Nombre" })
      })
    )
    renderWithQuery(<CustomerForm customer={mockCustomer} onSuccess={vi.fn()} />)

    const nameInput = screen.getByDisplayValue("Cliente SA")
    await user.clear(nameInput)
    await user.type(nameInput, "Nuevo Nombre")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({ name: "Nuevo Nombre" })
  })
})
