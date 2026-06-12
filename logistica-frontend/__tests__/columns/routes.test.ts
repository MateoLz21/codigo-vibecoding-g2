import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/routes/columns"
import type { Route } from "@/lib/types/route"

// Next.js Link — mock to a plain <a> to avoid router-context errors in jsdom
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) =>
    createElement("a", { href }, children as Parameters<typeof createElement>[2]),
}))

const base: Route = {
  id: 1,
  name: "Ruta Lima Norte",
  origin_warehouse: { id: 3, name: "Almacén Central" },
  estimated_duration_hours: "2.50",
  is_active: true,
  stops: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

function cellOutput(accessorOrId: string, data: Partial<Route>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── origin_warehouse FK cell ─────────────────────────────────────────────────

describe("origin_warehouse cell", () => {
  it("renders warehouse name", () =>
    expect(
      cellOutput("origin_warehouse", { origin_warehouse: { id: 3, name: "Almacén Sur" } })
    ).toBe("Almacén Sur"))
})

// ─── nullable estimated_duration_hours cell ───────────────────────────────────

describe("estimated_duration_hours cell", () => {
  it("renders value when set", () =>
    expect(
      cellOutput("estimated_duration_hours", { estimated_duration_hours: "3.0" })
    ).toBe("3.0"))

  it("renders '—' when null", () =>
    expect(
      cellOutput("estimated_duration_hours", { estimated_duration_hours: null })
    ).toBe("—"))
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
