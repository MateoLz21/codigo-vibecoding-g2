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
  useCreateShipmentItem,
  useUpdateShipmentItem,
} from "@/lib/hooks/use-shipments"
import { useProducts } from "@/lib/hooks/use-products"
import type { ShipmentItem } from "@/lib/types/shipment"

const schema = z.object({
  product: z.string().min(1, "Requerido"),
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, {
      message: "Mínimo 1",
    }),
})

type FormValues = z.infer<typeof schema>

interface ItemFormProps {
  shipmentId: number
  item?: ShipmentItem
  onSuccess: () => void
}

export function ItemForm({ shipmentId, item, onSuccess }: ItemFormProps) {
  const isEdit = !!item

  const createMutation = useCreateShipmentItem(shipmentId)
  const updateMutation = useUpdateShipmentItem(shipmentId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const { data: productsData } = useProducts({ page: 1 })
  const products = productsData?.results ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product: item ? String(item.product.id) : "",
      quantity: item ? String(item.quantity) : "1",
    },
  })

  function onSubmit(values: FormValues) {
    if (isEdit && item) {
      updateMutation.mutate(
        { itemId: item.id, data: { quantity: Number(values.quantity) } },
        { onSuccess }
      )
    } else {
      createMutation.mutate(
        { product: Number(values.product), quantity: Number(values.quantity) },
        { onSuccess }
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar producto">
                    {(val: string | null) => {
                      if (!val) return undefined
                      const p = products.find((p) => String(p.id) === val)
                      return p ? `${p.name} (${p.sku})` : val
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isEdit ? (
                    <SelectItem value={String(item.product.id)}>
                      {item.product.name} ({item.product.sku})
                    </SelectItem>
                  ) : (
                    products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isEdit && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Precio unit.: <span className="font-medium">S/ {item.unit_price}</span></p>
            <p>Subtotal: <span className="font-medium">S/ {item.subtotal}</span></p>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar ítem"}
        </Button>
      </form>
    </Form>
  )
}
