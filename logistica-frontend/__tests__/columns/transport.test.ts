import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/transport/columns"
import type { Transport, VehicleType } from "@/lib/types/transport"

const base: Transport = {
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

function cellOutput(accessorOrId: string, data: Partial<Transport>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── vehicle_type badge ───────────────────────────────────────────────────────

describe("vehicle_type cell", () => {
  it.each<[VehicleType, string]>([
    ["truck", "Camión"],
    ["van", "Furgoneta"],
    ["motorcycle", "Moto"],
  ])("renders '%s' as '%s'", (type, label) => {
    const { getByText } = render(cellOutput("vehicle_type", { vehicle_type: type }))
    expect(getByText(label)).toBeInTheDocument()
  })
})

// ─── nullable max_capacity_kg cell ───────────────────────────────────────────

describe("max_capacity_kg cell", () => {
  it("renders value when set", () =>
    expect(cellOutput("max_capacity_kg", { max_capacity_kg: "1200.00" })).toBe("1200.00"))
  it("renders '—' when null", () =>
    expect(cellOutput("max_capacity_kg", { max_capacity_kg: null })).toBe("—"))
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
