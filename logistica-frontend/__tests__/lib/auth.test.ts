import { beforeEach, describe, expect, it } from "vitest"
import { useAuthStore } from "@/lib/stores/auth.store"

beforeEach(() => {
  useAuthStore.getState().clear()
  localStorage.clear()
})

describe("accessToken (getAccessToken)", () => {
  it("is null by default", () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it("returns value after setTokens", () => {
    useAuthStore.getState().setTokens({ accessToken: "acc-123", refreshToken: "ref-abc" })
    expect(useAuthStore.getState().accessToken).toBe("acc-123")
  })
})

describe("refreshToken (getRefreshToken)", () => {
  it("is null by default", () => {
    expect(useAuthStore.getState().refreshToken).toBeNull()
  })

  it("returns value after setTokens", () => {
    useAuthStore.getState().setTokens({ accessToken: "acc", refreshToken: "ref-xyz" })
    expect(useAuthStore.getState().refreshToken).toBe("ref-xyz")
  })
})

describe("setTokens", () => {
  it("sets both accessToken and refreshToken", () => {
    useAuthStore.getState().setTokens({ accessToken: "a", refreshToken: "r" })
    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBe("a")
    expect(refreshToken).toBe("r")
  })

  it("preserves existing user when user is not provided", () => {
    const user = { username: "pedro", email: "p@x.com", is_superuser: false }
    useAuthStore.getState().setTokens({ accessToken: "a1", refreshToken: "r1", user })
    useAuthStore.getState().setTokens({ accessToken: "a2", refreshToken: "r2" })
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it("persists refreshToken to localStorage under 'logistica-auth'", () => {
    useAuthStore.getState().setTokens({ accessToken: "a", refreshToken: "ref-persist" })
    const raw = localStorage.getItem("logistica-auth")
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.refreshToken).toBe("ref-persist")
  })

  it("does NOT persist accessToken to localStorage", () => {
    useAuthStore.getState().setTokens({ accessToken: "secret-access", refreshToken: "r" })
    const raw = localStorage.getItem("logistica-auth")!
    expect(raw).not.toContain("secret-access")
  })
})

describe("clearTokens (clear)", () => {
  it("nullifies accessToken, refreshToken, and user", () => {
    useAuthStore.getState().setTokens({
      accessToken: "a",
      refreshToken: "r",
      user: { username: "u", email: "u@x.com", is_superuser: false },
    })
    useAuthStore.getState().clear()
    const { accessToken, refreshToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(user).toBeNull()
  })
})

describe("isAuthenticated (derived: !!accessToken)", () => {
  it("true when accessToken is truthy", () => {
    useAuthStore.getState().setTokens({ accessToken: "tok", refreshToken: "r" })
    expect(!!useAuthStore.getState().accessToken).toBe(true)
  })

  it("false when accessToken is null", () => {
    expect(!!useAuthStore.getState().accessToken).toBe(false)
  })

  it("false after clear()", () => {
    useAuthStore.getState().setTokens({ accessToken: "tok", refreshToken: "r" })
    useAuthStore.getState().clear()
    expect(!!useAuthStore.getState().accessToken).toBe(false)
  })
})

describe("SSR guard", () => {
  it("initial state is safe: all fields are null (no window access needed)", () => {
    // accessToken is NOT persisted — always null on initial load (SSR-safe)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it("store.getState() does not throw when called in a non-browser context", () => {
    // Simulate SSR: temporarily remove window
    const win = globalThis.window
    // @ts-expect-error intentional SSR simulation
    delete globalThis.window
    expect(() => useAuthStore.getState()).not.toThrow()
    globalThis.window = win
  })
})
