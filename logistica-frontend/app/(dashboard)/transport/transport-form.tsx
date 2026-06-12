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
import {
  useCreateTransport,
  useUpdateTransport,
} from "@/lib/hooks/use-transport"
import type { Transport } from "@/lib/types/transport"

const schema = z.object({
  plate_number: z.string().min(1, "Requerido"),
  vehicle_type: z.enum(["truck", "van", "motorcycle"]),
  brand: z.string().min(1, "Requerido"),
  model: z.string().min(1, "Requerido"),
  year: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1900, {
      message: "Año inválido",
    }),
  max_capacity_kg: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TransportFormProps {
  transport?: Transport
  onSuccess: () => void
}

export function TransportForm({ transport, onSuccess }: TransportFormProps) {
  const isEdit = !!transport

  const createMutation = useCreateTransport()
  const updateMutation = useUpdateTransport()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plate_number: transport?.plate_number ?? "",
      vehicle_type: transport?.vehicle_type ?? "truck",
      brand: transport?.brand ?? "",
      model: transport?.model ?? "",
      year: transport?.year ? String(transport.year) : "",
      max_capacity_kg: transport?.max_capacity_kg ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      plate_number: values.plate_number,
      vehicle_type: values.vehicle_type,
      brand: values.brand,
      model: values.model,
      year: Number(values.year),
      max_capacity_kg: values.max_capacity_kg || null,
    }

    if (isEdit && transport) {
      updateMutation.mutate(
        { id: transport.id, data: payload },
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
          name="plate_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="ABC-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicle_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de vehículo</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Camión</SelectItem>
                  <SelectItem value="van">Furgoneta</SelectItem>
                  <SelectItem value="motorcycle">Moto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Hilux" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año</FormLabel>
                <FormControl>
                  <Input placeholder="2020" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_capacity_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cap. máx. (kg)</FormLabel>
                <FormControl>
                  <Input placeholder="1000.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear vehículo"}
        </Button>
      </form>
    </Form>
  )
}
