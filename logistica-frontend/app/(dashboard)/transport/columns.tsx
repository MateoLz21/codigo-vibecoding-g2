"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Transport, VehicleType } from "@/lib/types/transport"

const VEHICLE_LABELS: Record<VehicleType, string> = {
  truck: "Camión",
  van: "Furgoneta",
  motorcycle: "Moto",
}

interface ColumnOptions {
  onEdit: (row: Transport) => void
  onDelete: (id: number) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Transport>[] {
  return [
    {
      accessorKey: "plate_number",
      header: "Placa",
    },
    {
      accessorKey: "vehicle_type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {VEHICLE_LABELS[row.original.vehicle_type]}
        </Badge>
      ),
    },
    {
      accessorKey: "brand",
      header: "Marca",
    },
    {
      accessorKey: "max_capacity_kg",
      header: "Cap. máx. (kg)",
      cell: ({ row }) => row.original.max_capacity_kg ?? "—",
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            Editar
          </Button>
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
