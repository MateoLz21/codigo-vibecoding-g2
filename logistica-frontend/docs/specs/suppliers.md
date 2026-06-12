# Spec: Suppliers

## Context

Proveedores de productos tecnológicos. CRUD sin dependencias de otros módulos. Patrón idéntico a warehouses.

## Backend contract

**Endpoint:** `/api/v1/suppliers/`  
**Método:** CRUD estándar. Soft delete.

**Campos:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `name` | string | requerido |
| `tax_id` | string\|null | opcional |
| `email` | string\|null | email, opcional |
| `phone` | string\|null | opcional |
| `address` | string\|null | opcional |
| `contact_name` | string\|null | opcional |
| `is_active` | boolean | soft delete vía DELETE |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Filtros:** ninguno específico  
**Búsqueda:** no configurada  
**Ordenamiento:** no documentado (default: `name`)  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/suppliers/<id>/` → 204

## Tasks

### Types
- [x] Crear `lib/types/supplier.ts`
  - `Supplier` — todos los campos
  - `SupplierPayload` — campos editables: name, tax_id, email, phone, address, contact_name

### API
- [x] Crear `lib/api/endpoints/suppliers.ts`
  - `suppliersApi.list(params?)` → `DRFPage<Supplier>`
  - `suppliersApi.getById(id)` → `Supplier`
  - `suppliersApi.create(data: SupplierPayload)` → `Supplier`
  - `suppliersApi.update(id, data: Partial<SupplierPayload>)` → `Supplier`
  - `suppliersApi.remove(id)` → void

### Hooks
- [x] Crear `lib/hooks/use-suppliers.ts`
  - `useSuppliers(params?)` — queryKey `["suppliers", params]`
  - `useCreateSupplier()` — invalida `["suppliers"]`
  - `useUpdateSupplier()` — invalida `["suppliers"]`
  - `useDeleteSupplier()` — invalida `["suppliers"]`

### Columns
- [x] Crear `app/(dashboard)/suppliers/columns.tsx`
  - Columnas: `name`, `contact_name`, `email`, `phone`, `is_active` (Badge), `actions`
  - `getColumns({ onEdit, onDelete })`

### Form
- [x] Crear `app/(dashboard)/suppliers/supplier-form.tsx`
  - Props: `supplier?: Supplier`, `onSuccess: () => void`
  - Zod: name (min 1), tax_id (optional), email (optional email), phone (optional), address (optional), contact_name (optional)
  - Crea o edita según `supplier` prop

### Page
- [x] Crear `app/(dashboard)/suppliers/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`
  - `useSuppliers({ page: page + 1 })`
  - Botón "Nuevo proveedor", Sheet con `<SupplierForm>`
  - Delete: `window.confirm` → `useDeleteSupplier.mutate(id)`

## Validation report

All 6 tasks passed. TypeScript check clean (0 errors).

| File | Status |
|------|--------|
| `lib/types/supplier.ts` | ✅ |
| `lib/api/endpoints/suppliers.ts` | ✅ |
| `lib/hooks/use-suppliers.ts` | ✅ |
| `app/(dashboard)/suppliers/columns.tsx` | ✅ |
| `app/(dashboard)/suppliers/supplier-form.tsx` | ✅ |
| `app/(dashboard)/suppliers/page.tsx` | ✅ |
