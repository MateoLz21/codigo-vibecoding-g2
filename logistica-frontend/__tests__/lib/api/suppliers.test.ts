import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { suppliersApi } from "@/lib/api/endpoints/suppliers"
import type { Supplier } from "@/lib/types/supplier"

const BASE = "http://localhost:8000"

const mockSupplier: Supplier = {
  id: 1,
  name: "Proveedor SA",
  tax_id: "20123456789",
  email: "contact@proveedor.com",
  phone: "+51 999 999 999",
  address: "Av. Industrial 456",
  contact_name: "Juan Pérez",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockSupplier] }

describe("suppliersApi.list", () => {
  it("hits GET /api/v1/suppliers/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage))
    )
    const res = await suppliersApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].name).toBe("Proveedor SA")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await suppliersApi.list({ search: "Juan" })
    expect(url).toContain("search=Juan")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await suppliersApi.list({ page: 3 })
    expect(url).toContain("page=3")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(suppliersApi.list()).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("suppliersApi.getById", () => {
  it("hits GET /api/v1/suppliers/:id/", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/1/`, () => HttpResponse.json(mockSupplier))
    )
    const res = await suppliersApi.getById(1)
    expect(res.data).toEqual(mockSupplier)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/suppliers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(suppliersApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("suppliersApi.create", () => {
  it("hits POST /api/v1/suppliers/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/suppliers/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockSupplier, { status: 201 })
      })
    )
    const payload = { name: "Nuevo Proveedor" }
    const res = await suppliersApi.create(payload)
    expect(res.data).toEqual(mockSupplier)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400", async () => {
    server.use(
      http.post(`${BASE}/api/v1/suppliers/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(suppliersApi.create({ name: "" })).rejects.toMatchObject({
      response: { status: 400 },
    })
  })
})

describe("suppliersApi.update", () => {
  it("hits PATCH /api/v1/suppliers/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/suppliers/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockSupplier, name: "Updated" })
      })
    )
    const res = await suppliersApi.update(1, { name: "Updated" })
    expect(res.data.name).toBe("Updated")
    expect(body).toEqual({ name: "Updated" })
  })
})

describe("suppliersApi.remove", () => {
  it("hits DELETE /api/v1/suppliers/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/suppliers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await suppliersApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/suppliers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(suppliersApi.remove(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
