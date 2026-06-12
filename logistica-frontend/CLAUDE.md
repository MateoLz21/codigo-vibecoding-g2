# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at localhost:3000 (hot reload)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint (Next.js config)
```

No test runner configured yet.

## Stack

- **Next.js 16** — App Router (`app/` directory), no Pages Router
- **React 19**
- **TypeScript** — strict mode; path alias `@/*` maps to repo root
- **Tailwind CSS v4** — via `@tailwindcss/postcss` plugin; no `tailwind.config.*`
- **shadcn/ui v4** — uses `@base-ui/react` (NOT Radix UI). Components in `components/ui/` — never edit manually.
- **TanStack Query v5** — server state (fetching, caching, mutations). QueryClient in `providers/index.tsx`.
- **TanStack Table v8** — all data tables. Reusable wrapper in `components/data-table/data-table.tsx`.
- **Axios** — HTTP client. Configured instance with JWT interceptor at `lib/api/client.ts`.
- **Zustand v5** — client/UI state only (auth tokens, modal state). Stores in `lib/stores/`.
- **react-hook-form + zod** — forms and validation.
- **Fonts** — Geist Sans + Geist Mono via CSS vars `--font-geist-sans` / `--font-geist-mono`.

## Project Structure

```
app/
├── (auth)/login/page.tsx         ← login form
├── (dashboard)/
│   ├── layout.tsx                ← auth guard + Providers wrapper
│   └── <module>/
│       ├── page.tsx              ← list page (DataTable)
│       ├── columns.tsx           ← TanStack Table column defs
│       └── module-form.tsx       ← create/edit form
├── layout.tsx                    ← root layout (fonts, metadata)
├── globals.css                   ← Tailwind + shadcn CSS vars
└── page.tsx                      ← redirects to /warehouses
lib/
├── api/
│   ├── client.ts                 ← axios instance + JWT interceptor + refresh logic
│   └── endpoints/<module>.ts     ← API functions per module
├── hooks/
│   └── use-<module>.ts           ← useQuery + useMutation per module
├── stores/
│   └── auth.store.ts             ← Zustand: accessToken, refreshToken, user
└── types/
    └── <module>.ts               ← TypeScript interfaces per module
components/
├── ui/                           ← shadcn auto-generated (do not edit)
├── data-table/
│   ├── data-table.tsx            ← reusable table + server-side pagination
│   └── data-table-toolbar.tsx    ← search + filter controls
└── layout/                       ← sidebar, header (created during auth module)
providers/
└── index.tsx                     ← QueryClientProvider + ReactQueryDevtools
docs/
├── backend-overview.md           ← backend modules, patterns
├── endpoints.md                  ← full endpoint reference
├── business-logic.md             ← business rules, calculations
├── mvp.md                        ← module order and scope
└── specs/<module>.md             ← per-module spec + task checklist (created by /spect)
.claude/commands/
├── spect.md                      ← /spect <module>
├── implement.md                  ← /implement <module>
├── validator.md                  ← /validator <module>
└── orchester.md                  ← /orchester <module>
```

## SDD Workflow

Always build one module at a time. Check `docs/mvp.md` for the next pending module.

### Agents (slash commands)

| Command | What it does |
|---------|-------------|
| `/spect <module>` | Analyzes backend + mvp scope → creates `docs/specs/<module>.md` checklist for human approval |
| `/implement <module>` | Reads approved spec → creates all files in order (types → api → hooks → columns → form → page) |
| `/validator <module>` | Verifies implementation against spec → marks tasks ✅ → reports issues |
| `/orchester <module>` | Runs full flow: spec → **waits for human 'ok'** → implement → validate |

### Recommended usage

```
/orchester warehouses   ← runs full SDD cycle, pauses for approval
```

Or manual:
```
/spect warehouses       ← review + approve spec
/implement warehouses   ← build the module
/validator warehouses   ← verify everything
```

### Module order (see docs/mvp.md for status)

auth → warehouses → suppliers → customers → transport → drivers → products → routes → shipments

---

## Backend — logistica-api

Django REST Framework at `http://localhost:8000`. Full docs in `docs/`.

- `docs/backend-overview.md` — módulos, dependencias, patrones globales
- `docs/endpoints.md` — referencia completa de endpoints y campos
- `docs/business-logic.md` — cálculo de totales, soft delete, paginación
- `docs/mvp.md` — orden de módulos y alcance por módulo

### Auth

```
POST /api/v1/auth/token/         {username, password} → {access, refresh}
POST /api/v1/auth/token/refresh/ {refresh} → {access}
```

Header: `Authorization: Bearer <access_token>`. Access TTL: 1h. Refresh TTL: 7d.  
Env var: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

### Módulos y rutas

| Módulo | Endpoint base | Notas |
|--------|---------------|-------|
| warehouses | `/api/v1/warehouses/` | origen de rutas y productos |
| suppliers | `/api/v1/suppliers/` | proveedores de productos |
| customers | `/api/v1/customers/` | tipos: `company` \| `individual` |
| transport | `/api/v1/transport/` | vehículos: `truck` \| `van` \| `motorcycle` |
| drivers | `/api/v1/drivers/` | OneToOne→User; soft delete = user.is_active=False |
| products | `/api/v1/products/` | FK→supplier + FK→warehouse |
| routes | `/api/v1/routes/` | incluye `stops[]` nested (read-only en GET) |
| route-stops | `/api/v1/routes/<id>/stops/` | borrado **físico** |
| shipments | `/api/v1/shipments/` | entidad central; status: pending/in_transit/delivered/cancelled |
| shipment-items | `/api/v1/shipments/<id>/items/` | precio congelado; borrado **físico** + recalcula totales |

### Reglas clave

- `DELETE` con `is_active` → soft delete (204, no borra)
- `DELETE` de stops/items → borrado físico real
- `total_weight_kg` y `shipping_cost` en Shipment son **read-only** (calculados automáticamente)
- `shipping_cost = total_weight_kg × 0.5`
- Al crear ShipmentItem, `unit_price` se congela desde `product.unit_price`
- Todos los GETs de lista paginados: 20 items/página, param `?page=N`
- Respuesta paginada: `{count, next, previous, results[]}`

## Key patterns

### API function pattern
```ts
// lib/api/endpoints/warehouses.ts
import { apiClient } from "@/lib/api/client"
import type { Warehouse, WarehousePayload } from "@/lib/types/warehouse"
import type { DRFPage } from "@/components/data-table/data-table"

export const warehousesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<DRFPage<Warehouse>>("/api/v1/warehouses/", { params }),
  getById: (id: number) =>
    apiClient.get<Warehouse>(`/api/v1/warehouses/${id}/`),
  create: (data: WarehousePayload) =>
    apiClient.post<Warehouse>("/api/v1/warehouses/", data),
  update: (id: number, data: Partial<WarehousePayload>) =>
    apiClient.patch<Warehouse>(`/api/v1/warehouses/${id}/`, data),
  remove: (id: number) =>
    apiClient.delete(`/api/v1/warehouses/${id}/`),
}
```

### Hook pattern
```ts
// lib/hooks/use-warehouses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { warehousesApi } from "@/lib/api/endpoints/warehouses"

export function useWarehouses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => warehousesApi.list(params).then((r) => r.data),
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: warehousesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  })
}
```
