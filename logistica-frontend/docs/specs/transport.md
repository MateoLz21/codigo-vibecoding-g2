# Spec: Transport

## Context

Vehículos de transporte logístico. CRUD con filtro `vehicle_type` (truck/van/motorcycle). El campo `driver` es FK opcional a Driver (módulo posterior). Sin dependencias requeridas para el CRUD básico.

## Backend contract

**Endpoint:** `/api/v1/transport/`  
**Método:** CRUD estándar. Soft delete.

**Campos:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `plate_number` | string | requerido, único |
| `vehicle_type` | `"truck"` \| `"van"` \| `"motorcycle"` | requerido |
| `brand` | string | requerido |
| `model` | string | requerido |
| `year` | number | requerido |
| `max_capacity_kg` | string\|null | decimal, opcional |
| `driver` | FK→Driver, nullable | opcional, no se gestiona en este módulo |
| `is_active` | boolean | soft delete vía DELETE |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Filtros:** `?vehicle_type=truck|van|motorcycle`  
**Búsqueda:** no documentada  
**Ordenamiento:** no documentado  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/transport/<id>/` → 204

## Tasks

### Types
- [x] Crear `lib/types/transport.ts`
  - `VehicleType` — union type `"truck" | "van" | "motorcycle"`
  - `Transport` — todos los campos
  - `TransportPayload` — campos editables: plate_number, vehicle_type, brand, model, year, max_capacity_kg

### API
- [x] Crear `lib/api/endpoints/transport.ts`
  - `transportApi.list(params?)` → `DRFPage<Transport>`
  - `transportApi.getById(id)` → `Transport`
  - `transportApi.create(data: TransportPayload)` → `Transport`
  - `transportApi.update(id, data: Partial<TransportPayload>)` → `Transport`
  - `transportApi.remove(id)` → void

### Hooks
- [x] Crear `lib/hooks/use-transport.ts`
  - `useTransport(params?)` — queryKey `["transport", params]`
  - `useCreateTransport()` — invalida `["transport"]`
  - `useUpdateTransport()` — invalida `["transport"]`
  - `useDeleteTransport()` — invalida `["transport"]`

### Columns
- [x] Crear `app/(dashboard)/transport/columns.tsx`
  - Columnas: `plate_number`, `vehicle_type` (Badge), `brand`, `max_capacity_kg`, `is_active` (Badge), `actions`
  - Badge labels: truck→"Camión", van→"Furgoneta", motorcycle→"Moto"
  - `getColumns({ onEdit, onDelete })`

### Form
- [x] Crear `app/(dashboard)/transport/transport-form.tsx`
  - Props: `transport?: Transport`, `onSuccess: () => void`
  - Zod: plate_number (min 1), vehicle_type (enum), brand (min 1), model (min 1), year (number int min 1900), max_capacity_kg (optional string)
  - Select para `vehicle_type` con opciones Camión / Furgoneta / Moto
  - Crea o edita según `transport` prop

### Page
- [x] Crear `app/(dashboard)/transport/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`, `typeFilter`
  - `useTransport({ page: page + 1, vehicle_type: typeFilter || undefined })`
  - Toolbar: selector de `vehicle_type` (Todos / Camión / Furgoneta / Moto)
  - Botón "Nuevo vehículo", Sheet con `<TransportForm>`
  - Delete: `window.confirm` → `useDeleteTransport.mutate(id)`
  - Reset `page` a 0 al cambiar filtro

## Validation report

All 6 tasks passed. TypeScript check clean (0 errors).

| File | Status |
|------|--------|
| `lib/types/transport.ts` | ✅ |
| `lib/api/endpoints/transport.ts` | ✅ |
| `lib/hooks/use-transport.ts` | ✅ |
| `app/(dashboard)/transport/columns.tsx` | ✅ |
| `app/(dashboard)/transport/transport-form.tsx` | ✅ |
| `app/(dashboard)/transport/page.tsx` | ✅ |
