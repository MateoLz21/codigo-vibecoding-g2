import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useShipments,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  useCreateShipmentItem,
  useUpdateShipmentItem,
  useDeleteShipmentItem,
} from "@/lib/hooks/use-shipments"
import type { Shipment, ShipmentItem } from "@/lib/types/shipment"

const BASE = "http://localhost:8000"

const mockItem: ShipmentItem = {
  id: 20,
  shipment: 1,
  product: { id: 5, name: "Laptop HP", sku: "LAP-001" },
  quantity: 2,
  unit_price: "2500.00",
  subtotal: "5000.00",
}

const mockShipment: Shipment = {
  id: 1,
  customer: { id: 2, name: "Cliente Test" },
  transport: null,
  route: null,
  origin_warehouse: { id: 3, name: "Almacén Central" },
  status: "pending",
  origin_address: "Av. Industrial 100",
  destination_address: "Jr. Comercio 456",
  shipping_date: "2024-06-01",
  estimated_delivery_date: null,
  actual_delivery_date: null,
  total_weight_kg: "5.00",
  shipping_cost: "2.50",
  notes: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockShipment] }

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

// ─── useShipments ─────────────────────────────────────────────────────────────

describe("useShipments", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useShipments())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].status).toBe("pending")
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useShipments())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useShipment (single) ─────────────────────────────────────────────────────

describe("useShipment", () => {
  it("fetches single shipment by id", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/1/`, () => HttpResponse.json(mockShipment))
    )
    const { result } = renderHookWithQuery(() => useShipment(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.customer.name).toBe("Cliente Test")
  })

  it("is disabled and never fetches when id=0", async () => {
    const { result } = renderHookWithQuery(() => useShipment(0))
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"))
    expect(result.current.data).toBeUndefined()
  })
})

// ─── Shipment mutations ───────────────────────────────────────────────────────

describe("useCreateShipment", () => {
  it("calls POST and invalidates ['shipments'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/shipments/`, () =>
        HttpResponse.json(mockShipment, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })

    result.current.mutate({
      customer: 2,
      origin_warehouse: 3,
      origin_address: "Av. Industrial 100",
      destination_address: "Jr. Comercio 456",
      shipping_date: "2024-06-01",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] })
    )
  })
})

describe("useUpdateShipment", () => {
  it("calls PATCH and invalidates both ['shipments'] and ['shipment', id]", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/shipments/1/`, () =>
        HttpResponse.json({ ...mockShipment, status: "in_transit" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateShipment(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { status: "in_transit" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] })
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipment", 1] })
    )
  })
})

describe("useDeleteShipment", () => {
  it("calls DELETE and invalidates ['shipments'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/shipments/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteShipment(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipments"] })
    )
  })
})

// ─── Item mutations ───────────────────────────────────────────────────────────

describe("useCreateShipmentItem", () => {
  it("calls POST item and invalidates ['shipment', shipmentId]", async () => {
    server.use(
      http.post(`${BASE}/api/v1/shipments/1/items/`, () =>
        HttpResponse.json(mockItem, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateShipmentItem(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ product: 5, quantity: 2 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipment", 1] })
    )
  })
})

describe("useUpdateShipmentItem", () => {
  it("calls PATCH item and invalidates ['shipment', shipmentId]", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/shipments/1/items/20/`, () =>
        HttpResponse.json({ ...mockItem, quantity: 5 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateShipmentItem(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({ itemId: 20, data: { quantity: 5 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipment", 1] })
    )
  })
})

describe("useDeleteShipmentItem", () => {
  it("calls DELETE item and invalidates ['shipment', shipmentId]", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/shipments/1/items/20/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteShipmentItem(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(20)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["shipment", 1] })
    )
  })
})
