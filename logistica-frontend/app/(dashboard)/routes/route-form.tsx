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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateRoute, useUpdateRoute } from "@/lib/hooks/use-routes"
import { useWarehouses } from "@/lib/hooks/use-warehouses"
import type { Route } from "@/lib/types/route"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  estimated_duration_hours: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface RouteFormProps {
  route?: Route
  onSuccess: () => void
}

export function RouteForm({ route, onSuccess }: RouteFormProps) {
  const isEdit = !!route

  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute()
  const isPending = createMutation.isPending || updateMutation.isPending

  const { data: warehousesData } = useWarehouses({ page: 1 })
  const warehouses = warehousesData?.results ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: route?.name ?? "",
      origin_warehouse: route ? String(route.origin_warehouse.id) : "",
      estimated_duration_hours: route?.estimated_duration_hours ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      origin_warehouse: Number(values.origin_warehouse),
      estimated_duration_hours: values.estimated_duration_hours || null,
    }

    if (isEdit && route) {
      updateMutation.mutate({ id: route.id, data: payload }, { onSuccess })
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
                <Input placeholder="Ruta Lima Norte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="origin_warehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén origen</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar almacén">
                    {(val: string | null) =>
                      val
                        ? (warehouses.find((w) => String(w.id) === val)?.name ?? val)
                        : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="estimated_duration_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración estimada (h)</FormLabel>
              <FormControl>
                <Input placeholder="2.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear ruta"}
        </Button>
      </form>
    </Form>
  )
}
