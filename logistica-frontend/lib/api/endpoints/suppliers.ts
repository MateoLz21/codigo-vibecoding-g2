import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Supplier, SupplierPayload } from "@/lib/types/supplier"

export const suppliersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Supplier>>("/api/v1/suppliers/", { params }),

  getById: (id: number) =>
    apiClient.get<Supplier>(`/api/v1/suppliers/${id}/`),

  create: (data: SupplierPayload) =>
    apiClient.post<Supplier>("/api/v1/suppliers/", data),

  update: (id: number, data: Partial<SupplierPayload>) =>
    apiClient.patch<Supplier>(`/api/v1/suppliers/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/suppliers/${id}/`),
}
