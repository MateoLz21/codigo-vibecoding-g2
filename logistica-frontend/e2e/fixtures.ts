import { test as base, request, expect } from "@playwright/test"

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000"

type ApiHelpers = {
  seed(endpoint: string, payload: Record<string, unknown>): Promise<number>
  remove(endpoint: string, id: number): Promise<void>
  get(endpoint: string, params?: Record<string, string>): Promise<unknown>
}

export const test = base.extend<{ api: ApiHelpers }>({
  api: async ({}, use) => {
    const authCtx = await request.newContext()
    const tokenRes = await authCtx.post(`${API_URL}/api/v1/auth/token/`, {
      data: {
        username: process.env.E2E_USERNAME ?? "admin",
        password: process.env.E2E_PASSWORD ?? "admin1234",
      },
    })
    const { access } = (await tokenRes.json()) as { access: string }
    await authCtx.dispose()

    const ctx = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${access}` },
    })

    const api: ApiHelpers = {
      async seed(endpoint, payload) {
        const res = await ctx.post(`/api/v1/${endpoint}/`, { data: payload })
        const body = (await res.json()) as Record<string, unknown>
        return (body.id ?? body.pk) as number
      },
      async remove(endpoint, id) {
        await ctx.delete(`/api/v1/${endpoint}/${id}/`)
      },
      async get(endpoint, params?) {
        const url = params
          ? `/api/v1/${endpoint}?${new URLSearchParams(params)}`
          : `/api/v1/${endpoint}`
        const res = await ctx.get(url)
        return res.json()
      },
    }

    await use(api)
    await ctx.dispose()
  },
})

export { expect }
