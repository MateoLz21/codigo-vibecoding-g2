"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useCreateDriver, useUpdateDriver } from "@/lib/hooks/use-drivers"
import type { Driver } from "@/lib/types/driver"

const createSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  license_number: z.string().min(1, "Requerido"),
  license_expiry: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  is_available: z.boolean(),
})

const editSchema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  license_number: z.string().min(1, "Requerido"),
  license_expiry: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  is_available: z.boolean(),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface DriverFormProps {
  driver?: Driver
  onSuccess: () => void
}

export function DriverForm({ driver, onSuccess }: DriverFormProps) {
  const isEdit = !!driver

  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const isPending = createMutation.isPending || updateMutation.isPending

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
      license_number: "",
      license_expiry: "",
      phone: "",
      is_available: true,
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: driver?.user.first_name ?? "",
      last_name: driver?.user.last_name ?? "",
      email: driver?.user.email ?? "",
      license_number: driver?.license_number ?? "",
      license_expiry: driver?.license_expiry ?? "",
      phone: driver?.phone ?? "",
      is_available: driver?.is_available ?? true,
    },
  })

  function onCreateSubmit(values: CreateValues) {
    createMutation.mutate(
      {
        user: {
          username: values.username,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
        },
        license_number: values.license_number,
        license_expiry: values.license_expiry,
        phone: values.phone || null,
        is_available: values.is_available,
      },
      { onSuccess }
    )
  }

  function onEditSubmit(values: EditValues) {
    if (!driver) return
    updateMutation.mutate(
      {
        id: driver.id,
        data: {
          user: {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
          },
          license_number: values.license_number,
          license_expiry: values.license_expiry,
          phone: values.phone || null,
          is_available: values.is_available,
        },
      },
      { onSuccess }
    )
  }

  if (isEdit) {
    return (
      <Form {...editForm}>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={editForm.control}
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
              control={editForm.control}
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
          <FormField
            control={editForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Licencia</FormLabel>
                <FormControl>
                  <Input placeholder="Q12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento licencia</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+51 999 999 999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="is_available"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="is_available_edit"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel htmlFor="is_available_edit">Disponible</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Form>
    )
  }

  return (
    <Form {...createForm}>
      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Datos de acceso</p>
        <FormField
          control={createForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="juan.perez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm font-medium text-muted-foreground">Datos personales</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={createForm.control}
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
            control={createForm.control}
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
        <FormField
          control={createForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="juan@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm font-medium text-muted-foreground">Datos del conductor</p>
        <FormField
          control={createForm.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° Licencia</FormLabel>
              <FormControl>
                <Input placeholder="Q12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="license_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimiento licencia</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+51 999 999 999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={createForm.control}
          name="is_available"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    id="is_available_create"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <FormLabel htmlFor="is_available_create">Disponible</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : "Crear conductor"}
        </Button>
      </form>
    </Form>
  )
}
