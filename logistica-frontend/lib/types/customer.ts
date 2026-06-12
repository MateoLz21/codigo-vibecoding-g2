export type CustomerType = "company" | "individual"

export interface Customer {
  id: number
  name: string
  customer_type: CustomerType
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerPayload {
  name: string
  customer_type: CustomerType
  tax_id?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}
