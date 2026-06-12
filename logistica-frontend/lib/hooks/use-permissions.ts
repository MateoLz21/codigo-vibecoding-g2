import { useQuery } from "@tanstack/react-query"
import { permissionsApi } from "@/lib/api/endpoints/permissions"

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.list().then((r) => r.data),
  })
}
