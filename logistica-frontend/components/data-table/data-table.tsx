"use client"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DRFPage<TData> {
  count: number
  next: string | null
  previous: string | null
  results: TData[]
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  pagination?: {
    pageIndex: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  isLoading,
}: DataTableProps<TData>) {
  const paginationState: PaginationState = pagination
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
    : { pageIndex: 0, pageSize: 20 }

  const pageCount = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination: paginationState },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 rounded-md bg-muted animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.pageIndex + 1} de {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex + 1 >= pageCount}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export type { DRFPage }
