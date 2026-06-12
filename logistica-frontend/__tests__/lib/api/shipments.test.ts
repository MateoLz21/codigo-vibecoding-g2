import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { shipmentsApi } from "@/lib/api/endpoints/shipments"
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
  items: [mockItem],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockShipment] }

// ─── Shipment CRUD ────────────────────────────────────────────────────────────

describe("shipmentsApi.list", () => {
  it("hits GET /api/v1/shipments/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockPage))
    )
    const res = await shipmentsApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].status).toBe("pending")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await shipmentsApi.list({ search: "Lima" })
    expect(url).toContain("search=Lima")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await shipmentsApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(shipmentsApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("shipmentsApi.getById", () => {
  it("hits GET /api/v1/shipments/:id/ and includes items", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/1/`, () => HttpResponse.json(mockShipment))
    )
    const res = await shipmentsApi.getById(1)
    expect(res.data.items).toHaveLength(1)
    expect(res.data.items![0].product.sku).toBe("LAP-001")
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/shipments/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(shipmentsApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("shipmentsApi.create", () => {
  it("hits POST /api/v1/shipments/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/shipments/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockShipment, { status: 201 })
      })
    )
    const payload = {
      customer: 2,
      origin_warehouse: 3,
      origin_address: "Av. Industrial 100",
      destination_address: "Jr. Comercio 456",
      shipping_date: "2024-06-01",
    }
    const res = await shipmentsApi.create(payload)
    expect(res.data.status).toBe("pending")
    expect(body).toMatchObject(payload)
  })
})

describe("shipmentsApi.update", () => {
  it("hits PATCH /api/v1/shipments/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/shipments/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockShipment, status: "in_transit" })
      })
    )
    const res = await shipmentsApi.update(1, { status: "in_transit" })
    expect(res.data.status).toBe("in_transit")
    expect(body).toEqual({ status: "in_transit" })
  })
})

describe("shipmentsApi.remove", () => {
  it("hits DELETE /api/v1/shipments/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/shipments/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await shipmentsApi.remove(1)
    expect(res.status).toBe(204)
  })
})

// ─── Item CRUD ────────────────────────────────────────────────────────────────

describe("shipmentsApi.createItem", () => {
  it("hits POST /api/v1/shipments/:id/items/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/shipments/1/items/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockItem, { status: 201 })
      })
    )
    const payload = { product: 5, quantity: 2 }
    const res = await shipmentsApi.createItem(1, payload)
    expect(res.data.quantity).toBe(2)
    expect(body).toMatchObject(payload)
  })
})

describe("shipmentsApi.updateItem", () => {
  it("hits PATCH /api/v1/shipments/:id/items/:itemId/", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/shipments/1/items/20/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockItem, quantity: 5 })
      })
    )
    const res = await shipmentsApi.updateItem(1, 20, { quantity: 5 })
    expect(res.data.quantity).toBe(5)
    expect(body).toEqual({ quantity: 5 })
  })
})

describe("shipmentsApi.removeItem", () => {
  it("hits DELETE /api/v1/shipments/:id/items/:itemId/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/shipments/1/items/20/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await shipmentsApi.removeItem(1, 20)
    expect(res.status).toBe(204)
  })
})
