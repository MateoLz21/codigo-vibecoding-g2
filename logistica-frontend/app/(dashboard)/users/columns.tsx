"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types/user"

interface ColumnOptions {
  onEdit: (row: User) => void
  onDeactivate: (id: number) => void
}

export function getColumns({ onEdit, onDeactivate }: ColumnOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "username",
      header: "Usuario",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      id: "full_name",
      header: "Nombre",
      cell: ({ row }) => {
        const { first_name, last_name } = row.original
        const full = [first_name, last_name].filter(Boolean).join(" ")
        return full || "—"
      },
    },
    {
      accessorKey: "groups",
      header: "Roles",
      cell: ({ row }) => {
        const groups = row.original.groups
        if (!groups.length) return <span className="text-muted-foreground text-sm">Sin roles</span>
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <Badge key={g.id} variant="secondary">{g.name}</Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "is_superuser",
      header: "Tipo",
      cell: ({ row }) =>
        row.original.is_superuser ? (
          <Badge variant="default">Superadmin</Badge>
        ) : (
          <Badge variant="outline">Usuario</Badge>
        ),
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
          {row.original.is_active && !row.original.is_superuser && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeactivate(row.original.id)}
            >
              Desactivar
            </Button>
          )}
        </div>
      ),
    },
  ]
}
