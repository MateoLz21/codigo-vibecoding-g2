import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"

const BASE = "http://localhost:8000"

// ─── window.location mock ─────────────────────────────────────────────────────
// Must start with a valid absolute URL: MSW's XHR interceptor calls
//   new URL(input, window.location.href)
// and throws if the base is "" or otherwise invalid.
const ORIGIN = "http://localhost:3000/"
const mockLocation = { href: ORIGIN }
beforeAll(() => {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    writable: true,
    value: mockLocation,
  })
})

// ─── Module reset ─────────────────────────────────────────────────────────────
// lib/api/client.ts has module-level variables (isRefreshing, failedQueue).
// The "no refresh token" code path sets isRefreshing=true then early-returns
// before the finally{} that resets it, leaking state across tests.
// vi.resetModules() + dynamic import gives each test a clean module instance.
let apiClient: Awaited<typeof import("@/lib/api/client")>["apiClient"]
let useAuthStore: Awaited<typeof import("@/lib/stores/auth.store")>["useAuthStore"]

beforeEach(async () => {
  mockLocation.href = ORIGIN
  vi.resetModules()
  apiClient = (await import("@/lib/api/client")).apiClient
  useAuthStore = (await import("@/lib/stores/auth.store")).useAuthStore
  useAuthStore.getState().clear()
  localStorage.clear()
})

// ─── Request interceptor ──────────────────────────────────────────────────────

describe("Request interceptor", () => {
  it("adds Authorization: Bearer <token> when accessToken is set", async () => {
    useAuthStore.getState().setTokens({ accessToken: "acc-tok", refreshToken: "ref-tok" })

    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/ping/`, ({ request }) => {
        capturedAuth = request.headers.get("authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get("/api/v1/ping/")
    expect(capturedAuth).toBe("Bearer acc-tok")
  })

  it("does not add Authorization header when no accessToken", async () => {
    let capturedAuth: string | null = "SENTINEL"
    server.use(
      http.get(`${BASE}/api/v1/ping/`, ({ request }) => {
        capturedAuth = request.headers.get("authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get("/api/v1/ping/")
    expect(capturedAuth).toBeNull()
  })
})

// ─── Response interceptor — 401 with valid refresh token ─────────────────────

describe("Response interceptor — 401 with valid refresh token", () => {
  it("calls POST /auth/token/refresh/ and retries the original request", async () => {
    useAuthStore.getState().setTokens({ accessToken: "old-acc", refreshToken: "ref-tok" })

    let callCount = 0
    server.use(
      http.get(`${BASE}/api/v1/items/`, () => {
        callCount++
        if (callCount === 1) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
        return HttpResponse.json({ data: "ok" })
      }),
      http.post(`${BASE}/api/v1/auth/token/refresh/`, () =>
        HttpResponse.json({ access: "new-acc-tok" })
      )
    )

    const res = await apiClient.get("/api/v1/items/")
    expect(res.data).toEqual({ data: "ok" })
    expect(callCount).toBe(2)
  })

  it("saves the new access token via setTokens", async () => {
    useAuthStore.getState().setTokens({ accessToken: "old-acc", refreshToken: "ref-tok" })

    server.use(
      http.get(`${BASE}/api/v1/items/`, ({ request }) => {
        if (request.headers.get("authorization") === "Bearer old-acc")
          return HttpResponse.json({}, { status: 401 })
        return HttpResponse.json({ ok: true })
      }),
      http.post(`${BASE}/api/v1/auth/token/refresh/`, () =>
        HttpResponse.json({ access: "brand-new-tok" })
      )
    )

    await apiClient.get("/api/v1/items/")
    expect(useAuthStore.getState().accessToken).toBe("brand-new-tok")
  })

  it("retry carries the new token in Authorization header", async () => {
    useAuthStore.getState().setTokens({ accessToken: "old-acc", refreshToken: "ref-tok" })

    let retryAuth: string | null = null
    let callCount = 0
    server.use(
      http.get(`${BASE}/api/v1/items/`, ({ request }) => {
        callCount++
        if (callCount === 1) return HttpResponse.json({}, { status: 401 })
        retryAuth = request.headers.get("authorization")
        return HttpResponse.json({ ok: true })
      }),
      http.post(`${BASE}/api/v1/auth/token/refresh/`, () =>
        HttpResponse.json({ access: "brand-new-tok" })
      )
    )

    await apiClient.get("/api/v1/items/")
    expect(retryAuth).toBe("Bearer brand-new-tok")
  })
})

// ─── Response interceptor — 401 without refresh token ────────────────────────

describe("Response interceptor — 401 without refresh token", () => {
  it("calls clear() and redirects to /login", async () => {
    // Only accessToken set, no refreshToken
    useAuthStore.setState({ accessToken: "acc" })

    server.use(
      http.get(`${BASE}/api/v1/items/`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    )

    await expect(apiClient.get("/api/v1/items/")).rejects.toMatchObject({
      response: { status: 401 },
    })

    const { accessToken, refreshToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(user).toBeNull()
    expect(mockLocation.href).toBe("/login")
  })
})

// ─── Response interceptor — 401 where refresh also fails ─────────────────────

describe("Response interceptor — 401 where refresh also fails", () => {
  it("calls clear(), redirects to /login, and rejects the promise", async () => {
    useAuthStore.getState().setTokens({ accessToken: "acc", refreshToken: "ref-tok" })

    server.use(
      http.get(`${BASE}/api/v1/items/`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      ),
      http.post(`${BASE}/api/v1/auth/token/refresh/`, () =>
        HttpResponse.json({ error: "Refresh invalid" }, { status: 401 })
      )
    )

    await expect(apiClient.get("/api/v1/items/")).rejects.toBeTruthy()

    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(mockLocation.href).toBe("/login")
  })
})

// ─── _retry flag — no infinite loop ──────────────────────────────────────────

describe("_retry flag — no infinite loop", () => {
  it("refresh called once; retried 401 rejects without another refresh cycle", async () => {
    useAuthStore.getState().setTokens({ accessToken: "acc", refreshToken: "ref-tok" })

    let refreshCalls = 0
    server.use(
      // Every call to this endpoint returns 401, including the retry
      http.get(`${BASE}/api/v1/items/`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      ),
      http.post(`${BASE}/api/v1/auth/token/refresh/`, () => {
        refreshCalls++
        return HttpResponse.json({ access: "new-tok" })
      })
    )

    await expect(apiClient.get("/api/v1/items/")).rejects.toMatchObject({
      response: { status: 401 },
    })

    // _retry=true on second 401 → interceptor returns early without refreshing again
    expect(refreshCalls).toBe(1)
  })
})
