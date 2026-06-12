import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { User, UserPayload } from "@/lib/types/user"

export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<User>>("/api/v1/auth/users/", { params }),

  getById: (id: number) =>
    apiClient.get<User>(`/api/v1/auth/users/${id}/`),

  create: (data: UserPayload) =>
    apiClient.post<User>("/api/v1/auth/users/", data),

  update: (id: number, data: Partial<UserPayload>) =>
    apiClient.patch<User>(`/api/v1/auth/users/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/auth/users/${id}/`),

  assignGroups: (id: number, group_ids: number[]) =>
    apiClient.post<User>(`/api/v1/auth/users/${id}/assign-groups/`, { group_ids }),
}
