import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from "@/lib/hooks/use-drivers"
import type { Driver } from "@/lib/types/driver"

const BASE = "http://localhost:8000"

const mockDriver: Driver = {
  id: 1,
  user: {
    id: 10,
    username: "carlos.gomez",
    first_name: "Carlos",
    last_name: "Gómez",
    email: "carlos@logistica.com",
  },
  license_number: "Q12345678",
  license_expiry: "2025-12-31",
  phone: null,
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockDriver] }

function makeQC() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
  }
}

// ─── useDrivers ───────────────────────────────────────────────────────────────

describe("useDrivers", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useDrivers())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].license_number).toBe("Q12345678")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useDrivers({ search: "carlos" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useDrivers())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateDriver", () => {
  it("calls POST and invalidates ['drivers'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/drivers/`, () =>
        HttpResponse.json(mockDriver, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })

    result.current.mutate({
      user: {
        username: "pedro.lopez",
        password: "secret123",
        first_name: "Pedro",
        last_name: "López",
        email: "pedro@test.com",
      },
      license_number: "Q99999999",
      license_expiry: "2026-06-30",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] })
    )
  })
})

describe("useUpdateDriver", () => {
  it("calls PATCH and invalidates ['drivers'] on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/drivers/1/`, () =>
        HttpResponse.json(mockDriver)
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateDriver(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { user: { first_name: "Updated" } } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] })
    )
  })
})

describe("useDeleteDriver", () => {
  it("calls DELETE and invalidates ['drivers'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/drivers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteDriver(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["drivers"] })
    )
  })
})
