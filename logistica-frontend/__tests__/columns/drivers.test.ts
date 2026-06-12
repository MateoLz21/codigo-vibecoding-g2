import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/drivers/columns"
import type { Driver } from "@/lib/types/driver"

const base: Driver = {
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

function cellOutput(accessorOrId: string, data: Partial<Driver>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onEdit: vi.fn(), onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── full_name computed cell ──────────────────────────────────────────────────

describe("full_name cell", () => {
  it("renders first_name + last_name", () =>
    expect(
      cellOutput("full_name", { user: { ...base.user, first_name: "Ana", last_name: "Torres" } })
    ).toBe("Ana Torres"))

  it("trims when a name part is empty", () =>
    expect(
      cellOutput("full_name", { user: { ...base.user, first_name: "Ana", last_name: "" } })
    ).toBe("Ana"))

  it("renders '—' when both parts are empty", () =>
    expect(
      cellOutput("full_name", { user: { ...base.user, first_name: "", last_name: "" } })
    ).toBe("—"))
})

// ─── is_available badge ───────────────────────────────────────────────────────

describe("is_available cell", () => {
  it("renders 'Disponible' badge when is_available=true", () => {
    const { getByText } = render(cellOutput("is_available", { is_available: true }))
    expect(getByText("Disponible")).toBeInTheDocument()
  })

  it("renders 'No disponible' badge when is_available=false", () => {
    const { getByText } = render(cellOutput("is_available", { is_available: false }))
    expect(getByText("No disponible")).toBeInTheDocument()
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
