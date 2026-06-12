import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/routes/route-form.tsx
const schema = z.object({
  name: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  estimated_duration_hours: z.string().optional(),
})

const VALID = { name: "Ruta Lima Norte", origin_warehouse: "3" }

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("routeSchema — valid cases", () => {
  it("passes with only required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with estimated_duration_hours set", () => {
    expect(schema.safeParse({ ...VALID, estimated_duration_hours: "2.5" }).success).toBe(true)
  })

  it("passes when estimated_duration_hours is omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes when estimated_duration_hours is empty string (UI cleared)", () => {
    expect(schema.safeParse({ ...VALID, estimated_duration_hours: "" }).success).toBe(true)
  })
})

// ─── required field failures ──────────────────────────────────────────────────

describe("routeSchema — required fields", () => {
  it("name empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, name: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "name")?.message).toBe("Requerido")
  })

  it("origin_warehouse empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, origin_warehouse: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(
        result.error.issues.find((i) => i.path[0] === "origin_warehouse")?.message
      ).toBe("Requerido")
  })
})
