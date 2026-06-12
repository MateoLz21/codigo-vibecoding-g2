import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { groupsApi } from "@/lib/api/endpoints/groups"

interface GroupPayload {
  name?: string
  permission_ids?: number[]
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list().then((r) => r.data),
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GroupPayload) => groupsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GroupPayload> }) =>
      groupsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => groupsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  })
}
