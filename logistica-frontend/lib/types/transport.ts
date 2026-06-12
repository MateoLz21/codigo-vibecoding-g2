export type VehicleType = "truck" | "van" | "motorcycle"

export interface Transport {
  id: number
  plate_number: string
  vehicle_type: VehicleType
  brand: string
  model: string
  year: number
  max_capacity_kg: string | null
  driver: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TransportPayload {
  plate_number: string
  vehicle_type: VehicleType
  brand: string
  model: string
  year: number
  max_capacity_kg?: string | null
}
