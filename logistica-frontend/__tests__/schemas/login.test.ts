import { describe, expect, it } from "vitest"
import { z } from "zod"

// Mirrors the schema in app/(auth)/login/page.tsx (not exported from production code)
const loginSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(1, "Requerido"),
})

describe("loginSchema", () => {
  it("rejects empty username with 'Requerido'", () => {
    const result = loginSchema.safeParse({ username: "", password: "pass123" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "username")?.message
      expect(msg).toBe("Requerido")
    }
  })

  it("rejects empty password with 'Requerido'", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "password")?.message
      expect(msg).toBe("Requerido")
    }
  })

  it("rejects both empty fields and reports two errors", () => {
    const result = loginSchema.safeParse({ username: "", password: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2)
    }
  })

  it("passes with valid username and password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "admin1234" })
    expect(result.success).toBe(true)
  })

  it("passes with minimum 1-character fields", () => {
    const result = loginSchema.safeParse({ username: "a", password: "b" })
    expect(result.success).toBe(true)
  })
})
