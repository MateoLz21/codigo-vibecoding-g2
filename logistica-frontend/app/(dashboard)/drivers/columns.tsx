"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Driver } from "@/lib/types/driver"

interface ColumnOptions {
  onEdit: (row: Driver) => void
  onDelete: (id: number) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "license_number",
      header: "N° Licencia",
    },
    {
      id: "full_name",
      header: "Nombre completo",
      cell: ({ row }) => {
        const { first_name, last_name } = row.original.user
        return `${first_name} ${last_name}`.trim() || "—"
      },
    },
    {
      accessorKey: "license_expiry",
      header: "Vencimiento licencia",
    },
    {
      accessorKey: "is_available",
      header: "Disponibilidad",
      cell: ({ row }) =>
        row.original.is_available ? (
          <Badge variant="default">Disponible</Badge>
        ) : (
          <Badge variant="secondary">No disponible</Badge>
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
