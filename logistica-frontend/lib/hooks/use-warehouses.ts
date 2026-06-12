import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { warehousesApi } from "@/lib/api/endpoints/warehouses"
import type { WarehousePayload } from "@/lib/types/warehouse"

export function useWarehouses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => warehousesApi.list(params).then((r) => r.data),
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => warehousesApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WarehousePayload) =>
      warehousesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  })
}

export function useUpdateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WarehousePayload> }) =>
      warehousesApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  })
}

export function useDeleteWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehousesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  })
}
