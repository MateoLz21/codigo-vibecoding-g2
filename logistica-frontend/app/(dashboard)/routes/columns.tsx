"use client"

import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Route } from "@/lib/types/route"

interface ColumnOptions {
  onEdit: (row: Route) => void
  onDelete: (id: number) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Route>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      id: "origin_warehouse",
      header: "Almacén origen",
      cell: ({ row }) => row.original.origin_warehouse.name,
    },
    {
      accessorKey: "estimated_duration_hours",
      header: "Duración est. (h)",
      cell: ({ row }) => row.original.estimated_duration_hours ?? "—",
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
          <Link href={`/routes/${row.original.id}`}>
            <Button variant="outline" size="sm">Detalle</Button>
          </Link>
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
