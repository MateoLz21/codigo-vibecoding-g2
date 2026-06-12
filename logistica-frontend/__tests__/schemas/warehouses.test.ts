import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/warehouses/warehouse-form.tsx
const schema = z.object({
  name: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  country: z.string().min(1, "Requerido"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  capacity_m3: z.string().optional(),
})

const VALID = {
  name: "Almacén Central",
  address: "Av. Principal 123",
  city: "Lima",
  country: "Peru",
}

describe("warehouseSchema — valid cases", () => {
  it("passes with all required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with optional fields included", () => {
    const result = schema.safeParse({
      ...VALID,
      latitude: "-12.046374",
      longitude: "-77.042793",
      capacity_m3: "500.00",
    })
    expect(result.success).toBe(true)
  })

  it("passes when optional fields are omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes when optional fields are empty strings (UI default)", () => {
    expect(schema.safeParse({ ...VALID, latitude: "", longitude: "", capacity_m3: "" }).success).toBe(true)
  })
})

describe("warehouseSchema — required field failures", () => {
  it.each([
    ["name", "Requerido"],
    ["address", "Requerido"],
    ["city", "Requerido"],
    ["country", "Requerido"],
  ])("'%s' empty → message '%s'", (field, msg) => {
    const result = schema.safeParse({ ...VALID, [field]: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field)
      expect(issue?.message).toBe(msg)
    }
  })

  it("all four required fields empty → four issues", () => {
    const result = schema.safeParse({
      name: "",
      address: "",
      city: "",
      country: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues).toHaveLength(4)
  })
})
