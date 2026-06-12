"use client"

import { useState } from "react"
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Users,
  Box,
  Map,
  Warehouse,
  UserCheck,
  Car,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  useShipmentStats,
  useEntityStats,
  useFleetStats,
} from "@/lib/hooks/use-dashboard"
import type { DateRange } from "@/lib/types/dashboard"

/* ─── types ──────────────────────────────────────────────────── */

type TooltipPayloadItem = {
  name: string
  value: number
  fill?: string
  color?: string
}

/* ─── shared custom tooltip (Tailwind → dark mode safe) ─────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2.5 shadow-lg">
      {label && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: p.fill ?? p.color }}
          />
          <span className="text-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── legend text renderer ───────────────────────────────────── */

function legendText(value: string) {
  return (
    <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
      {value}
    </span>
  )
}

/* ─── date range tabs ────────────────────────────────────────── */

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "7 días",  value: "7d"  },
  { label: "30 días", value: "30d" },
  { label: "90 días", value: "90d" },
  { label: "Todo",    value: "all" },
]

/* ─── stat card ──────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  isLoading,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string
  value: number | undefined
  isLoading: boolean
  icon: React.ElementType
  colorClass: string
  bgClass: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {isLoading ? (
                <span className="inline-block h-9 w-16 animate-pulse rounded bg-muted" />
              ) : (
                (value ?? "—")
              )}
            </p>
          </div>
          <div className={cn("shrink-0 rounded-full p-3", bgClass)}>
            <Icon className={cn("h-5 w-5", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── shipment donut ─────────────────────────────────────────── */

const DONUT_COLORS = [
  { name: "Pendientes",  color: "#F59E0B" },
  { name: "En Tránsito", color: "#3B82F6" },
  { name: "Entregados",  color: "#22C55E" },
  { name: "Cancelados",  color: "#EF4444" },
]

function ShipmentDonut({
  slices,
  isLoading,
  total,
}: {
  slices: Array<{ name: string; value: number; color: string }>
  isLoading: boolean
  total: number
}) {
  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <div className="h-44 w-44 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Package className="h-10 w-10 opacity-25" />
        <p className="text-sm">Sin envíos en el período</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={slices}
          cx="50%"
          cy="45%"
          innerRadius="52%"
          outerRadius="72%"
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {/* center label — fill="currentColor" inherits CSS color → dark mode safe */}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
              const { cx, cy } = viewBox as { cx: number; cy: number }
              return (
                <g>
                  <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={26}
                    fontWeight={700}
                  >
                    {total}
                  </text>
                  <text
                    x={cx}
                    y={cy + 16}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={11}
                    opacity={0.5}
                  >
                    envíos
                  </text>
                </g>
              )
            }}
          />
          {slices.map((s) => (
            <Cell key={s.name} fill={s.color} />
          ))}
        </Pie>
        {/* custom tooltip → Tailwind, dark mode safe */}
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={9}
          verticalAlign="bottom"
          formatter={legendText}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

/* ─── fleet bar chart ────────────────────────────────────────── */

const FLEET_DATA_TEMPLATE = [
  { label: "Camión",    key: "truck",      color: "#6366F1" },
  { label: "Furgoneta", key: "van",        color: "#F59E0B" },
  { label: "Moto",      key: "motorcycle", color: "#22C55E" },
]

