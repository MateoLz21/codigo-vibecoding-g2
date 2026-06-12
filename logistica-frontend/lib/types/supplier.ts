export interface Supplier {
  id: number
  name: string
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  contact_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierPayload {
  name: string
  tax_id?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  contact_name?: string | null
}
