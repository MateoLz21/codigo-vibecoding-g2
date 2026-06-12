import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/transport/transport-form.tsx
const schema = z.object({
  plate_number: z.string().min(1, "Requerido"),
  vehicle_type: z.enum(["truck", "van", "motorcycle"]),
  brand: z.string().min(1, "Requerido"),
  model: z.string().min(1, "Requerido"),
  year: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1900, {
      message: "Año inválido",
    }),
  max_capacity_kg: z.string().optional(),
})

const VALID = {
  plate_number: "ABC-123",
  vehicle_type: "truck" as const,
  brand: "Toyota",
  model: "Hilux",
  year: "2020",
}

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("transportSchema — valid cases", () => {
  it("passes with all required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes each vehicle_type variant", () => {
    for (const vt of ["truck", "van", "motorcycle"] as const) {
      expect(schema.safeParse({ ...VALID, vehicle_type: vt }).success).toBe(true)
    }
  })

  it("passes with max_capacity_kg set", () => {
    expect(schema.safeParse({ ...VALID, max_capacity_kg: "1000.00" }).success).toBe(true)
  })

  it("passes when max_capacity_kg is omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })
})

// ─── required field failures ──────────────────────────────────────────────────

describe("transportSchema — required fields", () => {
  it.each(["plate_number", "brand", "model"] as const)(
    "%s empty → 'Requerido'",
    (field) => {
      const result = schema.safeParse({ ...VALID, [field]: "" })
      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error.issues.find((i) => i.path[0] === field)?.message).toBe("Requerido")
    }
  )

  it("year empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, year: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "year")?.message).toBe("Requerido")
  })
})

// ─── year validation ──────────────────────────────────────────────────────────

describe("transportSchema — year field", () => {
  it("non-numeric string → 'Año inválido'", () => {
    const result = schema.safeParse({ ...VALID, year: "abc" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "year")?.message).toBe("Año inválido")
  })

  it("year < 1900 → 'Año inválido'", () => {
    const result = schema.safeParse({ ...VALID, year: "1800" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "year")?.message).toBe("Año inválido")
  })

  it("year = 1900 passes", () => {
    expect(schema.safeParse({ ...VALID, year: "1900" }).success).toBe(true)
  })

  it("current-era year passes", () => {
    expect(schema.safeParse({ ...VALID, year: "2024" }).success).toBe(true)
  })
})

// ─── vehicle_type enum ────────────────────────────────────────────────────────

describe("transportSchema — vehicle_type enum", () => {
  it("rejects unknown vehicle_type", () => {
    expect(schema.safeParse({ ...VALID, vehicle_type: "bus" }).success).toBe(false)
  })
})
