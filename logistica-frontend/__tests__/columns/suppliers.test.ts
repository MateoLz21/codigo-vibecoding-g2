import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/suppliers/columns"
import type { Supplier } from "@/lib/types/supplier"

const base: Supplier = {
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

function cellOutput(accessorOrId: string, data: Partial<Supplier>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── nullable text cells ──────────────────────────────────────────────────────

describe("contact_name cell", () => {
  it("renders value when set", () =>
    expect(cellOutput("contact_name", { contact_name: "Ana" })).toBe("Ana"))
  it("renders '—' when null", () =>
    expect(cellOutput("contact_name", { contact_name: null })).toBe("—"))
})

describe("email cell", () => {
  it("renders value when set", () =>
    expect(cellOutput("email", { email: "a@b.com" })).toBe("a@b.com"))
  it("renders '—' when null", () =>
    expect(cellOutput("email", { email: null })).toBe("—"))
})

describe("phone cell", () => {
  it("renders value when set", () =>
    expect(cellOutput("phone", { phone: "+51 111" })).toBe("+51 111"))
  it("renders '—' when null", () =>
    expect(cellOutput("phone", { phone: null })).toBe("—"))
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
