export interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  latitude: string | null
  longitude: string | null
  capacity_m3: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehousePayload {
  name: string
  address: string
  city: string
  country: string
  latitude?: string | null
  longitude?: string | null
  capacity_m3?: string | null
}