function FleetBarChart({
  trucks,
  vans,
  motorcycles,
  isLoading,
}: {
  trucks: number
  vans: number
  motorcycles: number
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex h-[200px] items-end gap-4 px-4 pb-2">
        {[60, 90, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-muted"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    )
  }

  const data = [
    { label: "Camión",    value: trucks,      color: "#6366F1" },
    { label: "Furgoneta", value: vans,        color: "#F59E0B" },
    { label: "Moto",      value: motorcycles, color: "#22C55E" },
  ]

  const total = trucks + vans + motorcycles

  if (total === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Car className="h-10 w-10 opacity-25" />
        <p className="text-sm">Sin vehículos registrados</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="40%" margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(128,128,128,0.15)"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
          width={28}
        />
        {/* custom tooltip → Tailwind, dark mode safe */}
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "rgba(128,128,128,0.07)", radius: 4 }}
        />
        <Bar dataKey="value" name="Vehículos" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ─── page ───────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>("30d")
  const shipments = useShipmentStats(range)
  const entities  = useEntityStats()
  const fleet     = useFleetStats()

  const pending    = shipments.pending.data    ?? 0
  const in_transit = shipments.in_transit.data ?? 0
  const delivered  = shipments.delivered.data  ?? 0
  const cancelled  = shipments.cancelled.data  ?? 0
  const totalShipments = pending + in_transit + delivered + cancelled

  const isShipmentsLoading =
    shipments.pending.isLoading    ||
    shipments.in_transit.isLoading ||
    shipments.delivered.isLoading  ||
    shipments.cancelled.isLoading

  const isFleetLoading =
    fleet.truck.isLoading || fleet.van.isLoading || fleet.motorcycle.isLoading

  const donutSlices = [
    { name: "Pendientes",  value: pending,    color: "#F59E0B" },
    { name: "En Tránsito", value: in_transit, color: "#3B82F6" },
    { name: "Entregados",  value: delivered,  color: "#22C55E" },
    { name: "Cancelados",  value: cancelled,  color: "#EF4444" },
  ].filter((s) => s.value > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visibilidad operacional en tiempo real
          </p>
        </div>
        <div className="flex self-start gap-1 rounded-lg border p-1 sm:self-auto">
          {DATE_RANGES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Estado de Envíos
          </h2>
          {totalShipments > 0 && !isShipmentsLoading && (
            <span className="text-xs text-muted-foreground">
              {totalShipments} total en el período
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_2fr]">
          {/* Donut */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Distribución</CardTitle>
              <CardDescription>Por estado en el período</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ShipmentDonut
                slices={donutSlices}
                isLoading={isShipmentsLoading}
                total={totalShipments}
              />
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Pendientes"
              value={shipments.pending.data}
              isLoading={shipments.pending.isLoading}
              icon={Package}
              colorClass="text-amber-600 dark:text-amber-400"
              bgClass="bg-amber-100 dark:bg-amber-900/30"
            />
            <StatCard
              label="En Tránsito"
              value={shipments.in_transit.data}
              isLoading={shipments.in_transit.isLoading}
              icon={Truck}
              colorClass="text-blue-600 dark:text-blue-400"
              bgClass="bg-blue-100 dark:bg-blue-900/30"
            />
            <StatCard
              label="Entregados"
              value={shipments.delivered.data}
              isLoading={shipments.delivered.isLoading}
              icon={CheckCircle2}
              colorClass="text-green-600 dark:text-green-400"
              bgClass="bg-green-100 dark:bg-green-900/30"
            />
            <StatCard
              label="Cancelados"
              value={shipments.cancelled.data}
              isLoading={shipments.cancelled.isLoading}
              icon={XCircle}
              colorClass="text-red-600 dark:text-red-400"
              bgClass="bg-red-100 dark:bg-red-900/30"
            />
          </div>
        </div>
      </section>

      {/* Fleet chart + Entities */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Entidades
        </h2>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_2fr]">
          {/* Fleet bar chart */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Flota por tipo de transporte</CardTitle>
              <CardDescription>Vehículos registrados por categoría</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <FleetBarChart
                trucks={fleet.truck.data ?? 0}
                vans={fleet.van.data ?? 0}
                motorcycles={fleet.motorcycle.data ?? 0}
                isLoading={isFleetLoading}
              />
            </CardContent>
          </Card>

          {/* Entity stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Clientes"
              value={entities.customers.data}
              isLoading={entities.customers.isLoading}
              icon={Users}
              colorClass="text-violet-600 dark:text-violet-400"
              bgClass="bg-violet-100 dark:bg-violet-900/30"
            />
            <StatCard
              label="Productos"
              value={entities.products.data}
              isLoading={entities.products.isLoading}
              icon={Box}
              colorClass="text-orange-600 dark:text-orange-400"
              bgClass="bg-orange-100 dark:bg-orange-900/30"
            />
            <StatCard
              label="Rutas"
              value={entities.routes.data}
              isLoading={entities.routes.isLoading}
              icon={Map}
              colorClass="text-cyan-600 dark:text-cyan-400"
              bgClass="bg-cyan-100 dark:bg-cyan-900/30"
            />
            <StatCard
              label="Almacenes"
              value={entities.warehouses.data}
              isLoading={entities.warehouses.isLoading}
              icon={Warehouse}
              colorClass="text-slate-600 dark:text-slate-400"
              bgClass="bg-slate-100 dark:bg-slate-800"
            />
            <StatCard
              label="Conductores"
              value={entities.drivers.data}
              isLoading={entities.drivers.isLoading}
              icon={UserCheck}
              colorClass="text-teal-600 dark:text-teal-400"
              bgClass="bg-teal-100 dark:bg-teal-900/30"
            />
            <StatCard
              label="Vehículos"
              value={entities.transport.data}
              isLoading={entities.transport.isLoading}
              icon={Car}
              colorClass="text-indigo-600 dark:text-indigo-400"
              bgClass="bg-indigo-100 dark:bg-indigo-900/30"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
