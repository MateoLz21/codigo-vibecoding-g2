import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { driversApi } from "@/lib/api/endpoints/drivers"
import type { Driver } from "@/lib/types/driver"

const BASE = "http://localhost:8000"

const mockDriver: Driver = {
  id: 1,
  user: {
    id: 10,
    username: "carlos.gomez",
    first_name: "Carlos",
    last_name: "Gómez",
    email: "carlos@logistica.com",
  },
  license_number: "Q12345678",
  license_expiry: "2025-12-31",
  phone: "+51 999 000 111",
  is_available: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockDriver] }

describe("driversApi.list", () => {
  it("hits GET /api/v1/drivers/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage))
    )
    const res = await driversApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].license_number).toBe("Q12345678")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await driversApi.list({ search: "Carlos" })
    expect(url).toContain("search=Carlos")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await driversApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(driversApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("driversApi.getById", () => {
  it("hits GET /api/v1/drivers/:id/", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/1/`, () => HttpResponse.json(mockDriver))
    )
    const res = await driversApi.getById(1)
    expect(res.data).toEqual(mockDriver)
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/drivers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(driversApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("driversApi.create", () => {
  it("hits POST /api/v1/drivers/ with nested user payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/drivers/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockDriver, { status: 201 })
      })
    )
    const payload = {
      user: {
        username: "pedro.lopez",
        password: "secret123",
        first_name: "Pedro",
        last_name: "López",
        email: "pedro@test.com",
      },
      license_number: "Q99999999",
      license_expiry: "2026-06-30",
    }
    const res = await driversApi.create(payload)
    expect(res.data).toEqual(mockDriver)
    expect(body).toMatchObject(payload)
  })

  it("propagates 400", async () => {
    server.use(
      http.post(`${BASE}/api/v1/drivers/`, () =>
        HttpResponse.json({ license_number: ["This field is required."] }, { status: 400 })
      )
    )
    await expect(
      driversApi.create({
        user: { first_name: "", last_name: "", email: "" },
        license_number: "",
        license_expiry: "",
      })
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})

describe("driversApi.update", () => {
  it("hits PATCH /api/v1/drivers/:id/ with partial nested payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/drivers/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockDriver })
      })
    )
    const res = await driversApi.update(1, { user: { first_name: "Carlos Updated" } })
    expect(res.data.user.first_name).toBe("Carlos")
    expect(body).toEqual({ user: { first_name: "Carlos Updated" } })
  })
})

describe("driversApi.remove", () => {
  it("hits DELETE /api/v1/drivers/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/drivers/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await driversApi.remove(1)
    expect(res.status).toBe(204)
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/drivers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(driversApi.remove(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})
