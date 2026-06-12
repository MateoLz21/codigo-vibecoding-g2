import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { routesApi } from "@/lib/api/endpoints/routes"
import type { RoutePayload, RouteStopPayload } from "@/lib/types/route"

export function useRoutes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: () => routesApi.list(params).then((r) => r.data),
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ["route", id],
    queryFn: () => routesApi.getById(id).then((r) => r.data),
    enabled: id > 0,
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RoutePayload) =>
      routesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoutePayload> }) =>
      routesApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      qc.invalidateQueries({ queryKey: ["route", id] })
    },
  })
}

export function useDeleteRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => routesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
  })
}

export function useCreateRouteStop(routeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RouteStopPayload) =>
      routesApi.createStop(routeId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route", routeId] }),
  })
}

export function useUpdateRouteStop(routeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: Partial<RouteStopPayload> }) =>
      routesApi.updateStop(routeId, stopId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route", routeId] }),
  })
}

export function useDeleteRouteStop(routeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stopId: number) => routesApi.removeStop(routeId, stopId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route", routeId] }),
  })
}
