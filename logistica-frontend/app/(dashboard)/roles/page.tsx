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
import { useGroups, useDeleteGroup } from "@/lib/hooks/use-groups"
import type { Group } from "@/lib/types/user"
import { getColumns } from "./columns"
import { RoleForm } from "./role-form"

export default function RolesPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Group | null>(null)

  const { data, isLoading } = useGroups()
  const deleteMutation = useDeleteGroup()

  const handleEdit = useCallback((row: Group) => {
    setEditTarget(row)
    setSheetOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: number) => {
      if (window.confirm("¿Eliminar este rol? Los usuarios asignados perderán este rol.")) {
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
        <h1 className="text-2xl font-semibold">Roles</h1>
        <Button onClick={openCreate}>Nuevo rol</Button>
      </div>

      <DataTableToolbar activeFilterCount={0} />

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        isLoading={isLoading}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? "Editar rol" : "Nuevo rol"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <RoleForm
              group={editTarget ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
