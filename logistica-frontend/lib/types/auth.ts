export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
  is_superuser: boolean
  username: string
  email: string
}

export interface AuthUser {
  username: string
  email: string
  is_superuser: boolean
}
