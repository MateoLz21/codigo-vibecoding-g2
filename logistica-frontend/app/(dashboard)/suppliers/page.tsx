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
import { useSuppliers, useDeleteSupplier } from "@/lib/hooks/use-suppliers"
import type { Supplier } from "@/lib/types/supplier"
import { getColumns } from "./columns"
import { SupplierForm } from "./supplier-form"

export default function SuppliersPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useSuppliers({ page: page + 1 })

  const filteredResults = useMemo(() => {
    const results = data?.results ?? []
    if (!search.trim()) return results
    const lower = search.toLowerCase()
    return results.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.contact_name?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower)
    )
  }, [data?.results, search])

  const deleteMutation = useDeleteSupplier()

  const handleEdit = useCallback((row: Supplier) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este proveedor?")) {
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
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <Button onClick={openCreate}>Nuevo proveedor</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por nombre, contacto..." }}
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
              {editTarget ? "Editar proveedor" : "Nuevo proveedor"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <SupplierForm
              supplier={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
