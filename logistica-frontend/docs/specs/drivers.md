# Spec: Drivers

## Context

Conductores vinculados a usuarios Django (OneToOne→User). CRUD con visualización de datos del usuario. Soft delete marca `user.is_active=False`. Sin dependencias de otros módulos del frontend. El formulario crea/actualiza el User vinculado junto con el Driver.

## Backend contract

**Endpoint:** `/api/v1/drivers/`  
**Método:** CRUD estándar. Soft delete vía `user.is_active=False`.

**Campos de lectura:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `user` | object | `{ id, username, first_name, last_name, email }` |
| `license_number` | string | requerido, único |
| `license_expiry` | string | date ISO (YYYY-MM-DD), requerido |
| `phone` | string\|null | opcional |
| `is_available` | boolean | default true |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Payload de escritura (POST):**
```json
{
  "user": { "username": "string", "password": "string", "first_name": "string", "last_name": "string", "email": "string" },
  "license_number": "string",
  "license_expiry": "YYYY-MM-DD",
  "phone": "string|null",
  "is_available": true
}
```

**Payload de escritura (PATCH):**
```json
{
  "user": { "first_name": "string", "last_name": "string", "email": "string" },
  "license_number": "string",
  "license_expiry": "YYYY-MM-DD",
  "phone": "string|null",
  "is_available": true
}
```

**Búsqueda:** `license_number`, `user__first_name`, `user__last_name`, `user__email`  
**Ordenamiento:** `license_number`, `license_expiry`, `created_at`  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/drivers/<id>/` → 204 (marca `user.is_active=False`)

## Tasks

### Types
- [x] Crear `lib/types/driver.ts`
  - `DriverUser` — `{ id: number; username: string; first_name: string; last_name: string; email: string }`
  - `Driver` — todos los campos de lectura
  - `DriverUserPayload` — `{ username?: string; password?: string; first_name: string; last_name: string; email: string }`
  - `DriverPayload` — `{ user: DriverUserPayload; license_number: string; license_expiry: string; phone?: string | null; is_available?: boolean }`

### API
- [x] Crear `lib/api/endpoints/drivers.ts`
  - `driversApi.list(params?)` → `DRFPage<Driver>`
  - `driversApi.getById(id)` → `Driver`
  - `driversApi.create(data: DriverPayload)` → `Driver`
  - `driversApi.update(id, data: Partial<DriverPayload>)` → `Driver`
  - `driversApi.remove(id)` → void

### Hooks
- [x] Crear `lib/hooks/use-drivers.ts`
  - `useDrivers(params?)` — queryKey `["drivers", params]`
  - `useCreateDriver()` — invalida `["drivers"]`
  - `useUpdateDriver()` — invalida `["drivers"]`
  - `useDeleteDriver()` — invalida `["drivers"]`

### Columns
- [x] Crear `app/(dashboard)/drivers/columns.tsx`
  - Columnas: `license_number`, nombre completo (`user.first_name + ' ' + user.last_name`), `license_expiry`, `is_available` (Badge: "Disponible"/"No disponible"), `actions`
  - `getColumns({ onEdit, onDelete })`

### Form
- [x] Crear `app/(dashboard)/drivers/driver-form.tsx`
  - Props: `driver?: Driver`, `onSuccess: () => void`
  - Campos usuario: first_name (min 1), last_name (min 1), email (email), username (min 1, solo en create), password (min 6, solo en create)
  - Campos driver: license_number (min 1), license_expiry (date string), phone (optional), is_available (boolean, default true)
  - En modo edición: ocultar username y password
  - Crea o edita según `driver` prop

### Page
- [x] Crear `app/(dashboard)/drivers/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`
  - `useDrivers({ page: page + 1 })`
  - Botón "Nuevo conductor", Sheet con `<DriverForm>`
  - Delete: `window.confirm` → `useDeleteDriver.mutate(id)`

## Validation report

All 6 tasks passed. TypeScript check clean (0 errors). Two separate zod schemas (create/edit) to handle conditional username+password fields.

| File | Status |
|------|--------|
| `lib/types/driver.ts` | ✅ |
| `lib/api/endpoints/drivers.ts` | ✅ |
| `lib/hooks/use-drivers.ts` | ✅ |
| `app/(dashboard)/drivers/columns.tsx` | ✅ |
| `app/(dashboard)/drivers/driver-form.tsx` | ✅ |
| `app/(dashboard)/drivers/page.tsx` | ✅ |
