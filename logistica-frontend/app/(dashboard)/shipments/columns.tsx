"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Shipment, ShipmentStatus } from "@/lib/types/shipment"

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; className: string }> = {
  pending:    { label: "Pendiente",    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  in_transit: { label: "En tránsito", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"   },
  delivered:  { label: "Entregado",   className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled:  { label: "Cancelado",   className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"       },
}

interface ColumnOptions {
  onDelete: (id: number) => void
}

export function getColumns({ onDelete }: ColumnOptions): ColumnDef<Shipment>[] {
  return [
    {
      id: "customer",
      header: "Cliente",
      cell: ({ row }) => row.original.customer.name,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status]
        return <Badge className={cfg.className}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: "shipping_date",
      header: "Fecha envío",
    },
    {
      accessorKey: "total_weight_kg",
      header: "Peso total (kg)",
      cell: ({ row }) => `${row.original.total_weight_kg} kg`,
    },
    {
      accessorKey: "shipping_cost",
      header: "Costo envío",
      cell: ({ row }) => `S/ ${row.original.shipping_cost}`,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/shipments/${row.original.id}`}>
            <Button variant="outline" size="sm">Detalle</Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(row.original.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ]
}
