import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { routesApi } from "@/lib/api/endpoints/routes"
import type { Route, RouteStop } from "@/lib/types/route"

const BASE = "http://localhost:8000"

const mockStop: RouteStop = {
  id: 10,
  route: 1,
  stop_order: 1,
  address: "Av. Lima 100",
  city: "Lima",
  latitude: null,
  longitude: null,
  estimated_arrival: null,
}

const mockRoute: Route = {
  id: 1,
  name: "Ruta Lima Norte",
  origin_warehouse: { id: 3, name: "Almacén Central" },
  estimated_duration_hours: "2.50",
  is_active: true,
  stops: [mockStop],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockRoute] }

// ─── Route CRUD ───────────────────────────────────────────────────────────────

describe("routesApi.list", () => {
  it("hits GET /api/v1/routes/ and returns DRFPage", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockPage))
    )
    const res = await routesApi.list()
    expect(res.data.results).toHaveLength(1)
    expect(res.data.results[0].name).toBe("Ruta Lima Norte")
  })

  it("passes ?search= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/routes/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await routesApi.list({ search: "Lima" })
    expect(url).toContain("search=Lima")
  })

  it("passes ?page= in query string", async () => {
    let url: string | null = null
    server.use(
      http.get(`${BASE}/api/v1/routes/`, ({ request }) => {
        url = request.url
        return HttpResponse.json(mockPage)
      })
    )
    await routesApi.list({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    await expect(routesApi.list()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe("routesApi.getById", () => {
  it("hits GET /api/v1/routes/:id/ and includes stops", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/1/`, () => HttpResponse.json(mockRoute))
    )
    const res = await routesApi.getById(1)
    expect(res.data.stops).toHaveLength(1)
    expect(res.data.stops[0].city).toBe("Lima")
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 })
      )
    )
    await expect(routesApi.getById(999)).rejects.toMatchObject({ response: { status: 404 } })
  })
})

describe("routesApi.create", () => {
  it("hits POST /api/v1/routes/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/routes/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockRoute, { status: 201 })
      })
    )
    const payload = { name: "Nueva Ruta", origin_warehouse: 3 }
    const res = await routesApi.create(payload)
    expect(res.data.name).toBe("Ruta Lima Norte")
    expect(body).toMatchObject(payload)
  })
})

describe("routesApi.update", () => {
  it("hits PATCH /api/v1/routes/:id/ with partial payload", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/routes/1/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockRoute, name: "Ruta Actualizada" })
      })
    )
    const res = await routesApi.update(1, { name: "Ruta Actualizada" })
    expect(res.data.name).toBe("Ruta Actualizada")
    expect(body).toEqual({ name: "Ruta Actualizada" })
  })
})

describe("routesApi.remove", () => {
  it("hits DELETE /api/v1/routes/:id/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/routes/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await routesApi.remove(1)
    expect(res.status).toBe(204)
  })
})

// ─── Stop CRUD ────────────────────────────────────────────────────────────────

describe("routesApi.createStop", () => {
  it("hits POST /api/v1/routes/:id/stops/ with payload", async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/api/v1/routes/1/stops/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mockStop, { status: 201 })
      })
    )
    const payload = { stop_order: 2, address: "Jr. Callao 50", city: "Callao" }
    const res = await routesApi.createStop(1, payload)
    expect(res.data.city).toBe("Lima")
    expect(body).toMatchObject(payload)
  })
})

describe("routesApi.updateStop", () => {
  it("hits PATCH /api/v1/routes/:id/stops/:stopId/", async () => {
    let body: unknown = null
    server.use(
      http.patch(`${BASE}/api/v1/routes/1/stops/10/`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...mockStop, city: "Callao" })
      })
    )
    const res = await routesApi.updateStop(1, 10, { city: "Callao" })
    expect(res.data.city).toBe("Callao")
    expect(body).toEqual({ city: "Callao" })
  })
})

describe("routesApi.removeStop", () => {
  it("hits DELETE /api/v1/routes/:id/stops/:stopId/ → 204", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/routes/1/stops/10/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const res = await routesApi.removeStop(1, 10)
    expect(res.status).toBe(204)
  })
})
