export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "cancelled"

export interface ShipmentCustomer {
  id: number
  name: string
}

export interface ShipmentTransport {
  id: number
  plate_number: string
}

export interface ShipmentRoute {
  id: number
  name: string
}

export interface ShipmentWarehouse {
  id: number
  name: string
}

export interface ShipmentProduct {
  id: number
  name: string
  sku: string
}

export interface ShipmentItem {
  id: number
  shipment: number
  product: ShipmentProduct
  quantity: number
  unit_price: string
  subtotal: string
}

export interface Shipment {
  id: number
  customer: ShipmentCustomer
  transport: ShipmentTransport | null
  route: ShipmentRoute | null
  origin_warehouse: ShipmentWarehouse
  status: ShipmentStatus
  origin_address: string
  destination_address: string
  shipping_date: string
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  total_weight_kg: string
  shipping_cost: string
  notes: string | null
  is_active: boolean
  items?: ShipmentItem[]
  created_at: string
  updated_at: string
}

export interface ShipmentPayload {
  customer?: number
  origin_warehouse?: number
  transport?: number | null
  route?: number | null
  status?: ShipmentStatus
  origin_address?: string
  destination_address?: string
  shipping_date?: string
  estimated_delivery_date?: string | null
  actual_delivery_date?: string | null
  notes?: string | null
}

export interface ShipmentItemPayload {
  product: number
  quantity: number
}
