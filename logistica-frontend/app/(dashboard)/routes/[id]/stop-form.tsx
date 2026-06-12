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
import { useCreateRouteStop, useUpdateRouteStop } from "@/lib/hooks/use-routes"
import type { RouteStop } from "@/lib/types/route"

const schema = z.object({
  stop_order: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
      message: "Debe ser >= 1",
    }),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  estimated_arrival: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface StopFormProps {
  routeId: number
  stop?: RouteStop
  onSuccess: () => void
}

export function StopForm({ routeId, stop, onSuccess }: StopFormProps) {
  const isEdit = !!stop

  const createMutation = useCreateRouteStop(routeId)
  const updateMutation = useUpdateRouteStop(routeId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      stop_order: stop ? String(stop.stop_order) : "",
      address: stop?.address ?? "",
      city: stop?.city ?? "",
      latitude: stop?.latitude ?? "",
      longitude: stop?.longitude ?? "",
      estimated_arrival: stop?.estimated_arrival ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      stop_order: Number(values.stop_order),
      address: values.address,
      city: values.city,
      latitude: values.latitude || null,
      longitude: values.longitude || null,
      estimated_arrival: values.estimated_arrival || null,
    }

    if (isEdit && stop) {
      updateMutation.mutate({ stopId: stop.id, data: payload }, { onSuccess })
    } else {
      createMutation.mutate(payload, { onSuccess })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="stop_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden</FormLabel>
              <FormControl>
                <Input placeholder="1" {...field} />
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
                <Input placeholder="Av. Ejemplo 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="estimated_arrival"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Llegada estimada (HH:MM)</FormLabel>
              <FormControl>
                <Input placeholder="14:30" {...field} />
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
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar parada"}
        </Button>
      </form>
    </Form>
  )
}
