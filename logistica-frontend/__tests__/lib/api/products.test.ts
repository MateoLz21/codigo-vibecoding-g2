import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { productsApi } from "@/lib/api/endpoints/products"
import type { Product } from "@/lib/types/product"

const BASE = "http://localhost:8000"

const mockProduct: Product = {
  id: 1,
  supplier: { id: 5, name: "Proveedor Test" },
  warehouse: { id: 3, name: "Almacén Test" },
  name: "Laptop HP 15",
  sku: "LAP-HP-001",
  description: "Laptop de uso general",
  weight_kg: "2.50",
  unit_price: "2500.00",
  stock: 10,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockProduct] }

describe("productsApi.list", () => {
  it("hits GET /api/v1/products/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage))
    )
    const res = await productsApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].sku).toBe("LAP-HP-001")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/products/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await productsApi.list({ search: "Laptop" })
    expect(url).toContain("search=Laptop")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/products/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await productsApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(productsApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("productsApi.getById", () => {
  it("hits GET /api/v1/products/:id/", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/1/`, () => HttpResponse.json(mockProduct))
    )
    const res = await productsApi.getById(1)
    expect(res.data).toEqual(mockProduct)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/products/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(productsApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("productsApi.create", () => {
  it("hits POST /api/v1/products/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/products/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockProduct, { status: 201 })
      })
    )
    const payload = {
      name: "Teclado Mecánico",
      sku: "TEC-001",
      supplier: 5,
      warehouse: 3,
      unit_price: "150.00",
      stock: 20,
    }
    const res = await productsApi.create(payload)
    expect(res.data).toEqual(mockProduct)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400", async () => {
    server.use(
      http.post(`${BASE}/api/v1/products/`, () =>
        HttpResponse.json({ sku: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(
      productsApi.create({ name: "", sku: "", supplier: 1, warehouse: 1, unit_price: "0" })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

describe("productsApi.update", () => {
  it("hits PATCH /api/v1/products/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/products/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockProduct, name: "Laptop Updated" })
      })
    )
    const res = await productsApi.update(1, { name: "Laptop Updated" })
    expect(res.data.name).toBe("Laptop Updated")
    expect(body).toEqual({ name: "Laptop Updated" })
  })
})

describe("productsApi.remove", () => {
  it("hits DELETE /api/v1/products/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/products/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await productsApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/products/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(productsApi.remove(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
