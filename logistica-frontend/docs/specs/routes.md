# Spec: Routes

## Context

Rutas logísticas con stops anidados. Dep: warehouses. Tiene dos páginas: lista (`/routes`) y detalle (`/routes/[id]`) donde se gestionan los stops inline. Soft delete en rutas; borrado físico en stops.

## Backend contract

**Endpoint rutas:** `/api/v1/routes/`  
**Método:** CRUD estándar. Soft delete.

**Campos de ruta (lectura):**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | requerido |
| `origin_warehouse` | `{ id: number; name: string }` | FK→Warehouse, nested read |
| `estimated_duration_hours` | string\|null | decimal, opcional |
| `is_active` | boolean | soft delete vía DELETE |
| `stops` | `RouteStop[]` | nested read-only (incluido en GET /routes/<id>/) |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Payload de escritura (ruta):** `origin_warehouse` se envía como integer ID.

**Búsqueda:** `name`  
**Ordenamiento:** `name`, `created_at`, `estimated_duration_hours`  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/routes/<id>/` → 204

---

**Endpoint stops:** `/api/v1/routes/<route_pk>/stops/`  
**Método:** CRUD. **Borrado físico** (no soft delete).

**Campos de stop:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `route` | number | read-only, desde URL |
| `stop_order` | number | requerido, entero |
| `address` | string | requerido |
| `city` | string | requerido |
| `latitude` | string\|null | decimal, opcional |
| `longitude` | string\|null | decimal, opcional |
| `estimated_arrival` | string\|null | time string (HH:MM), opcional |

## Tasks

### Types
- [x] Crear `lib/types/route.ts`
  - `RouteWarehouse` — `{ id: number; name: string }`
  - `RouteStop` — todos los campos de stop
  - `Route` — todos los campos de ruta (`origin_warehouse: RouteWarehouse`, `stops: RouteStop[]`)
  - `RoutePayload` — `{ name: string; origin_warehouse: number; estimated_duration_hours?: string | null }`
  - `RouteStopPayload` — `{ stop_order: number; address: string; city: string; latitude?: string | null; longitude?: string | null; estimated_arrival?: string | null }`

### API
- [x] Crear `lib/api/endpoints/routes.ts`
  - `routesApi.list(params?)` → `DRFPage<Route>`
  - `routesApi.getById(id)` → `Route` (incluye stops)
  - `routesApi.create(data: RoutePayload)` → `Route`
  - `routesApi.update(id, data: Partial<RoutePayload>)` → `Route`
  - `routesApi.remove(id)` → void
  - `routesApi.createStop(routeId, data: RouteStopPayload)` → `RouteStop`
  - `routesApi.updateStop(routeId, stopId, data: Partial<RouteStopPayload>)` → `RouteStop`
  - `routesApi.removeStop(routeId, stopId)` → void

### Hooks
- [x] Crear `lib/hooks/use-routes.ts`
  - `useRoutes(params?)` — queryKey `["routes", params]`
  - `useRoute(id)` — queryKey `["route", id]`
  - `useCreateRoute()` — invalida `["routes"]`
  - `useUpdateRoute()` — invalida `["routes"]` y `["route", id]`
  - `useDeleteRoute()` — invalida `["routes"]`
  - `useCreateRouteStop(routeId)` — invalida `["route", routeId]`
  - `useUpdateRouteStop(routeId)` — invalida `["route", routeId]`
  - `useDeleteRouteStop(routeId)` — invalida `["route", routeId]`

### Columns (routes list)
- [x] Crear `app/(dashboard)/routes/columns.tsx`
  - Columnas: `name`, `origin_warehouse` (origin_warehouse.name), `estimated_duration_hours`, `is_active` (Badge), `actions` (Editar + Detalle + Eliminar)
  - `getColumns({ onEdit, onDelete })` — "Detalle" navega a `/routes/[id]`

### Form (route)
- [x] Crear `app/(dashboard)/routes/route-form.tsx`
  - Props: `route?: Route`, `onSuccess: () => void`
  - Zod: name (min 1), origin_warehouse (string/number), estimated_duration_hours (optional string)
  - Select para origin_warehouse (carga `useWarehouses()`)
  - Crea o edita según `route` prop

### Page (routes list)
- [x] Crear `app/(dashboard)/routes/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`
  - `useRoutes({ page: page + 1 })`
  - Botón "Nueva ruta", Sheet con `<RouteForm>`
  - Delete: `window.confirm` → `useDeleteRoute.mutate(id)`

### Stop form
- [x] Crear `app/(dashboard)/routes/[id]/stop-form.tsx`
  - Props: `routeId: number`, `stop?: RouteStop`, `onSuccess: () => void`
  - Zod: stop_order (number ≥ 1), address (min 1), city (min 1), latitude (optional), longitude (optional), estimated_arrival (optional)
  - Crea o edita según `stop` prop

### Detail page
- [x] Crear `app/(dashboard)/routes/[id]/page.tsx`
  - Carga `useRoute(id)` — muestra info de ruta + tabla de stops
  - Tabla de stops: columnas stop_order, address, city, estimated_arrival, acciones (Editar + Eliminar)
  - Sheet inline para crear/editar stops con `<StopForm>`
  - Delete stop: `window.confirm` → `useDeleteRouteStop(routeId).mutate(stopId)`

## Validation report

All 8 tasks passed. TypeScript check clean (0 errors). Used `React.use(params)` to unwrap Next.js 15+ async params in detail page. Stops sorted by `stop_order` client-side before render.

| File | Status |
|------|--------|
| `lib/types/route.ts` | ✅ |
| `lib/api/endpoints/routes.ts` | ✅ |
| `lib/hooks/use-routes.ts` | ✅ |
| `app/(dashboard)/routes/columns.tsx` | ✅ |
| `app/(dashboard)/routes/route-form.tsx` | ✅ |
| `app/(dashboard)/routes/page.tsx` | ✅ |
| `app/(dashboard)/routes/[id]/stop-form.tsx` | ✅ |
| `app/(dashboard)/routes/[id]/page.tsx` | ✅ |
