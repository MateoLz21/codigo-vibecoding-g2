"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useShipment,
  useUpdateShipment,
  useDeleteShipmentItem,
} from "@/lib/hooks/use-shipments"
import type { ShipmentItem, ShipmentStatus } from "@/lib/types/shipment"
import { ItemForm } from "./item-form"

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  in_transit: { label: "En tránsito", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
}

export default function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = React.use(params)
  const shipmentId = Number(idStr)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShipmentItem | null>(null)

  const { data: shipment, isLoading } = useShipment(shipmentId)
  const updateMutation = useUpdateShipment()
  const deleteItemMutation = useDeleteShipmentItem(shipmentId)

  const handleEditItem = useCallback((item: ShipmentItem) => {
    setEditItem(item)
    setSheetOpen(true)
  }, [])

  const handleDeleteItem = useCallback(
    (itemId: number) => {
      if (window.confirm("¿Eliminar este ítem?")) {
        deleteItemMutation.mutate(itemId)
      }
    },
    [deleteItemMutation]
  )

  function openAddItem() {
    setEditItem(null)
    setSheetOpen(true)
  }

  function handleStatusChange(value: string | null) {
    if (!value || !shipment) return
    updateMutation.mutate({
      id: shipmentId,
      data: { status: value as ShipmentStatus },
    })
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Cargando...</p>
  }

  if (!shipment) {
    return <p className="text-muted-foreground p-4">Envío no encontrado.</p>
  }

  const statusCfg = STATUS_CONFIG[shipment.status]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/shipments">
          <Button variant="outline" size="sm">← Volver</Button>
        </Link>
        <h1 className="text-2xl font-semibold">Envío #{shipment.id}</h1>
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Cliente:</span>{" "}
          <span className="font-medium">{shipment.customer.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Almacén origen:</span>{" "}
          <span className="font-medium">{shipment.origin_warehouse.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Transporte:</span>{" "}
          <span className="font-medium">
            {shipment.transport?.plate_number ?? "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Ruta:</span>{" "}
          <span className="font-medium">{shipment.route?.name ?? "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Origen:</span>{" "}
          <span className="font-medium">{shipment.origin_address}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Destino:</span>{" "}
          <span className="font-medium">{shipment.destination_address}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Fecha envío:</span>{" "}
          <span className="font-medium">{shipment.shipping_date}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Entrega estimada:</span>{" "}
          <span className="font-medium">
            {shipment.estimated_delivery_date ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border p-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Peso total</p>
          <p className="text-lg font-semibold">{shipment.total_weight_kg} kg</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Costo de envío</p>
          <p className="text-lg font-semibold">S/ {shipment.shipping_cost}</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Cambiar estado</p>
          <Select
            value={shipment.status}
            onValueChange={handleStatusChange}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_transit">En tránsito</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Ítems</h2>
          <Button size="sm" onClick={openAddItem}>Agregar ítem</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio unit.</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ShipmentItemsRows
              shipmentId={shipmentId}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editItem ? "Editar ítem" : "Agregar ítem"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <ItemForm
              shipmentId={shipmentId}
              item={editItem ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ShipmentItemsRows({
  shipmentId,
  onEdit,
  onDelete,
}: {
  shipmentId: number
  onEdit: (item: ShipmentItem) => void
  onDelete: (id: number) => void
}) {
  const { data: shipment } = useShipment(shipmentId)
  const items = shipment?.items ?? []

  if (items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="text-center text-muted-foreground">
          Sin ítems registrados.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.product.name}</TableCell>
          <TableCell>{item.product.sku}</TableCell>
          <TableCell>{item.quantity}</TableCell>
          <TableCell>S/ {item.unit_price}</TableCell>
          <TableCell>S/ {item.subtotal}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item.id)}
              >
                Eliminar
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
