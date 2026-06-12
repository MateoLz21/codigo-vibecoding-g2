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
import { useRoutes, useDeleteRoute } from "@/lib/hooks/use-routes"
import type { Route } from "@/lib/types/route"
import { getColumns } from "./columns"
import { RouteForm } from "./route-form"

export default function RoutesPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Route | null>(null)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useRoutes({
    page: page + 1,
    search: search || undefined,
  })
  const deleteMutation = useDeleteRoute()

  const handleEdit = useCallback((row: Route) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar esta ruta?")) {
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
        <h1 className="text-2xl font-semibold">Rutas</h1>
        <Button onClick={openCreate}>Nueva ruta</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Buscar por nombre..." }}
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
              {editTarget ? "Editar ruta" : "Nueva ruta"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <RouteForm
              route={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
