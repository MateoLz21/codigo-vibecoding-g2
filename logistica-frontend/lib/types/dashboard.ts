export type DateRange = "7d" | "30d" | "90d" | "all"

export interface StatCard {
  label: string
  value: number | undefined
  isLoading: boolean
}
