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
import { useShipments, useDeleteShipment } from "@/lib/hooks/use-shipments"
import type { ShipmentStatus } from "@/lib/types/shipment"
import { getColumns } from "./columns"
import { ShipmentForm } from "./shipment-form"

export default function ShipmentsPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useShipments({
    page: page + 1,
    status: statusFilter || undefined,
    search: search || undefined,
  })

  const deleteMutation = useDeleteShipment()

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este envío?")) {
        deleteMutation.mutate(id)
      }
    },
    [deleteMutation]
  )

  const columns = useMemo(
    () => getColumns({ onDelete: handleDelete }),
    [handleDelete]
  )

  function handleStatusFilter(value: string | null) {
    setStatusFilter((value ?? "") as ShipmentStatus | "")
    setPage(0)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Envíos</h1>
        <Button onClick={() => setSheetOpen(true)}>Nuevo envío</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Buscar por dirección, cliente..." }}
        activeFilterCount={statusFilter ? 1 : 0}
        filters={
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_transit">En tránsito</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
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
            <SheetTitle>Nuevo envío</SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <ShipmentForm onSuccess={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
