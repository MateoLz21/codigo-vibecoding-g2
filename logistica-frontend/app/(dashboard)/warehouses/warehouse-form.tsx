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
import {
  useCreateWarehouse,
  useUpdateWarehouse,
} from "@/lib/hooks/use-warehouses"
import type { Warehouse } from "@/lib/types/warehouse"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  country: z.string().min(1, "Requerido"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  capacity_m3: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface WarehouseFormProps {
  warehouse?: Warehouse
  onSuccess: () => void
}

export function WarehouseForm({ warehouse, onSuccess }: WarehouseFormProps) {
  const isEdit = !!warehouse

  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: warehouse?.name ?? "",
      address: warehouse?.address ?? "",
      city: warehouse?.city ?? "",
      country: warehouse?.country ?? "Peru",
      latitude: warehouse?.latitude ?? "",
      longitude: warehouse?.longitude ?? "",
      capacity_m3: warehouse?.capacity_m3 ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      address: values.address,
      city: values.city,
      country: values.country,
      latitude: values.latitude || null,
      longitude: values.longitude || null,
      capacity_m3: values.capacity_m3 || null,
    }

    if (isEdit && warehouse) {
      updateMutation.mutate(
        { id: warehouse.id, data: payload },
        { onSuccess }
      )
    } else {
      createMutation.mutate(payload, { onSuccess })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Almacén Central" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Av. Principal 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Lima" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input placeholder="Peru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="capacity_m3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (m³)</FormLabel>
              <FormControl>
                <Input placeholder="500.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input placeholder="-12.046374" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input placeholder="-77.042793" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear almacén"}
        </Button>
      </form>
    </Form>
  )
}
