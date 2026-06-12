export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface Group {
  id: number
  name: string
  permissions: Permission[]
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
  groups: Group[]
}

export interface UserPayload {
  username: string
  password?: string
  email?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  group_ids?: number[]
}
