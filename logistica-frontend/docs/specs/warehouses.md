# Spec: Warehouses

## Context

Almacenes — puntos de origen para productos y rutas. Módulo CRUD sin dependencias de otros módulos de dominio. Primer módulo de datos real; establece el patrón que seguirán todos los CRUD siguientes.

## Backend contract

**Endpoint:** `/api/v1/warehouses/`  
**Método:** CRUD estándar (GET list, POST, GET detail, PATCH, DELETE soft)

**Campos:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | requerido |
| `address` | string | requerido |
| `city` | string | requerido |
| `country` | string | default "Peru" |
| `latitude` | string\|null | decimal 9,6 |
| `longitude` | string\|null | decimal 9,6 |
| `capacity_m3` | string\|null | decimal 10,2 |
| `is_active` | boolean | read-only en updates; soft delete vía DELETE |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Filtros:** ninguno específico  
**Búsqueda:** no configurada en backend (no enviar `?search=`)  
**Ordenamiento:** `?ordering=name` | `?ordering=city` | `?ordering=-name` | `?ordering=-city`  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/warehouses/<id>/` → 204, marca `is_active=False`

## Tasks

### Setup
- [x] Instalar componentes shadcn: `sheet` y `dialog` (via `npx shadcn@latest add sheet dialog`)

### Types
- [x] Crear `lib/types/warehouse.ts`
  - `Warehouse` — todos los campos del modelo
  - `WarehousePayload` — campos editables (name, address, city, country, latitude, longitude, capacity_m3)

### API
- [x] Crear `lib/api/endpoints/warehouses.ts`
  - Importar `apiClient` de `@/lib/api/client`
  - Importar `DRFPage` de `@/components/data-table/data-table`
  - `warehousesApi.list(params?)` → `DRFPage<Warehouse>`
  - `warehousesApi.getById(id)` → `Warehouse`
  - `warehousesApi.create(data: WarehousePayload)` → `Warehouse`
  - `warehousesApi.update(id, data: Partial<WarehousePayload>)` → `Warehouse`
  - `warehousesApi.remove(id)` → void (soft delete)

### Hooks
- [x] Crear `lib/hooks/use-warehouses.ts`
  - `useWarehouses(params?)` — useQuery, queryKey `["warehouses", params]`
  - `useCreateWarehouse()` — useMutation, invalida `["warehouses"]` on success
  - `useUpdateWarehouse()` — useMutation, invalida `["warehouses"]` on success
  - `useDeleteWarehouse()` — useMutation, invalida `["warehouses"]` on success

### Columns
- [x] Crear `app/(dashboard)/warehouses/columns.tsx`
  - Columnas: `name`, `city`, `country`, `capacity_m3`, `is_active` (Badge: verde/gris), `actions`
  - Columna `actions`: botones Edit (abre sheet con datos) y Delete (confirm + soft delete)
  - Props del column helper: `onEdit: (row: Warehouse) => void`, `onDelete: (id: number) => void`

### Form
- [x] Crear `app/(dashboard)/warehouses/warehouse-form.tsx`
  - `"use client"`
  - Props: `warehouse?: Warehouse`, `onSuccess: () => void`
  - Esquema zod: name (min 1), address (min 1), city (min 1), country (default "Peru"), latitude (optional string), longitude (optional string), capacity_m3 (optional string)
  - Usa shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Button`
  - Llama `useCreateWarehouse` o `useUpdateWarehouse` según si `warehouse` existe

### Page
- [x] Crear `app/(dashboard)/warehouses/page.tsx`
  - `"use client"`
  - Estado local: `page`, `sheetOpen`, `editTarget`
  - Llama `useWarehouses({ page: page + 1, ordering: "name" })`
  - Renderiza `<DataTable>` con columns + pagination
  - Botón "Nuevo almacén" → `sheetOpen = true`, `editTarget = null`
  - Sheet (shadcn) con `<WarehouseForm>` dentro
  - Delete: `window.confirm` → `useDeleteWarehouse.mutate(id)`

## Validation report

- ✅ shadcn `sheet.tsx` + `dialog.tsx` instalados
- ✅ `lib/types/warehouse.ts` — `Warehouse` + `WarehousePayload` correctos
- ✅ `lib/api/endpoints/warehouses.ts` — usa `apiClient`, todos los métodos presentes
- ✅ `lib/hooks/use-warehouses.ts` — 5 hooks, `invalidateQueries(["warehouses"])` en los 3 mutations
- ✅ `app/(dashboard)/warehouses/columns.tsx` — 5 columnas + actions con onEdit/onDelete
- ✅ `app/(dashboard)/warehouses/warehouse-form.tsx` — crea/edita según `warehouse` prop
- ✅ `app/(dashboard)/warehouses/page.tsx` — Sheet controlado, window.confirm, paginación DRF
- ✅ Build TypeScript: 0 errores — ruta `/warehouses` registrada
