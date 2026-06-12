import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { renderHookWithQuery } from "@/test/utils/renderWithQuery"
import {
  useRoutes,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
} from "@/lib/hooks/use-routes"
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
  stops: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockPage = { count: 1, next: null, previous: null, results: [mockRoute] }

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

// ─── useRoutes ────────────────────────────────────────────────────────────────

describe("useRoutes", () => {
  it("isPending=true initially, then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockPage))
    )
    const { result } = renderHookWithQuery(() => useRoutes())
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Ruta Lima Norte")
  })

  it("sets isError on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/`, () =>
        HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
      )
    )
    const { result } = renderHookWithQuery(() => useRoutes())
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useRoute (single) ────────────────────────────────────────────────────────

describe("useRoute", () => {
  it("fetches single route by id", async () => {
    server.use(
      http.get(`${BASE}/api/v1/routes/1/`, () => HttpResponse.json(mockRoute))
    )
    const { result } = renderHookWithQuery(() => useRoute(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe("Ruta Lima Norte")
  })

  it("is disabled and never fetches when id=0", async () => {
    const { result } = renderHookWithQuery(() => useRoute(0))
    // enabled: id > 0 — fetchStatus stays idle, never fires a request
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"))
    expect(result.current.data).toBeUndefined()
  })
})

// ─── Route mutations ──────────────────────────────────────────────────────────

describe("useCreateRoute", () => {
  it("calls POST and invalidates ['routes'] on success", async () => {
    server.use(
      http.post(`${BASE}/api/v1/routes/`, () =>
        HttpResponse.json(mockRoute, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ name: "Nueva Ruta", origin_warehouse: 3 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] })
    )
  })
})

describe("useUpdateRoute", () => {
  it("calls PATCH and invalidates both ['routes'] and ['route', id]", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/routes/1/`, () =>
        HttpResponse.json({ ...mockRoute, name: "Updated" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateRoute(), { wrapper: makeWrapper(qc) })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] })
    )
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["route", 1] })
    )
  })
})

describe("useDeleteRoute", () => {
  it("calls DELETE and invalidates ['routes'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/routes/1/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: makeWrapper(qc) })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["routes"] })
    )
  })
})

// ─── Stop mutations ───────────────────────────────────────────────────────────

describe("useCreateRouteStop", () => {
  it("calls POST stop and invalidates ['route', routeId]", async () => {
    server.use(
      http.post(`${BASE}/api/v1/routes/1/stops/`, () =>
        HttpResponse.json(mockStop, { status: 201 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateRouteStop(1), { wrapper: makeWrapper(qc) })

    result.current.mutate({ stop_order: 1, address: "Av. Lima 100", city: "Lima" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["route", 1] })
    )
  })
})

describe("useUpdateRouteStop", () => {
  it("calls PATCH stop and invalidates ['route', routeId]", async () => {
    server.use(
      http.patch(`${BASE}/api/v1/routes/1/stops/10/`, () =>
        HttpResponse.json({ ...mockStop, city: "Callao" })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateRouteStop(1), { wrapper: makeWrapper(qc) })

    result.current.mutate({ stopId: 10, data: { city: "Callao" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["route", 1] })
    )
  })
})

describe("useDeleteRouteStop", () => {
  it("calls DELETE stop and invalidates ['route', routeId]", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/routes/1/stops/10/`, () =>
        new HttpResponse(null, { status: 204 })
      )
    )
    const qc = makeQC()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteRouteStop(1), { wrapper: makeWrapper(qc) })

    result.current.mutate(10)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["route", 1] })
    )
  })
})
