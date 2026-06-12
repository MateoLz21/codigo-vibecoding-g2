# Spec: Customers

## Context

Clientes de la plataforma logística. CRUD con filtro `customer_type` (company/individual). Sin dependencias de otros módulos.

## Backend contract

**Endpoint:** `/api/v1/customers/`  
**Método:** CRUD estándar. Soft delete.

**Campos:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | requerido |
| `customer_type` | `"company"` \| `"individual"` | requerido |
| `tax_id` | string\|null | opcional |
| `email` | string\|null | email, opcional |
| `phone` | string\|null | opcional |
| `address` | string\|null | opcional |
| `is_active` | boolean | soft delete vía DELETE |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Filtros:** `?customer_type=company|individual`, `?is_active=`, `?email=` (icontains), `?name=` (icontains)  
**Búsqueda:** `name`, `email`, `tax_id`  
**Ordenamiento:** `name`, `created_at`, `updated_at`  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/customers/<id>/` → 204

## Tasks

### Types
- [x] Crear `lib/types/customer.ts`
  - `Customer` — todos los campos
  - `CustomerPayload` — campos editables: name, customer_type, tax_id, email, phone, address
  - `CustomerType` — union type `"company" | "individual"`

### API
- [x] Crear `lib/api/endpoints/customers.ts`
  - `customersApi.list(params?)` → `DRFPage<Customer>`
  - `customersApi.getById(id)` → `Customer`
  - `customersApi.create(data: CustomerPayload)` → `Customer`
  - `customersApi.update(id, data: Partial<CustomerPayload>)` → `Customer`
  - `customersApi.remove(id)` → void

### Hooks
- [x] Crear `lib/hooks/use-customers.ts`
  - `useCustomers(params?)` — queryKey `["customers", params]`
  - `useCreateCustomer()` — invalida `["customers"]`
  - `useUpdateCustomer()` — invalida `["customers"]`
  - `useDeleteCustomer()` — invalida `["customers"]`

### Columns
- [x] Crear `app/(dashboard)/customers/columns.tsx`
  - Columnas: `name`, `customer_type` (Badge: "Empresa"/"Individual"), `email`, `is_active` (Badge), `actions`
  - `getColumns({ onEdit, onDelete })`

### Form
- [x] Crear `app/(dashboard)/customers/customer-form.tsx`
  - Props: `customer?: Customer`, `onSuccess: () => void`
  - Zod: name (min 1), customer_type (enum), tax_id (optional), email (optional email), phone (optional), address (optional)
  - Select para `customer_type` con opciones "Empresa" / "Individual"
  - Crea o edita según `customer` prop

### Page
- [x] Crear `app/(dashboard)/customers/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`, `typeFilter`
  - `useCustomers({ page: page + 1, customer_type: typeFilter || undefined })`
  - Toolbar: selector de `customer_type` (Todos / Empresa / Individual)
  - Botón "Nuevo cliente", Sheet con `<CustomerForm>`
  - Delete: `window.confirm` → `useDeleteCustomer.mutate(id)`
  - Reset `page` a 0 al cambiar filtro

## Validation report

All 6 tasks passed. TypeScript check clean (0 errors). Fixed: Base UI `onValueChange` signature passes `string | null` — handler updated to accept null.

| File | Status |
|------|--------|
| `lib/types/customer.ts` | ✅ |
| `lib/api/endpoints/customers.ts` | ✅ |
| `lib/hooks/use-customers.ts` | ✅ |
| `app/(dashboard)/customers/columns.tsx` | ✅ |
| `app/(dashboard)/customers/customer-form.tsx` | ✅ |
| `app/(dashboard)/customers/page.tsx` | ✅ |
