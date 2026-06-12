"use client"

import { useState, useMemo, useCallback } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useTransport, useDeleteTransport } from "@/lib/hooks/use-transport"
import type { Transport, VehicleType } from "@/lib/types/transport"
import { getColumns } from "./columns"
import { TransportForm } from "./transport-form"

export default function TransportPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transport | null>(null)
  const [typeFilter, setTypeFilter] = useState<VehicleType | "">("")

  const { data, isLoading } = useTransport({
    page: page + 1,
    vehicle_type: typeFilter || undefined,
  })

  const deleteMutation = useDeleteTransport()

  const handleEdit = useCallback((row: Transport) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este vehículo?")) {
        deleteMutation.mutate(id)
      }
    },
    [deleteMutation]
  )

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  )

  function handleTypeFilter(value: string | null) {
    setTypeFilter((value ?? "") as VehicleType | "")
    setPage(0)
  }

  function openCreate() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transporte</h1>
        <Button onClick={openCreate}>Nuevo vehículo</Button>
      </div>

      <DataTableToolbar
        activeFilterCount={typeFilter ? 1 : 0}
        filters={
          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de vehículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="truck">Camión</SelectItem>
              <SelectItem value="van">Furgoneta</SelectItem>
              <SelectItem value="motorcycle">Moto</SelectItem>
            </SelectContent>
          </Select>
        }
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
              {editTarget ? "Editar vehículo" : "Nuevo vehículo"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <TransportForm
              transport={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
