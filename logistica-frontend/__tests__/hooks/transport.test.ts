import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useTransport,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
} from "@/lib/hooks/use-transport"
import type { Transport } from "@/lib/types/transport"

const BASE = "http://localhost:8000"

const mockTransport: Transport = {
  id: 1,
  plate_number: "XYZ-789",
  vehicle_type: "van",
  brand: "Mercedes",
  model: "Sprinter",
  year: 2022,
  max_capacity_kg: null,
  driver: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockTransport] }

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

// ─── useTransport ─────────────────────────────────────────────────────────────

describe("useTransport", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useTransport())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].plate_number).toBe("XYZ-789")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useTransport({ search: "xyz" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useTransport())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateTransport", () => {
  it("calls POST and invalidates ['transport'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/transport/`, () =>
        HttpResponse.json(mockTransport, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateTransport(), { wrapper: makeWrapper(qc) })

    result.current.mutate({
      plate_number: "ABC-001",
      vehicle_type: "truck",
      brand: "Toyota",
      model: "Hilux",
      year: 2020,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] })
    )
  })
})

describe("useUpdateTransport", () => {
  it("calls PATCH and invalidates ['transport'] on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/transport/1/`, () =>
        HttpResponse.json({ ...mockTransport, brand: "Ford" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateTransport(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { brand: "Ford" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] })
    )
  })
})

describe("useDeleteTransport", () => {
  it("calls DELETE and invalidates ['transport'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/transport/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteTransport(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["transport"] })
    )
  })
})
