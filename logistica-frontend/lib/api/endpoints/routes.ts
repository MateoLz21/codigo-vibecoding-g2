import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Route, RoutePayload, RouteStop, RouteStopPayload } from "@/lib/types/route"

export const routesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Route>>("/api/v1/routes/", { params }),

  getById: (id: number) =>
    apiClient.get<Route>(`/api/v1/routes/${id}/`),

  create: (data: RoutePayload) =>
    apiClient.post<Route>("/api/v1/routes/", data),

  update: (id: number, data: Partial<RoutePayload>) =>
    apiClient.patch<Route>(`/api/v1/routes/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/routes/${id}/`),

  createStop: (routeId: number, data: RouteStopPayload) =>
    apiClient.post<RouteStop>(`/api/v1/routes/${routeId}/stops/`, data),

  updateStop: (routeId: number, stopId: number, data: Partial<RouteStopPayload>) =>
    apiClient.patch<RouteStop>(`/api/v1/routes/${routeId}/stops/${stopId}/`, data),

  removeStop: (routeId: number, stopId: number) =>
    apiClient.delete(`/api/v1/routes/${routeId}/stops/${stopId}/`),
}
