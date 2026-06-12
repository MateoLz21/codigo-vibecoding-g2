import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Product, ProductPayload } from "@/lib/types/product"

export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Product>>("/api/v1/products/", { params }),

  getById: (id: number) =>
    apiClient.get<Product>(`/api/v1/products/${id}/`),

  create: (data: ProductPayload) =>
    apiClient.post<Product>("/api/v1/products/", data),

  update: (id: number, data: Partial<ProductPayload>) =>
    apiClient.patch<Product>(`/api/v1/products/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/products/${id}/`),
}
