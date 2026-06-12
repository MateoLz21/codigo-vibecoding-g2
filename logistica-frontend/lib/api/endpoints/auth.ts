import axios from "axios"
import { apiClient } from "@/lib/api/client"
import type { LoginPayload, TokenResponse } from "@/lib/types/auth"
import type { User } from "@/lib/types/user"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const authApi = {
  login: (payload: LoginPayload) =>
    axios.post<TokenResponse>(`${BASE}/api/v1/auth/token/`, payload),

  refreshToken: (refresh: string) =>
    axios.post<Pick<TokenResponse, "access">>(`${BASE}/api/v1/auth/token/refresh/`, { refresh }),

  me: () =>
    apiClient.get<User>("/api/v1/auth/users/me/"),
}
