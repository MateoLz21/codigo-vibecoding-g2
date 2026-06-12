import { useQuery } from "@tanstack/react-query"
import { authApi } from "@/lib/api/endpoints/auth"
import { useAuthStore } from "@/lib/stores/auth.store"

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me().then((r) => r.data),
    enabled: !!accessToken,
  })
}
