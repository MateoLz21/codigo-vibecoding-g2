"use client"

import { useState, useMemo, useCallback } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useWarehouses, useDeleteWarehouse } from "@/lib/hooks/use-warehouses"
import type { Warehouse } from "@/lib/types/warehouse"
import { getColumns } from "./columns"
import { WarehouseForm } from "./warehouse-form"

export default function WarehousesPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useWarehouses({
    page: page + 1,
    ordering: "name",
  })

  const filteredResults = useMemo(() => {
    const results = data?.results ?? []
    if (!search.trim()) return results
    const lower = search.toLowerCase()
    return results.filter(
      (w) =>
        w.name.toLowerCase().includes(lower) ||
        w.city.toLowerCase().includes(lower)
    )
  }, [data?.results, search])

  const deleteMutation = useDeleteWarehouse()

  const handleEdit = useCallback((row: Warehouse) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este almacén?")) {
        deleteMutation.mutate(id)
      }
    },
    [deleteMutation]
  )

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  )

  function openCreate() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Almacenes</h1>
        <Button onClick={openCreate}>Nuevo almacén</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por nombre o ciudad..." }}
      />

      <DataTable
        columns={columns}
        data={filteredResults}
        isLoading={isLoading}
        pagination={
          data
            ? {
                pageIndex: page,
                pageSize: 20,
                total: data.count,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editTarget ? "Editar almacén" : "Nuevo almacén"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <WarehouseForm
              warehouse={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
