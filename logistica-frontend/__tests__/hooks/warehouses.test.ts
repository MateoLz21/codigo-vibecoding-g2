import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from "@/lib/hooks/use-warehouses"
import type { Warehouse } from "@/lib/types/warehouse"

const BASE = "http://localhost:8000"

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Central",
  address: "Av. 1",
  city: "Lima",
  country: "Peru",
  latitude: null,
  longitude: null,
  capacity_m3: "100.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockWarehouse] }

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

// ─── useWarehouses ────────────────────────────────────────────────────────────

describe("useWarehouses", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useWarehouses())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Central")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useWarehouses({ search: "Lima", page: 1 }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx response", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useWarehouses())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useWarehouse (by id) ─────────────────────────────────────────────────────

describe("useWarehouse", () => {
  it("fetches single warehouse by id", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/1/`, () =>
        HttpResponse.json(mockWarehouse)
      )
    )
    const { result } = renderHookWithQuery(() => useWarehouse(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("is disabled (fetchStatus=idle) when id=0", () => {
    const { result } = renderHookWithQuery(() => useWarehouse(0))
    // enabled: !!id → false when id=0
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe("idle")
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateWarehouse", () => {
  it("calls POST and invalidates ['warehouses'] queryKey on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/warehouses/`, () =>
        HttpResponse.json(mockWarehouse, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ name: "X", address: "A", city: "B", country: "C" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] })
    )
  })
})

describe("useUpdateWarehouse", () => {
  it("calls PATCH and invalidates ['warehouses'] queryKey on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/warehouses/1/`, () =>
        HttpResponse.json({ ...mockWarehouse, name: "Updated" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateWarehouse(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] })
    )
  })
})

describe("useDeleteWarehouse", () => {
  it("calls DELETE and invalidates ['warehouses'] queryKey on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/warehouses/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["warehouses"] })
    )
  })
})
