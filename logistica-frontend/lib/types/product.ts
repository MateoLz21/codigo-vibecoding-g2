export interface ProductFK {
  id: number
  name: string
}

export interface Product {
  id: number
  supplier: ProductFK
  warehouse: ProductFK
  name: string
  sku: string
  description: string | null
  weight_kg: string | null
  unit_price: string
  stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductPayload {
  supplier: number
  warehouse: number
  name: string
  sku: string
  description?: string | null
  weight_kg?: string | null
  unit_price: string
  stock?: number
}
