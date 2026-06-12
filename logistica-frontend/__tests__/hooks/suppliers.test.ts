import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/lib/hooks/use-suppliers"
import type { Supplier } from "@/lib/types/supplier"

const BASE = "http://localhost:8000"

const mockSupplier: Supplier = {
  id: 1,
  name: "Proveedor SA",
  tax_id: null,
  email: null,
  phone: null,
  address: null,
  contact_name: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockSupplier] }

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

// ─── useSuppliers ─────────────────────────────────────────────────────────────

describe("useSuppliers", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useSuppliers())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Proveedor SA")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useSuppliers({ search: "prov" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useSuppliers())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateSupplier", () => {
  it("calls POST and invalidates ['suppliers'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/suppliers/`, () =>
        HttpResponse.json(mockSupplier, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ name: "Nuevo" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] })
    )
  })
})

describe("useUpdateSupplier", () => {
  it("calls PATCH and invalidates ['suppliers'] on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/suppliers/1/`, () =>
        HttpResponse.json({ ...mockSupplier, name: "Updated" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] })
    )
  })
})

describe("useDeleteSupplier", () => {
  it("calls DELETE and invalidates ['suppliers'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/suppliers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] })
    )
  })
})
