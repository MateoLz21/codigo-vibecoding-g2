import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/customers/columns"
import type { Customer } from "@/lib/types/customer"

const base: Customer = {
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

function cellOutput(accessorOrId: string, data: Partial<Customer>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── customer_type badge ──────────────────────────────────────────────────────

describe("customer_type cell", () => {
  it("renders 'Empresa' badge when customer_type=company", () => {
    const { getByText } = render(cellOutput("customer_type", { customer_type: "company" }))
    expect(getByText("Empresa")).toBeInTheDocument()
  })

  it("renders 'Individual' badge when customer_type=individual", () => {
    const { getByText } = render(cellOutput("customer_type", { customer_type: "individual" }))
    expect(getByText("Individual")).toBeInTheDocument()
  })
})

// ─── nullable email cell ──────────────────────────────────────────────────────

describe("email cell", () => {
  it("renders value when set", () =>
    expect(cellOutput("email", { email: "a@b.com" })).toBe("a@b.com"))
  it("renders '—' when null", () =>
    expect(cellOutput("email", { email: null })).toBe("—"))
})

// ─── is_active badge ──────────────────────────────────────────────────────────

describe("is_active cell", () => {
  it("renders 'Activo' badge when is_active=true", () => {
    const { getByText } = render(cellOutput("is_active", { is_active: true }))
    expect(getByText("Activo")).toBeInTheDocument()
  })

  it("renders 'Inactivo' badge when is_active=false", () => {
    const { getByText } = render(cellOutput("is_active", { is_active: false }))
    expect(getByText("Inactivo")).toBeInTheDocument()
  })
})

// ─── actions ──────────────────────────────────────────────────────────────────

describe("actions cell", () => {
  it("calls onEdit with row when Editar clicked", () => {
    const onEdit = vi.fn()
    const row = { original: base }
    const cols = getColumns({ onEdit, onDelete: vi.fn() })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (cols.find((c) => c.id === "actions")!.cell as any)({ row })
    render(cell).getByText("Editar").click()
    expect(onEdit).toHaveBeenCalledWith(base)
  })

  it("calls onDelete with id when Eliminar clicked", () => {
    const onDelete = vi.fn()
    const row = { original: base }
    const cols = getColumns({ onEdit: vi.fn(), onDelete })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (cols.find((c) => c.id === "actions")!.cell as any)({ row })
    render(cell).getByText("Eliminar").click()
    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
