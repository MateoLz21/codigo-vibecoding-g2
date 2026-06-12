import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customersApi } from "@/lib/api/endpoints/customers"
import type { CustomerPayload } from "@/lib/types/customer"

export function useCustomers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customersApi.list(params).then((r) => r.data),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CustomerPayload) =>
      customersApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerPayload> }) =>
      customersApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}
