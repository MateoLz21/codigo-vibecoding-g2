export interface RouteWarehouse {
  id: number
  name: string
}

export interface RouteStop {
  id: number
  route: number
  stop_order: number
  address: string
  city: string
  latitude: string | null
  longitude: string | null
  estimated_arrival: string | null
}

export interface Route {
  id: number
  name: string
  origin_warehouse: RouteWarehouse
  estimated_duration_hours: string | null
  is_active: boolean
  stops: RouteStop[]
  created_at: string
  updated_at: string
}

export interface RoutePayload {
  name: string
  origin_warehouse: number
  estimated_duration_hours?: string | null
}

export interface RouteStopPayload {
  stop_order: number
  address: string
  city: string
  latitude?: string | null
  longitude?: string | null
  estimated_arrival?: string | null
}
