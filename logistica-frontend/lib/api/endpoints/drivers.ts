import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Driver, DriverPayload } from "@/lib/types/driver"

export const driversApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Driver>>("/api/v1/drivers/", { params }),

  getById: (id: number) =>
    apiClient.get<Driver>(`/api/v1/drivers/${id}/`),

  create: (data: DriverPayload) =>
    apiClient.post<Driver>("/api/v1/drivers/", data),

  update: (id: number, data: Partial<DriverPayload>) =>
    apiClient.patch<Driver>(`/api/v1/drivers/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/drivers/${id}/`),
}
