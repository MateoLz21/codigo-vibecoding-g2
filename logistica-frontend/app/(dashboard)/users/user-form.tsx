"use client"

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
import { useCreateUser, useUpdateUser } from "@/lib/hooks/use-users"
import { useGroups } from "@/lib/hooks/use-groups"
import type { User } from "@/lib/types/user"

const createSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  group_ids: z.array(z.number()),
})

const editSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  group_ids: z.array(z.number()),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface UserFormProps {
  user?: User
  onSuccess: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const isEdit = !!user
  const { data: groupsData } = useGroups()
  const groups = groupsData?.results ?? []

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      username: user?.username ?? "",
      password: "",
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      group_ids: user?.groups.map((g) => g.id) ?? [],
    },
  })

  function toggleGroup(groupId: number) {
    const current = form.getValues("group_ids") as number[]
    const updated = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]
    form.setValue("group_ids", updated)
  }

  function onSubmit(values: CreateValues | EditValues) {
    const payload = {
      username: values.username,
      email: values.email || undefined,
      first_name: values.first_name || undefined,
      last_name: values.last_name || undefined,
      group_ids: values.group_ids,
      ...(values.password ? { password: values.password } : {}),
    }

    if (isEdit && user) {
      updateMutation.mutate({ id: user.id, data: payload }, { onSuccess })
    } else {
      createMutation.mutate(payload as Required<typeof payload> & { password: string }, { onSuccess })
    }
  }

  const selectedGroupIds = form.watch("group_ids") as number[]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input
                  placeholder="nombre.usuario"
                  {...field}
                  disabled={isEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contraseña
                {isEdit && (
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    (dejar vacío para no cambiar)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="usuario@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Roles</FormLabel>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay roles creados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => {
                const selected = selectedGroupIds.includes(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer select-none"
                    >
                      {group.name}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEdit
            ? "Guardar cambios"
            : "Crear usuario"}
        </Button>
      </form>
    </Form>
  )
}
