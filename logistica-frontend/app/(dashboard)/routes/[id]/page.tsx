"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRoute, useDeleteRouteStop } from "@/lib/hooks/use-routes"
import type { RouteStop } from "@/lib/types/route"
import { StopForm } from "./stop-form"

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idStr } = React.use(params)
  const routeId = Number(idStr)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editStop, setEditStop] = useState<RouteStop | null>(null)

  const { data: route, isLoading } = useRoute(routeId)
  const deleteStopMutation = useDeleteRouteStop(routeId)

  const handleEditStop = useCallback((stop: RouteStop) => {
    setEditStop(stop)
    setSheetOpen(true)
  }, [])

  const handleDeleteStop = useCallback(
    (stopId: number) => {
      if (window.confirm("¿Eliminar esta parada?")) {
        deleteStopMutation.mutate(stopId)
      }
    },
    [deleteStopMutation]
  )

  function openAddStop() {
    setEditStop(null)
    setSheetOpen(true)
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-4">Cargando...</p>
  }

  if (!route) {
    return <p className="text-muted-foreground p-4">Ruta no encontrada.</p>
  }

  const sortedStops = [...route.stops].sort((a, b) => a.stop_order - b.stop_order)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/routes">
            <Button variant="outline" size="sm">← Volver</Button>
          </Link>
          <h1 className="text-2xl font-semibold">{route.name}</h1>
          {route.is_active ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Almacén origen:</span>{" "}
          <span className="font-medium">{route.origin_warehouse.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Duración estimada:</span>{" "}
          <span className="font-medium">
            {route.estimated_duration_hours ? `${route.estimated_duration_hours} h` : "—"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Paradas ({sortedStops.length})</h2>
          <Button size="sm" onClick={openAddStop}>Agregar parada</Button>
        </div>

        {sortedStops.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin paradas registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Llegada est.</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStops.map((stop) => (
                <TableRow key={stop.id}>
                  <TableCell>{stop.stop_order}</TableCell>
                  <TableCell>{stop.address}</TableCell>
                  <TableCell>{stop.city}</TableCell>
                  <TableCell>{stop.estimated_arrival ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStop(stop)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStop(stop.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editStop ? "Editar parada" : "Nueva parada"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <StopForm
              routeId={routeId}
              stop={editStop ?? undefined}
              onSuccess={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
