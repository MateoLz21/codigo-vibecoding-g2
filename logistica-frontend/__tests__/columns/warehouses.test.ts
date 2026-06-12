import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/warehouses/columns"
import type { Warehouse } from "@/lib/types/warehouse"

const base: Warehouse = {
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

function cellOutput(accessorOrId: string, data: Partial<Warehouse>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── capacity_m3 ──────────────────────────────────────────────────────────────

describe("capacity_m3 cell", () => {
  it("renders value when capacity_m3 is set", () => {
    expect(cellOutput("capacity_m3", { capacity_m3: "500.00" })).toBe("500.00")
  })

  it("renders '—' when capacity_m3 is null", () => {
    expect(cellOutput("capacity_m3", { capacity_m3: null })).toBe("—")
  })
})

// ─── is_active (Estado badge) ─────────────────────────────────────────────────

describe("is_active cell", () => {
  it("renders 'Activo' badge when is_active=true", () => {
    const cell = cellOutput("is_active", { is_active: true })
    const { getByText } = render(cell)
    expect(getByText("Activo")).toBeInTheDocument()
  })

  it("renders 'Inactivo' badge when is_active=false", () => {
    const cell = cellOutput("is_active", { is_active: false })
    const { getByText } = render(cell)
    expect(getByText("Inactivo")).toBeInTheDocument()
  })
})

// ─── actions ──────────────────────────────────────────────────────────────────

describe("actions cell", () => {
  it("calls onEdit with the row when Editar is clicked", () => {
    const onEdit = vi.fn()
    const row = { original: base }
    const cols = getColumns({ onEdit, onDelete: vi.fn() })
    const actionsCol = cols.find((c) => c.id === "actions")!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (actionsCol.cell as any)({ row })
    const { getByText } = render(cell)
    getByText("Editar").click()
    expect(onEdit).toHaveBeenCalledWith(base)
  })

  it("calls onDelete with the row id when Eliminar is clicked", () => {
    const onDelete = vi.fn()
    const row = { original: base }
    const cols = getColumns({ onEdit: vi.fn(), onDelete })
    const actionsCol = cols.find((c) => c.id === "actions")!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (actionsCol.cell as any)({ row })
    const { getByText } = render(cell)
    getByText("Eliminar").click()
    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
