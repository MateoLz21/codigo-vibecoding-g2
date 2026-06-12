import { apiClient } from "@/lib/api/client"
import type { Permission } from "@/lib/types/user"

export const permissionsApi = {
  list: () =>
    apiClient.get<Permission[]>("/api/v1/auth/permissions/"),
}
