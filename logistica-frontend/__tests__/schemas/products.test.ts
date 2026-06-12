import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/products/product-form.tsx
const schema = z.object({
  name: z.string().min(1, "Requerido"),
  sku: z.string().min(1, "Requerido"),
  supplier: z.string().min(1, "Requerido"),
  warehouse: z.string().min(1, "Requerido"),
  unit_price: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Debe ser mayor a 0",
    }),
  stock: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Debe ser >= 0",
    }),
  description: z.string().optional(),
  weight_kg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Debe ser un número >= 0",
    }),
})

const VALID = {
  name: "Laptop HP",
  sku: "LAP-001",
  supplier: "5",
  warehouse: "3",
  unit_price: "99.90",
  weight_kg: "2.50",
}

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("productSchema — valid cases", () => {
  it("passes with all required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with optional fields included", () => {
    expect(
      schema.safeParse({
        ...VALID,
        stock: "10",
        description: "Descripción del producto",
      }).success
    ).toBe(true)
  })

  it("passes when optional fields are omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("weight_kg = '0' passes (>= 0 allowed)", () => {
    expect(schema.safeParse({ ...VALID, weight_kg: "0" }).success).toBe(true)
  })
})

// ─── required field failures ──────────────────────────────────────────────────

describe("productSchema — required fields", () => {
  it.each(["name", "sku", "supplier", "warehouse"] as const)(
    "%s empty → 'Requerido'",
    (field) => {
      const result = schema.safeParse({ ...VALID, [field]: "" })
      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error.issues.find((i) => i.path[0] === field)?.message).toBe("Requerido")
    }
  )

  it("unit_price empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, unit_price: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "unit_price")?.message).toBe(
        "Requerido"
      )
  })

  it("weight_kg empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, weight_kg: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "weight_kg")?.message).toBe(
        "Requerido"
      )
  })
})

// ─── unit_price validation ────────────────────────────────────────────────────

describe("productSchema — unit_price", () => {
  it("'0' → 'Debe ser mayor a 0'", () => {
    const result = schema.safeParse({ ...VALID, unit_price: "0" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "unit_price")?.message).toBe(
        "Debe ser mayor a 0"
      )
  })

  it("negative value → 'Debe ser mayor a 0'", () => {
    const result = schema.safeParse({ ...VALID, unit_price: "-5" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "unit_price")?.message).toBe(
        "Debe ser mayor a 0"
      )
  })

  it("non-numeric → 'Debe ser mayor a 0'", () => {
    expect(schema.safeParse({ ...VALID, unit_price: "abc" }).success).toBe(false)
  })

  it("positive value passes", () => {
    expect(schema.safeParse({ ...VALID, unit_price: "0.01" }).success).toBe(true)
  })
})

// ─── weight_kg validation ─────────────────────────────────────────────────────

describe("productSchema — weight_kg", () => {
  it("non-numeric → 'Debe ser un número >= 0'", () => {
    const result = schema.safeParse({ ...VALID, weight_kg: "abc" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "weight_kg")?.message).toBe(
        "Debe ser un número >= 0"
      )
  })

  it("negative value → 'Debe ser un número >= 0'", () => {
    const result = schema.safeParse({ ...VALID, weight_kg: "-1" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "weight_kg")?.message).toBe(
        "Debe ser un número >= 0"
      )
  })
})

// ─── stock optional validation ────────────────────────────────────────────────

describe("productSchema — stock (optional)", () => {
  it("undefined passes", () => {
    expect(schema.safeParse({ ...VALID, stock: undefined }).success).toBe(true)
  })

  it("'0' passes", () => {
    expect(schema.safeParse({ ...VALID, stock: "0" }).success).toBe(true)
  })

  it("negative → 'Debe ser >= 0'", () => {
    const result = schema.safeParse({ ...VALID, stock: "-1" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "stock")?.message).toBe(
        "Debe ser >= 0"
      )
  })
})
