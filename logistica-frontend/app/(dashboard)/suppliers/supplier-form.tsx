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
  useCreateSupplier,
  useUpdateSupplier,
} from "@/lib/hooks/use-suppliers"
import type { Supplier } from "@/lib/types/supplier"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  tax_id: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface SupplierFormProps {
  supplier?: Supplier
  onSuccess: () => void
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const isEdit = !!supplier

  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier?.name ?? "",
      tax_id: supplier?.tax_id ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      contact_name: supplier?.contact_name ?? "",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      tax_id: values.tax_id || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      contact_name: values.contact_name || null,
    }

    if (isEdit && supplier) {
      updateMutation.mutate(
        { id: supplier.id, data: payload },
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
                <Input placeholder="Proveedor S.A." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de contacto</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez" {...field} />
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
                <Input type="email" placeholder="contacto@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
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
          control={form.control}
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUC / Tax ID</FormLabel>
              <FormControl>
                <Input placeholder="20123456789" {...field} />
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
                <Input placeholder="Av. Industrial 456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </form>
    </Form>
  )
}
