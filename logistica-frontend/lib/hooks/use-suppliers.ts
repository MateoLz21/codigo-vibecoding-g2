import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { suppliersApi } from "@/lib/api/endpoints/suppliers"
import type { SupplierPayload } from "@/lib/types/supplier"

export function useSuppliers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => suppliersApi.list(params).then((r) => r.data),
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SupplierPayload) =>
      suppliersApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierPayload> }) =>
      suppliersApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}
