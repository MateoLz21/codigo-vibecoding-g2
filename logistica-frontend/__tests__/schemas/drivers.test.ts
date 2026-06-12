import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors schemas in app/(dashboard)/drivers/driver-form.tsx

const createSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  license_number: z.string().min(1, "Requerido"),
  license_expiry: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  is_available: z.boolean(),
})

const editSchema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  license_number: z.string().min(1, "Requerido"),
  license_expiry: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  is_available: z.boolean(),
})

const VALID_CREATE = {
  username: "juan.perez",
  password: "secret123",
  first_name: "Juan",
  last_name: "Pérez",
  email: "juan@test.com",
  license_number: "Q12345678",
  license_expiry: "2026-06-30",
  is_available: true,
}

const VALID_EDIT = {
  first_name: "Juan",
  last_name: "Pérez",
  email: "juan@test.com",
  license_number: "Q12345678",
  license_expiry: "2026-06-30",
  is_available: true,
}

// ─── createSchema valid ───────────────────────────────────────────────────────

describe("driverCreateSchema — valid cases", () => {
  it("passes with all required fields", () => {
    expect(createSchema.safeParse(VALID_CREATE).success).toBe(true)
  })

  it("passes with optional phone included", () => {
    expect(
      createSchema.safeParse({ ...VALID_CREATE, phone: "+51 999 999 999" }).success
    ).toBe(true)
  })

  it("passes with phone omitted", () => {
    expect(createSchema.safeParse(VALID_CREATE).success).toBe(true)
  })
})

// ─── createSchema required fields ────────────────────────────────────────────

describe("driverCreateSchema — required fields", () => {
  it.each(["username", "first_name", "last_name", "license_number", "license_expiry"] as const)(
    "%s empty → 'Requerido'",
    (field) => {
      const result = createSchema.safeParse({ ...VALID_CREATE, [field]: "" })
      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error.issues.find((i) => i.path[0] === field)?.message).toBe("Requerido")
    }
  )
})

// ─── createSchema password ────────────────────────────────────────────────────

describe("driverCreateSchema — password", () => {
  it("password < 6 chars → 'Mínimo 6 caracteres'", () => {
    const result = createSchema.safeParse({ ...VALID_CREATE, password: "abc" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "password")?.message).toBe(
        "Mínimo 6 caracteres"
      )
  })

  it("password exactly 6 chars passes", () => {
    expect(createSchema.safeParse({ ...VALID_CREATE, password: "abc123" }).success).toBe(true)
  })
})

// ─── createSchema email ───────────────────────────────────────────────────────

describe("driverCreateSchema — email", () => {
  it("invalid email → 'Email inválido'", () => {
    const result = createSchema.safeParse({ ...VALID_CREATE, email: "notanemail" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "email")?.message).toBe(
        "Email inválido"
      )
  })

  it("empty email fails (not optional)", () => {
    expect(createSchema.safeParse({ ...VALID_CREATE, email: "" }).success).toBe(false)
  })

  it("valid email passes", () => {
    expect(createSchema.safeParse({ ...VALID_CREATE, email: "valid@test.com" }).success).toBe(true)
  })
})

// ─── editSchema ───────────────────────────────────────────────────────────────

describe("driverEditSchema — valid cases", () => {
  it("passes with all required fields", () => {
    expect(editSchema.safeParse(VALID_EDIT).success).toBe(true)
  })
})

describe("driverEditSchema — required fields", () => {
  it.each(["first_name", "last_name", "license_number", "license_expiry"] as const)(
    "%s empty → 'Requerido'",
    (field) => {
      const result = editSchema.safeParse({ ...VALID_EDIT, [field]: "" })
      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error.issues.find((i) => i.path[0] === field)?.message).toBe("Requerido")
    }
  )
})

describe("driverEditSchema — email", () => {
  it("invalid email → 'Email inválido'", () => {
    const result = editSchema.safeParse({ ...VALID_EDIT, email: "bad" })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.find((i) => i.path[0] === "email")?.message).toBe(
        "Email inválido"
      )
  })

  it("empty email fails (not optional)", () => {
    expect(editSchema.safeParse({ ...VALID_EDIT, email: "" }).success).toBe(false)
  })
})
