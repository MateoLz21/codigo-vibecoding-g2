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
import { useUsers, useDeactivateUser } from "@/lib/hooks/use-users"
import type { User } from "@/lib/types/user"
import { getColumns } from "./columns"
import { UserForm } from "./user-form"

export default function UsersPage() {
  const [page, setPage] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useUsers({
    page: page + 1,
    search: search || undefined,
  })

  const deactivateMutation = useDeactivateUser()

  const handleEdit = useCallback((row: User) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDeactivate = useCallback(
    (id: number) => {
      if (window.confirm("¿Desactivar este usuario?")) {
        deactivateMutation.mutate(id)
      }
    },
    [deactivateMutation]
  )

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDeactivate: handleDeactivate }),
    [handleEdit, handleDeactivate]
  )

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
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Button onClick={openCreate}>Nuevo usuario</Button>
      </div>

      <DataTableToolbar
        search={{
          value: search,
          onChange: handleSearch,
          placeholder: "Buscar por usuario...",
        }}
        activeFilterCount={0}
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
              {editTarget ? "Editar usuario" : "Nuevo usuario"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <UserForm
              user={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
