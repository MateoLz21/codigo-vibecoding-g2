import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { shipmentsApi } from "@/lib/api/endpoints/shipments"
import type { ShipmentPayload, ShipmentItemPayload } from "@/lib/types/shipment"

export function useShipments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => shipmentsApi.list(params).then((r) => r.data),
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentsApi.getById(id).then((r) => r.data),
    enabled: id > 0,
  })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentPayload) =>
      shipmentsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipments"] }),
  })
}

export function useUpdateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShipmentPayload> }) =>
      shipmentsApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["shipments"] })
      qc.invalidateQueries({ queryKey: ["shipment", id] })
    },
  })
}

export function useDeleteShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipments"] }),
  })
}

export function useCreateShipmentItem(shipmentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentItemPayload) =>
      shipmentsApi.createItem(shipmentId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipment", shipmentId] }),
  })
}

export function useUpdateShipmentItem(shipmentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number
      data: Partial<ShipmentItemPayload>
    }) => shipmentsApi.updateItem(shipmentId, itemId, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipment", shipmentId] }),
  })
}

export function useDeleteShipmentItem(shipmentId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => shipmentsApi.removeItem(shipmentId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipment", shipmentId] }),
  })
}
