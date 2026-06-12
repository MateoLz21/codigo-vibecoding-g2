import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Transport, TransportPayload } from "@/lib/types/transport"

export const transportApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Transport>>("/api/v1/transport/", { params }),

  getById: (id: number) =>
    apiClient.get<Transport>(`/api/v1/transport/${id}/`),

  create: (data: TransportPayload) =>
    apiClient.post<Transport>("/api/v1/transport/", data),

  update: (id: number, data: Partial<TransportPayload>) =>
    apiClient.patch<Transport>(`/api/v1/transport/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/transport/${id}/`),
}
