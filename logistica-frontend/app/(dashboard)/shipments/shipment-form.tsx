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
import { useCreateShipment, useUpdateShipment } from "@/lib/hooks/use-shipments"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useWarehouses } from "@/lib/hooks/use-warehouses"
import { useTransport } from "@/lib/hooks/use-transport"
import { useRoutes } from "@/lib/hooks/use-routes"
import type { Shipment } from "@/lib/types/shipment"

const schema = z.object({
  customer: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  transport: z.string().optional(),
  route: z.string().optional(),
  origin_address: z.string().min(1, "Requerido"),
  destination_address: z.string().min(1, "Requerido"),
  shipping_date: z.string().min(1, "Requerido"),
  estimated_delivery_date: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ShipmentFormProps {
  shipment?: Shipment
  onSuccess: () => void
}

export function ShipmentForm({ shipment, onSuccess }: ShipmentFormProps) {
  const isEdit = !!shipment

  const createMutation = useCreateShipment()
  const updateMutation = useUpdateShipment()
  const isPending = createMutation.isPending || updateMutation.isPending

  const { data: customersData } = useCustomers({ page: 1 })
  const { data: warehousesData } = useWarehouses({ page: 1 })
  const { data: transportData } = useTransport({ page: 1 })
  const { data: routesData } = useRoutes({ page: 1 })

  const customers = customersData?.results ?? []
  const warehouses = warehousesData?.results ?? []
  const transports = transportData?.results ?? []
  const routes = routesData?.results ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: shipment ? String(shipment.customer.id) : "",
      origin_warehouse: shipment ? String(shipment.origin_warehouse.id) : "",
      transport: shipment?.transport ? String(shipment.transport.id) : "",
      route: shipment?.route ? String(shipment.route.id) : "",
      origin_address: shipment?.origin_address ?? "",
      destination_address: shipment?.destination_address ?? "",
      shipping_date: shipment?.shipping_date ?? "",
      estimated_delivery_date: shipment?.estimated_delivery_date ?? "",
      notes: shipment?.notes ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      customer: Number(values.customer),
      origin_warehouse: Number(values.origin_warehouse),
      transport: values.transport ? Number(values.transport) : null,
      route: values.route ? Number(values.route) : null,
      origin_address: values.origin_address,
      destination_address: values.destination_address,
      shipping_date: values.shipping_date,
      estimated_delivery_date: values.estimated_delivery_date || null,
      notes: values.notes || null,
    }

    if (isEdit && shipment) {
      updateMutation.mutate({ id: shipment.id, data: payload }, { onSuccess })
    } else {
      createMutation.mutate(payload, { onSuccess })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cliente">
                    {(val: string | null) =>
                      val
                        ? (customers.find((c) => String(c.id) === val)?.name ?? val)
                        : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
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
          name="transport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transporte (opcional)</FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin transporte">
                    {(val: string | null) =>
                      val
                        ? (transports.find((t) => String(t.id) === val)?.plate_number ?? val)
                        : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin transporte</SelectItem>
                  {transports.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.plate_number}
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
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruta (opcional)</FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin ruta">
                    {(val: string | null) =>
                      val
                        ? (routes.find((r) => String(r.id) === val)?.name ?? val)
                        : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin ruta</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
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
          name="origin_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección origen</FormLabel>
              <FormControl>
                <Input placeholder="Av. Industrial 100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección destino</FormLabel>
              <FormControl>
                <Input placeholder="Jr. Comercio 456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shipping_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de envío</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimated_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entrega estimada</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Input placeholder="Instrucciones adicionales..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear envío"}
        </Button>
      </form>
    </Form>
  )
}
