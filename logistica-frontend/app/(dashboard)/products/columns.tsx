"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types/product"

interface ColumnOptions {
  onEdit: (row: Product) => void
  onDelete: (id: number) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      id: "supplier",
      header: "Proveedor",
      cell: ({ row }) => row.original.supplier.name,
    },
    {
      id: "warehouse",
      header: "Almacén",
      cell: ({ row }) => row.original.warehouse.name,
    },
    {
      accessorKey: "unit_price",
      header: "Precio unit.",
      cell: ({ row }) => `S/ ${row.original.unit_price}`,
    },
    {
      accessorKey: "stock",
      header: "Stock",
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
