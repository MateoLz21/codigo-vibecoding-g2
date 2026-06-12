export interface DriverUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
}

export interface Driver {
  id: number
  user: DriverUser
  license_number: string
  license_expiry: string
  phone: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface DriverUserPayload {
  username?: string
  password?: string
  first_name: string
  last_name: string
  email: string
}

export interface DriverPayload {
  user: DriverUserPayload
  license_number: string
  license_expiry: string
  phone?: string | null
  is_available?: boolean
}
