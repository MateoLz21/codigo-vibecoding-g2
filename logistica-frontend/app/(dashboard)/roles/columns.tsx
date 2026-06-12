"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Group } from "@/lib/types/user"

interface ColumnOptions {
  onEdit: (row: Group) => void
  onDelete: (id: number) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Group>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre del rol",
    },
    {
      accessorKey: "permissions",
      header: "Permisos",
      cell: ({ row }) => {
        const count = row.original.permissions.length
        return count === 0 ? (
          <span className="text-muted-foreground text-sm">Sin permisos</span>
        ) : (
          <Badge variant="secondary">{count} permiso{count !== 1 ? "s" : ""}</Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
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
