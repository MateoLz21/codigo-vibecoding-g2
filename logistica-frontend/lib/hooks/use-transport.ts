import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { transportApi } from "@/lib/api/endpoints/transport"
import type { TransportPayload } from "@/lib/types/transport"

export function useTransport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["transport", params],
    queryFn: () => transportApi.list(params).then((r) => r.data),
  })
}

export function useCreateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TransportPayload) =>
      transportApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport"] }),
  })
}

export function useUpdateTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransportPayload> }) =>
      transportApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport"] }),
  })
}

export function useDeleteTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => transportApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport"] }),
  })
}
