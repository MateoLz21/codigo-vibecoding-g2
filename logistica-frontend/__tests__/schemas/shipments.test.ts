import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/shipments/shipment-form.tsx
const schema = z.object({
  customer: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  transport: z.string().optional(),
  route: z.string().optional(),
  origin_address: z.string().min(1, "Requerido"),
  destination_address: z.string().min(1, "Requerido"),
  shipping_date: z.string().min(1, "Requerido"),
  estimated_delivery_date: z.string().optional(),
  notes: z.string().optional(),
})

const VALID = {
  customer: "2",
  origin_warehouse: "3",
  origin_address: "Av. Industrial 100",
  destination_address: "Jr. Comercio 456",
  shipping_date: "2024-06-01",
}

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("shipmentSchema — valid cases", () => {
  it("passes with only required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with optional fields included", () => {
    expect(
      schema.safeParse({
        ...VALID,
        transport: "5",
        route: "1",
        estimated_delivery_date: "2024-06-10",
        notes: "Fragile",
      }).success
    ).toBe(true)
  })

  it("passes when optional fields are omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes when optional string fields are empty (UI default)", () => {
    expect(
      schema.safeParse({
        ...VALID,
        transport: "",
        route: "",
        estimated_delivery_date: "",
        notes: "",
      }).success
    ).toBe(true)
  })
})

// ─── required field failures ──────────────────────────────────────────────────

describe("shipmentSchema — required fields", () => {
  it.each([
    "customer",
    "origin_warehouse",
    "origin_address",
    "destination_address",
    "shipping_date",
  ] as const)("%s empty → 'Requerido'", (field) => {
    const result = schema.safeParse({ ...VALID, [field]: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === field)?.message).toBe("Requerido")
  })
})
