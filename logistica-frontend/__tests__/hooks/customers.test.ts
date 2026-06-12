import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/lib/hooks/use-customers"
import type { Customer } from "@/lib/types/customer"

const BASE = "http://localhost:8000"

const mockCustomer: Customer = {
  id: 1,
  name: "Cliente SA",
  customer_type: "company",
  tax_id: null,
  email: null,
  phone: null,
  address: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockCustomer] }

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

// ─── useCustomers ─────────────────────────────────────────────────────────────

describe("useCustomers", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useCustomers())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Cliente SA")
  })

  it("accepts params and still resolves", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useCustomers({ search: "cli" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(1)
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useCustomers())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── mutations — invalidateQueries ────────────────────────────────────────────

describe("useCreateCustomer", () => {
  it("calls POST and invalidates ['customers'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json(mockCustomer, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateCustomer(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ name: "Nuevo", customer_type: "company" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] })
    )
  })
})

describe("useUpdateCustomer", () => {
  it("calls PATCH and invalidates ['customers'] on success", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/customers/1/`, () =>
        HttpResponse.json({ ...mockCustomer, name: "Updated" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateCustomer(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] })
    )
  })
})

describe("useDeleteCustomer", () => {
  it("calls DELETE and invalidates ['customers'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/customers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteCustomer(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] })
    )
  })
})
