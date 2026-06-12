import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { customersApi } from "@/lib/api/endpoints/customers"
import type { Customer } from "@/lib/types/customer"

const BASE = "http://localhost:8000"

const mockCustomer: Customer = {
  id: 1,
  name: "Cliente SA",
  customer_type: "company",
  tax_id: "20123456789",
  email: "cliente@empresa.com",
  phone: "+51 999 999 999",
  address: "Av. Principal 123",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockCustomer] }

describe("customersApi.list", () => {
  it("hits GET /api/v1/customers/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage))
    )
    const res = await customersApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].name).toBe("Cliente SA")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await customersApi.list({ search: "Cliente" })
    expect(url).toContain("search=Cliente")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await customersApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(customersApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("customersApi.getById", () => {
  it("hits GET /api/v1/customers/:id/", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/1/`, () => HttpResponse.json(mockCustomer))
    )
    const res = await customersApi.getById(1)
    expect(res.data).toEqual(mockCustomer)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(customersApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("customersApi.create", () => {
  it("hits POST /api/v1/customers/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/customers/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockCustomer, { status: 201 })
      })
    )
    const payload = { name: "Nuevo Cliente", customer_type: "company" as const }
    const res = await customersApi.create(payload)
    expect(res.data).toEqual(mockCustomer)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400", async () => {
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ name: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(
      customersApi.create({ name: "", customer_type: "company" })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

describe("customersApi.update", () => {
  it("hits PATCH /api/v1/customers/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/customers/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockCustomer, name: "Updated" })
      })
    )
    const res = await customersApi.update(1, { name: "Updated" })
    expect(res.data.name).toBe("Updated")
    expect(body).toEqual({ name: "Updated" })
  })
})

describe("customersApi.remove", () => {
  it("hits DELETE /api/v1/customers/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/customers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await customersApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/customers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(customersApi.remove(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
