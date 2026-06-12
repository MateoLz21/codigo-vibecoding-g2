import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Warehouse, WarehousePayload } from "@/lib/types/warehouse"

export const warehousesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Warehouse>>("/api/v1/warehouses/", { params }),

  getById: (id: number) =>
    apiClient.get<Warehouse>(`/api/v1/warehouses/${id}/`),

  create: (data: WarehousePayload) =>
    apiClient.post<Warehouse>("/api/v1/warehouses/", data),

  update: (id: number, data: Partial<WarehousePayload>) =>
    apiClient.patch<Warehouse>(`/api/v1/warehouses/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/warehouses/${id}/`),
}
