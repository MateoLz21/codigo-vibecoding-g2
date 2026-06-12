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
import { useProducts, useDeleteProduct } from "@/lib/hooks/use-products"
import { useSuppliers } from "@/lib/hooks/use-suppliers"
import { useWarehouses } from "@/lib/hooks/use-warehouses"
import type { Product } from "@/lib/types/product"
import { getColumns } from "./columns"
import { ProductForm } from "./product-form"

export default function ProductsPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [supplierFilter, setSupplierFilter] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useProducts({
    page: page + 1,
    supplier: supplierFilter || undefined,
    warehouse: warehouseFilter || undefined,
    search: search || undefined,
  })

  const { data: suppliersData } = useSuppliers({ page: 1 })
  const { data: warehousesData } = useWarehouses({ page: 1 })
  const suppliers = suppliersData?.results ?? []
  const warehouses = warehousesData?.results ?? []

  const deleteMutation = useDeleteProduct()

  const handleEdit = useCallback((row: Product) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este producto?")) {
        deleteMutation.mutate(id)
      }
    },
    [deleteMutation]
  )

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  )

  function handleSupplierFilter(value: string | null) {
    setSupplierFilter(value ?? "")
    setPage(0)
  }

  function handleWarehouseFilter(value: string | null) {
    setWarehouseFilter(value ?? "")
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
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button onClick={openCreate}>Nuevo producto</Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Buscar por nombre, SKU..." }}
        activeFilterCount={(supplierFilter ? 1 : 0) + (warehouseFilter ? 1 : 0)}
        filters={
          <>
            <Select value={supplierFilter} onValueChange={handleSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los proveedores</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={warehouseFilter} onValueChange={handleWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los almacenes</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
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
              {editTarget ? "Editar producto" : "Nuevo producto"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <ProductForm
              product={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
