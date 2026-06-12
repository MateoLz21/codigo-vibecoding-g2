import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { Group } from "@/lib/types/user"

interface GroupPayload {
  name?: string
  permission_ids?: number[]
}

export const groupsApi = {
  list: () =>
    apiClient.get<DRFPage<Group>>("/api/v1/auth/groups/"),

  getById: (id: number) =>
    apiClient.get<Group>(`/api/v1/auth/groups/${id}/`),

  create: (data: GroupPayload) =>
    apiClient.post<Group>("/api/v1/auth/groups/", data),

  update: (id: number, data: Partial<GroupPayload>) =>
    apiClient.patch<Group>(`/api/v1/auth/groups/${id}/`, data),

  remove: (id: number) =>
    apiClient.delete(`/api/v1/auth/groups/${id}/`),
}
