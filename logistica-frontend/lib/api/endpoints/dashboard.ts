import { apiClient } from "@/lib/api/client"
import type { DRFPage } from "@/components/data-table/data-table"
import type { DateRange } from "@/lib/types/dashboard"

function dateParams(range: DateRange): Record<string, string> {
  if (range === "all") return {}
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { shipping_date__gte: from.toISOString().split("T")[0] }
}

export const dashboardApi = {
  shipmentCount: (status: string, range: DateRange) =>
    apiClient
      .get<DRFPage<unknown>>("/api/v1/shipments/", {
        params: { status, ...dateParams(range) },
      })
      .then((r) => r.data.count),

  count: (endpoint: string, params?: Record<string, unknown>) =>
    apiClient
      .get<DRFPage<unknown>>(endpoint, { params })
      .then((r) => r.data.count),
}
