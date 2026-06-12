"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useCreateGroup, useUpdateGroup } from "@/lib/hooks/use-groups"
import { usePermissions } from "@/lib/hooks/use-permissions"
import type { Group, Permission } from "@/lib/types/user"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  permission_ids: z.array(z.number()),
})

type FormValues = z.infer<typeof schema>

interface RoleFormProps {
  group?: Group
  onSuccess: () => void
}

function groupPermissionsByApp(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const key = perm.app_label
    if (!acc[key]) acc[key] = []
    acc[key].push(perm)
    return acc
  }, {})
}

const APP_LABELS: Record<string, string> = {
  customers: "Clientes",
  drivers: "Conductores",
  products: "Productos",
  routes: "Rutas",
  shipments: "Envíos",
  suppliers: "Proveedores",
  transport: "Transporte",
  warehouses: "Almacenes",
}

export function RoleForm({ group, onSuccess }: RoleFormProps) {
  const isEdit = !!group
  const { data: permissions = [] } = usePermissions()
  const grouped = useMemo(() => groupPermissionsByApp(permissions), [permissions])

  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: group?.name ?? "",
      permission_ids: group?.permissions.map((p) => p.id) ?? [],
    },
  })

  const selectedIds = form.watch("permission_ids")

  function togglePermission(permId: number) {
    const current = form.getValues("permission_ids")
    const updated = current.includes(permId)
      ? current.filter((id) => id !== permId)
      : [...current, permId]
    form.setValue("permission_ids", updated)
  }

  function toggleAppAll(appPerms: Permission[]) {
    const current = form.getValues("permission_ids")
    const appIds = appPerms.map((p) => p.id)
    const allSelected = appIds.every((id) => current.includes(id))
    const updated = allSelected
      ? current.filter((id) => !appIds.includes(id))
      : [...new Set([...current, ...appIds])]
    form.setValue("permission_ids", updated)
  }

  function onSubmit(values: FormValues) {
    const payload = { name: values.name, permission_ids: values.permission_ids }
    if (isEdit && group) {
      updateMutation.mutate({ id: group.id, data: payload }, { onSuccess })
    } else {
      createMutation.mutate(payload, { onSuccess })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del rol</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Operadores, Conductores..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel>Permisos</FormLabel>
          {permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cargando permisos...</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(grouped).sort().map(([appLabel, appPerms]) => {
                const allSelected = appPerms.every((p) => selectedIds.includes(p.id))
                return (
                  <div key={appLabel} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {APP_LABELS[appLabel] ?? appLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAppAll(appPerms)}
                        className="text-xs text-primary hover:underline"
                      >
                        {allSelected ? "Quitar todos" : "Seleccionar todos"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {appPerms.map((perm) => {
                        const selected = selectedIds.includes(perm.id)
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => togglePermission(perm.id)}
                            className="focus:outline-none"
                          >
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className="cursor-pointer select-none text-xs"
                            >
                              {perm.name}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear rol"}
        </Button>
      </form>
    </Form>
  )
}
