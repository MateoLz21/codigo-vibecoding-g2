"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface DataTableToolbarProps {
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: React.ReactNode
  activeFilterCount?: number
  children?: React.ReactNode
}

export function DataTableToolbar({
  search,
  filters,
  activeFilterCount = 0,
  children,
}: DataTableToolbarProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {search && (
          <Input
            placeholder={search.placeholder ?? "Buscar..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="max-w-xs"
          />
        )}

        {filters && (
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        {filters && (
          <div className="hidden md:flex items-center gap-2">{filters}</div>
        )}

        {children && (
          <div className="flex items-center gap-2 ml-auto">{children}</div>
        )}
      </div>

      {filters && (
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 pt-4 pb-6 [&>*]:w-full">
              {filters}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
