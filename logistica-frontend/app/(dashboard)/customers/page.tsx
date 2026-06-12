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
import { useCustomers, useDeleteCustomer } from "@/lib/hooks/use-customers"
import type { Customer, CustomerType } from "@/lib/types/customer"
import { getColumns } from "./columns"
import { CustomerForm } from "./customer-form"

export default function CustomersPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [typeFilter, setTypeFilter] = useState<CustomerType | "">("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useCustomers({
    page: page + 1,
    customer_type: typeFilter || undefined,
    search: search || undefined,
  })

  const deleteMutation = useDeleteCustomer()

  const handleEdit = useCallback((row: Customer) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este cliente?")) {
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
    setTypeFilter((value ?? "") as CustomerType | "")
    setPage(0)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  function openCreate() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button onClick={openCreate}>Nuevo cliente</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Buscar por nombre, email..." }}
        activeFilterCount={typeFilter ? 1 : 0}
        filters={
          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
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
              {editTarget ? "Editar cliente" : "Nuevo cliente"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <CustomerForm
              customer={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
