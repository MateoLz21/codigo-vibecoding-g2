import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Customer, CustomerPayload } from "@/lib/types/customer"

export const customersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Customer>>("/api/v1/customers/", { params }),

  getById: (id: number) =>
    apiClient.get<Customer>(`/api/v1/customers/${id}/`),

  create: (data: CustomerPayload) =>
    apiClient.post<Customer>("/api/v1/customers/", data),

  update: (id: number, data: Partial<CustomerPayload>) =>
    apiClient.patch<Customer>(`/api/v1/customers/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/customers/${id}/`),
}
