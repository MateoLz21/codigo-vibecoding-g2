import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { driversApi } from "@/lib/api/endpoints/drivers"
import type { DriverPayload } from "@/lib/types/driver"

export function useDrivers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: () => driversApi.list(params).then((r) => r.data),
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DriverPayload) =>
      driversApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DriverPayload> }) =>
      driversApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  })
}

export function useDeleteDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => driversApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  })
}
