import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type {
  Shipment,
  ShipmentPayload,
  ShipmentItem,
  ShipmentItemPayload,
} from "@/lib/types/shipment"

export const shipmentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Shipment>>("/api/v1/shipments/", { params }),

  getById: (id: number) =>
    apiClient.get<Shipment>(`/api/v1/shipments/${id}/`),

  create: (data: ShipmentPayload) =>
    apiClient.post<Shipment>("/api/v1/shipments/", data),

  update: (id: number, data: Partial<ShipmentPayload>) =>
    apiClient.patch<Shipment>(`/api/v1/shipments/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/shipments/${id}/`),

  createItem: (shipmentId: number, data: ShipmentItemPayload) =>
    apiClient.post<ShipmentItem>(`/api/v1/shipments/${shipmentId}/items/`, data),

  updateItem: (shipmentId: number, itemId: number, data: Partial<ShipmentItemPayload>) =>
    apiClient.patch<ShipmentItem>(
      `/api/v1/shipments/${shipmentId}/items/${itemId}/`,
      data
    ),

  removeItem: (shipmentId: number, itemId: number) =>
    apiClient.delete(`/api/v1/shipments/${shipmentId}/items/${itemId}/`),
}
