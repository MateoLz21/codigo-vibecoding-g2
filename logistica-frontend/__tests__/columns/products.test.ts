import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/products/columns"
import type { Product } from "@/lib/types/product"

const base: Product = {
  id: 1,
  supplier: { id: 5, name: "Proveedor Test" },
  warehouse: { id: 3, name: "Almacén Test" },
  name: "Laptop HP 15",
  sku: "LAP-HP-001",
  description: "Laptop de uso general",
  weight_kg: "2.50",
  unit_price: "2500.00",
  stock: 10,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

function cellOutput(accessorOrId: string, data: Partial<Product>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── FK name cells ────────────────────────────────────────────────────────────

describe("supplier cell", () => {
  it("renders supplier.name", () =>
    expect(cellOutput("supplier", { supplier: { id: 5, name: "Proveedor SA" } })).toBe(
      "Proveedor SA"
    ))
})

describe("warehouse cell", () => {
  it("renders warehouse.name", () =>
    expect(cellOutput("warehouse", { warehouse: { id: 3, name: "Almacén Central" } })).toBe(
      "Almacén Central"
    ))
})

// ─── unit_price formatting ────────────────────────────────────────────────────

describe("unit_price cell", () => {
  it("renders 'S/ <price>'", () =>
    expect(cellOutput("unit_price", { unit_price: "99.90" })).toBe("S/ 99.90"))
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
