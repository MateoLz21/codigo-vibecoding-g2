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
import { useDrivers, useDeleteDriver } from "@/lib/hooks/use-drivers"
import type { Driver } from "@/lib/types/driver"
import { getColumns } from "./columns"
import { DriverForm } from "./driver-form"

export default function DriversPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Driver | null>(null)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useDrivers({
    page: page + 1,
    search: search || undefined,
  })

  const deleteMutation = useDeleteDriver()

  const handleEdit = useCallback((row: Driver) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este conductor?")) {
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

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Conductores</h1>
        <Button onClick={openCreate}>Nuevo conductor</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Buscar por nombre, licencia..." }}
      />

      <DataTable
        columns={columns}
        data={data?.results ?? []}
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
              {editTarget ? "Editar conductor" : "Nuevo conductor"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <DriverForm
              driver={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
