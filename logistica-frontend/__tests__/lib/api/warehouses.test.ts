import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { warehousesApi } from "@/lib/api/endpoints/warehouses"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Warehouse } from "@/lib/types/warehouse"

const BASE = "http://localhost:8000"

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Almacén Central",
  address: "Av. Principal 123",
  city: "Lima",
  country: "Peru",
  latitude: "-12.046374",
  longitude: "-77.042793",
  capacity_m3: "500.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage: DRFPage<Warehouse> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockWarehouse],
}

// ─── list ─────────────────────────────────────────────────────────────────────

describe("warehousesApi.list", () => {
  it("hits GET /api/v1/warehouses/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage))
    )
    const res = await warehousesApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.count).toBe(1)
    expect(res.data.results[0].name).toBe("Almacén Central")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await warehousesApi.list({ search: "Lima" })
    expect(url).toContain("search=Lima")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await warehousesApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx without swallowing", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(warehousesApi.list()).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── getById ──────────────────────────────────────────────────────────────────

describe("warehousesApi.getById", () => {
  it("hits GET /api/v1/warehouses/:id/ and returns warehouse", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/1/`, () =>
        HttpResponse.json(mockWarehouse)
      )
    )
    const res = await warehousesApi.getById(1)
    expect(res.data).toEqual(mockWarehouse)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/warehouses/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(warehousesApi.getById(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── create ───────────────────────────────────────────────────────────────────

describe("warehousesApi.create", () => {
  it("hits POST /api/v1/warehouses/ with payload and returns created row", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/warehouses/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockWarehouse, { status: 201 })
      })
    )
    const payload = { name: "Almacén Central", address: "Av. 1", city: "Lima", country: "Peru" }
    const res = await warehousesApi.create(payload)
    expect(res.data).toEqual(mockWarehouse)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400 validation error", async () => {
    server.use(
      http.post(`${BASE}/api/v1/warehouses/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(
      warehousesApi.create({ name: "", address: "A", city: "B", country: "C" })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

// ─── update ───────────────────────────────────────────────────────────────────

describe("warehousesApi.update", () => {
  it("hits PATCH /api/v1/warehouses/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/warehouses/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockWarehouse, name: "Updated" })
      })
    )
    const res = await warehousesApi.update(1, { name: "Updated" })
    expect(res.data.name).toBe("Updated")
    expect(body).toEqual({ name: "Updated" })
  })

  it("propagates 4xx", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/warehouses/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(warehousesApi.update(999, { name: "X" })).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

// ─── remove ───────────────────────────────────────────────────────────────────

describe("warehousesApi.remove", () => {
  it("hits DELETE /api/v1/warehouses/:id/ and gets 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/warehouses/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await warehousesApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on remove", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/warehouses/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(warehousesApi.remove(999)).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})
