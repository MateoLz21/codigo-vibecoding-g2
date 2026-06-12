import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { transportApi } from "@/lib/api/endpoints/transport"
import type { Transport } from "@/lib/types/transport"

const BASE = "http://localhost:8000"

const mockTransport: Transport = {
  id: 1,
  plate_number: "XYZ-789",
  vehicle_type: "van",
  brand: "Mercedes",
  model: "Sprinter",
  year: 2022,
  max_capacity_kg: "800.00",
  driver: null,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockTransport] }

describe("transportApi.list", () => {
  it("hits GET /api/v1/transport/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/`, () => HttpResponse.json(mockPage))
    )
    const res = await transportApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].plate_number).toBe("XYZ-789")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/transport/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await transportApi.list({ search: "XYZ" })
    expect(url).toContain("search=XYZ")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/transport/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await transportApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(transportApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("transportApi.getById", () => {
  it("hits GET /api/v1/transport/:id/", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/1/`, () => HttpResponse.json(mockTransport))
    )
    const res = await transportApi.getById(1)
    expect(res.data).toEqual(mockTransport)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/transport/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(transportApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("transportApi.create", () => {
  it("hits POST /api/v1/transport/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/transport/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockTransport, { status: 201 })
      })
    )
    const payload = {
      plate_number: "ABC-001",
      vehicle_type: "truck" as const,
      brand: "Toyota",
      model: "Hilux",
      year: 2020,
    }
    const res = await transportApi.create(payload)
    expect(res.data).toEqual(mockTransport)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400", async () => {
    server.use(
      http.post(`${BASE}/api/v1/transport/`, () =>
        HttpResponse.json({ plate_number: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(
      transportApi.create({ plate_number: "", vehicle_type: "truck", brand: "", model: "", year: 2020 })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

describe("transportApi.update", () => {
  it("hits PATCH /api/v1/transport/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/transport/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockTransport, brand: "Ford" })
      })
    )
    const res = await transportApi.update(1, { brand: "Ford" })
    expect(res.data.brand).toBe("Ford")
    expect(body).toEqual({ brand: "Ford" })
  })
})

describe("transportApi.remove", () => {
  it("hits DELETE /api/v1/transport/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/transport/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await transportApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/transport/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(transportApi.remove(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
