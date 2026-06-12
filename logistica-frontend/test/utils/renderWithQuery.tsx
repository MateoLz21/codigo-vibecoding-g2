import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, renderHook } from "@testing-library/react"
import type { RenderOptions } from "@testing-library/react"
import type { ReactNode } from "react"

function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function Wrapper({ children }: { children: ReactNode }) {
  const qc = makeTestQueryClient()
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

export function renderWithQuery(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithQuery<T>(hook: () => T) {
  return renderHook(hook, { wrapper: Wrapper })
}
