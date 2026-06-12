import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(dashboard)/customers/customer-form.tsx
const schema = z.object({
  name: z.string().min(1, "Requerido"),
  customer_type: z.enum(["company", "individual"]),
  tax_id: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const VALID = { name: "Cliente SA", customer_type: "company" as const }

// ─── valid cases ──────────────────────────────────────────────────────────────

describe("customerSchema — valid cases", () => {
  it("passes with only required fields", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it("passes with customer_type=individual", () => {
    expect(schema.safeParse({ ...VALID, customer_type: "individual" }).success).toBe(true)
  })

  it("passes with all fields filled", () => {
    expect(
      schema.safeParse({
        name: "Cliente SA",
        customer_type: "company",
        tax_id: "20123456789",
        email: "contact@empresa.com",
        phone: "+51 999 999 999",
        address: "Av. 1",
      }).success
    ).toBe(true)
  })

  it("passes when optional fields are omitted", () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })
})

// ─── required field failures ──────────────────────────────────────────────────

describe("customerSchema — name required", () => {
  it("name empty → 'Requerido'", () => {
    const result = schema.safeParse({ ...VALID, name: "" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "name")?.message).toBe("Requerido")
  })
})

describe("customerSchema — customer_type enum", () => {
  it("rejects invalid customer_type", () => {
    const result = schema.safeParse({ ...VALID, customer_type: "other" })
    expect(result.success).toBe(false)
  })

  it("requires customer_type present", () => {
    const { customer_type: _, ...noType } = VALID
    const result = schema.safeParse(noType)
    expect(result.success).toBe(false)
  })
})

// ─── email validation ─────────────────────────────────────────────────────────

describe("customerSchema — email field", () => {
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
