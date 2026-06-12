import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/suppliers/supplier-form.tsx
const schema = z.object({
  name: z.string().min(1, "Requerido"),
  tax_id: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
})

const VALID = { name: "Proveedor SA" }

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("supplierSchema — valid cases", () => {
  it("passes with only required name", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with all fields filled", () => {
    expect(
      schema.safeParse({
        name: "Proveedor SA",
        tax_id: "20123456789",
        email: "contact@proveedor.com",
        phone: "+51 999 999 999",
        address: "Av. 1",
        contact_name: "Juan",
      }).success
    ).toBe(true)
  })

  it("passes when optional fields are omitted", () => {
    expect(schema.safeParse({ name: "X" }).success).toBe(true)
  })
})

// ─── name required ────────────────────────────────────────────────────────────

describe("supplierSchema — name required", () => {
  it("name empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, name: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "name")?.message).toBe("Requerido")
  })
})

// ─── email validation (non-trivial) ──────────────────────────────────────────

describe("supplierSchema — email field", () => {
  it("empty string '' passes (UI default / cleared field)", () => {
    expect(schema.safeParse({ ...VALID, email: "" }).success).toBe(true)
  })

  it("undefined passes (optional)", () => {
    expect(schema.safeParse({ ...VALID, email: undefined }).success).toBe(true)
  })

  it("valid email passes", () => {
    expect(schema.safeParse({ ...VALID, email: "test@example.com" }).success).toBe(true)
  })

  it("invalid email format fails with 'Email inválido'", () => {
    const result = schema.safeParse({ ...VALID, email: "notanemail" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "email")?.message).toBe(
        "Email inválido"
      )
  })

  it("partial email format fails", () => {
    expect(schema.safeParse({ ...VALID, email: "user@" }).success).toBe(false)
  })
})
