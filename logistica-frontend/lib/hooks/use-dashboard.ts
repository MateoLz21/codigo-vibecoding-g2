import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/lib/api/endpoints/dashboard"
import type { DateRange } from "@/lib/types/dashboard"

export function useShipmentStats(range: DateRange) {
  const opts = (status: string) => ({
    queryKey: ["dashboard", "shipments", status, range],
    queryFn: () => dashboardApi.shipmentCount(status, range),
  })

  return {
    pending: useQuery(opts("pending")),
    in_transit: useQuery(opts("in_transit")),
    delivered: useQuery(opts("delivered")),
    cancelled: useQuery(opts("cancelled")),
  }
}

export function useEntityStats() {
  return {
    customers: useQuery({
      queryKey: ["dashboard", "customers"],
      queryFn: () => dashboardApi.count("/api/v1/customers/"),
    }),
    products: useQuery({
      queryKey: ["dashboard", "products"],
      queryFn: () => dashboardApi.count("/api/v1/products/"),
    }),
    routes: useQuery({
      queryKey: ["dashboard", "routes"],
      queryFn: () => dashboardApi.count("/api/v1/routes/"),
    }),
    warehouses: useQuery({
      queryKey: ["dashboard", "warehouses"],
      queryFn: () => dashboardApi.count("/api/v1/warehouses/"),
    }),
    drivers: useQuery({
      queryKey: ["dashboard", "drivers"],
      queryFn: () => dashboardApi.count("/api/v1/drivers/"),
    }),
    transport: useQuery({
      queryKey: ["dashboard", "transport"],
      queryFn: () => dashboardApi.count("/api/v1/transport/"),
    }),
  }
}

export function useFleetStats() {
  const byType = (type: string) => ({
    queryKey: ["dashboard", "fleet", type],
    queryFn: () => dashboardApi.count("/api/v1/transport/", { vehicle_type: type }),
  })
  return {
    truck:      useQuery(byType("truck")),
    van:        useQuery(byType("van")),
    motorcycle: useQuery(byType("motorcycle")),
  }
}
