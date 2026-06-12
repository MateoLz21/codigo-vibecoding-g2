import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks/use-products"
import type { Product } from "@/lib/types/product"

const BASE = "http://localhost:8000"

const mockProduct: Product = {
  id: 1,
  supplier: { id: 5, name: "Proveedor Test" },
  warehouse: { id: 3, name: "Almacén Test" },
  name: "Laptop HP 15",
  sku: "LAP-HP-001",
  description: null,
  weight_kg: "2.50",
  unit_price: "2500.00",
  stock: 10,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockProduct] }

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

// ─── useProducts ──────────────────────────────────────────────────────────────

describe("useProducts", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useProducts())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].sku).toBe("LAP-HP-001")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useProducts({ search: "laptop" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useProducts())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateProduct", () => {
  it("calls POST and invalidates ['products'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/products/`, () =>
        HttpResponse.json(mockProduct, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })

    result.current.mutate({
      name: "Teclado",
      sku: "TEC-001",
      supplier: 5,
      warehouse: 3,
      unit_price: "150.00",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] })
    )
  })
})

describe("useUpdateProduct", () => {
  it("calls PATCH and invalidates ['products'] on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/products/1/`, () =>
        HttpResponse.json({ ...mockProduct, name: "Updated" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] })
    )
  })
})

describe("useDeleteProduct", () => {
  it("calls DELETE and invalidates ['products'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/products/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["products"] })
    )
  })
})
