import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderWithQuery } from "@/test/utils/renderWithQuery"
import { SupplierForm } from "@/app/(dashboard)/suppliers/supplier-form"
import type { Supplier } from "@/lib/types/supplier"

const BASE = "http://localhost:8000"

const mockSupplier: Supplier = {
  id: 1,
  name: "Proveedor SA",
  tax_id: "20123456789",
  email: "contact@proveedor.com",
  phone: "+51 999 999 999",
  address: "Av. Industrial 456",
  contact_name: "Juan Pérez",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

// ─── Create mode ──────────────────────────────────────────────────────────────

describe("SupplierForm — create mode", () => {
  it("shows 'Requerido' when name is empty on submit", async () => {
    const user = userEvent.setup()
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /Crear proveedor/i }))

    expect(await screen.findByText("Requerido")).toBeInTheDocument()
  })

  it("shows 'Email inválido' when email format is wrong", async () => {
    const user = userEvent.setup()
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Proveedor S.A."), "Test")
    await user.type(screen.getByPlaceholderText("contacto@empresa.com"), "notanemail")
    // fireEvent.submit bypasses jsdom HTML5 constraint validation on type="email"
    fireEvent.submit(screen.getByRole("button", { name: /Crear proveedor/i }).closest("form")!)

    expect(await screen.findByText("Email inválido")).toBeInTheDocument()
  })

  it("calls POST /suppliers/ with correct payload on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/suppliers/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockSupplier, { status: 201 })
      })
    )
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Proveedor S.A."), "Mi Proveedor")
    await user.type(screen.getByPlaceholderText("contacto@empresa.com"), "info@miprov.com")

    await user.click(screen.getByRole("button", { name: /Crear proveedor/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({ name: "Mi Proveedor", email: "info@miprov.com" })
  })

  it("converts empty optional fields to null before sending", async () => {
    const user = userEvent.setup()
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${BASE}/api/v1/suppliers/`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockSupplier, { status: 201 })
      })
    )
    renderWithQuery(<SupplierForm onSuccess={vi.fn()} />)

    // Fill only required name, leave all optionals empty
    await user.type(screen.getByPlaceholderText("Proveedor S.A."), "Solo Nombre")
    await user.click(screen.getByRole("button", { name: /Crear proveedor/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.tax_id).toBeNull()
    expect(capturedBody!.email).toBeNull()
    expect(capturedBody!.phone).toBeNull()
    expect(capturedBody!.address).toBeNull()
    expect(capturedBody!.contact_name).toBeNull()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe("SupplierForm — edit mode", () => {
  it("prefills all fields from the supplier prop", () => {
    renderWithQuery(<SupplierForm supplier={mockSupplier} onSuccess={vi.fn()} />)

    expect(screen.getByDisplayValue("Proveedor SA")).toBeInTheDocument()
    expect(screen.getByDisplayValue("contact@proveedor.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Juan Pérez")).toBeInTheDocument()
  })

  it("shows 'Guardar cambios' button in edit mode", () => {
    renderWithQuery(<SupplierForm supplier={mockSupplier} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  it("calls PATCH /suppliers/:id/ on valid submit", async () => {
    const user = userEvent.setup()
    let capturedBody: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/suppliers/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSupplier, name: "Nuevo Nombre" })
      })
    )
    renderWithQuery(<SupplierForm supplier={mockSupplier} onSuccess={vi.fn()} />)

    const nameInput = screen.getByDisplayValue("Proveedor SA")
    await user.clear(nameInput)
    await user.type(nameInput, "Nuevo Nombre")

    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody).toMatchObject({ name: "Nuevo Nombre" })
  })
})
