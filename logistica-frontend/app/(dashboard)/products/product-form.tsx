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
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-products"
import { useSuppliers } from "@/lib/hooks/use-suppliers"
import { useWarehouses } from "@/lib/hooks/use-warehouses"
import type { Product } from "@/lib/types/product"

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  sku: z.string().min(1, "Requerido"),
  supplier: z.string().min(1, "Requerido"),
  warehouse: z.string().min(1, "Requerido"),
  unit_price: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Debe ser mayor a 0",
    }),
  stock: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Debe ser >= 0",
    }),
  description: z.string().optional(),
  weight_kg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Debe ser un número >= 0",
    }),
})

type FormValues = z.infer<typeof schema>

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const isPending = createMutation.isPending || updateMutation.isPending

  const { data: suppliersData } = useSuppliers({ page: 1 })
  const { data: warehousesData } = useWarehouses({ page: 1 })
  const suppliers = suppliersData?.results ?? []
  const warehouses = warehousesData?.results ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      supplier: product ? String(product.supplier.id) : "",
      warehouse: product ? String(product.warehouse.id) : "",
      unit_price: product?.unit_price ?? "",
      stock: product !== undefined ? String(product.stock) : "0",
      description: product?.description ?? "",
      weight_kg: product?.weight_kg ?? "0",
    },
  })

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      sku: values.sku,
      supplier: Number(values.supplier),
      warehouse: Number(values.warehouse),
      unit_price: values.unit_price,
      stock: values.stock ? Number(values.stock) : 0,
      description: values.description || null,
      weight_kg: values.weight_kg,
    }

    if (isEdit && product) {
      updateMutation.mutate({ id: product.id, data: payload }, { onSuccess })
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
                <Input placeholder="Laptop HP 15" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="LAP-HP-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar proveedor">
                    {(val: string | null) =>
                      val
                        ? (suppliers.find((s) => String(s.id) === val)?.name ?? val)
                        : undefined
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
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
          name="warehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén</FormLabel>
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio unitario</FormLabel>
                <FormControl>
                  <Input placeholder="99.90" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="weight_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <Input placeholder="1.50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Descripción del producto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </form>
    </Form>
  )
}
