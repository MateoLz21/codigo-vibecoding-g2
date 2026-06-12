import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { render } from "@testing-library/react"
import { getColumns } from "@/app/(dashboard)/shipments/columns"
import type { Shipment, ShipmentStatus } from "@/lib/types/shipment"

// Next.js Link — mock to a plain <a> to avoid router-context errors in jsdom
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) =>
    createElement("a", { href }, children as Parameters<typeof createElement>[2]),
}))

const base: Shipment = {
  id: 1,
  customer: { id: 2, name: "Cliente Test" },
  transport: null,
  route: null,
  origin_warehouse: { id: 3, name: "Almacén Central" },
  status: "pending",
  origin_address: "Av. Industrial 100",
  destination_address: "Jr. Comercio 456",
  shipping_date: "2024-06-01",
  estimated_delivery_date: null,
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  shipping_cost: "2.50",
  notes: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

function cellOutput(accessorOrId: string, data: Partial<Shipment>) {
  const row = { original: { ...base, ...data } }
  const cols = getColumns({ onDelete: vi.fn() })
  const col = cols.find((c) => ("accessorKey" in c ? c.accessorKey : c.id) === accessorOrId)
  if (!col?.cell) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (col.cell as any)({ row })
}

// ─── customer FK cell ─────────────────────────────────────────────────────────

describe("customer cell", () => {
  it("renders customer.name", () =>
    expect(cellOutput("customer", { customer: { id: 2, name: "Empresa SA" } })).toBe(
      "Empresa SA"
    ))
})

// ─── status badge ─────────────────────────────────────────────────────────────

describe("status cell", () => {
  it.each<[ShipmentStatus, string]>([
    ["pending",    "Pendiente"],
    ["in_transit", "En tránsito"],
    ["delivered",  "Entregado"],
    ["cancelled",  "Cancelado"],
  ])("status='%s' renders '%s'", (status, label) => {
    const { getByText } = render(cellOutput("status", { status }))
    expect(getByText(label)).toBeInTheDocument()
  })
})

// ─── formatted number cells ───────────────────────────────────────────────────

describe("total_weight_kg cell", () => {
  it("renders '<value> kg'", () =>
    expect(cellOutput("total_weight_kg", { total_weight_kg: "10.50" })).toBe("10.50 kg"))
})

describe("shipping_cost cell", () => {
  it("renders 'S/ <value>'", () =>
    expect(cellOutput("shipping_cost", { shipping_cost: "5.25" })).toBe("S/ 5.25"))
})

// ─── actions (no onEdit — only Eliminar + Detalle link) ───────────────────────

describe("actions cell", () => {
  it("calls onDelete with id when Eliminar clicked", () => {
    const onDelete = vi.fn()
    const row = { original: base }
    const cols = getColumns({ onDelete })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (cols.find((c) => c.id === "actions")!.cell as any)({ row })
    render(cell).getByText("Eliminar").click()
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it("renders 'Detalle' link with correct href", () => {
    const row = { original: base }
    const cols = getColumns({ onDelete: vi.fn() })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cell = (cols.find((c) => c.id === "actions")!.cell as any)({ row })
    const { getByText } = render(cell)
    const link = getByText("Detalle").closest("a")
    expect(link).toHaveAttribute("href", "/shipments/1")
  })
})
