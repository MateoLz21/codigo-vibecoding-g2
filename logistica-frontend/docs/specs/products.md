# Spec: Products

## Context

Productos tecnológicos con FK a Supplier y Warehouse. Primer módulo con dependencias: requiere suppliers y warehouses ya implementados. CRUD con filtros de supplier, warehouse, rango de precio y rango de stock.

## Backend contract

**Endpoint:** `/api/v1/products/`  
**Método:** CRUD estándar. Soft delete.

**Campos de lectura:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `supplier` | `{ id: number; name: string }` | FK→Supplier, nested read |
| `warehouse` | `{ id: number; name: string }` | FK→Warehouse, nested read |
| `name` | string | requerido |
| `sku` | string | requerido, único |
| `description` | string\|null | opcional |
| `weight_kg` | string\|null | decimal, opcional |
| `unit_price` | string | decimal, requerido, > 0 |
| `stock` | number | entero, ≥ 0, default 0 |
| `is_active` | boolean | soft delete vía DELETE |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Payload de escritura:** `supplier` y `warehouse` se envían como integer IDs.

**Validaciones:** `stock >= 0`, `unit_price > 0`

**Filtros:** `?supplier=<id>`, `?warehouse=<id>`, `?is_active=`, `?stock_min=`, `?stock_max=`, `?unit_price_min=`, `?unit_price_max=`  
**Búsqueda:** `name`, `sku`, `description`  
**Ordenamiento:** `name`, `unit_price`, `stock`, `weight_kg`, `created_at`  
**Paginación:** `?page=N` → `{ count, next, previous, results[] }`  
**Soft delete:** `DELETE /api/v1/products/<id>/` → 204

## Tasks

### Types
- [x] Crear `lib/types/product.ts`
  - `ProductFK` — `{ id: number; name: string }` (usado para supplier y warehouse en lectura)
  - `Product` — todos los campos de lectura (`supplier: ProductFK`, `warehouse: ProductFK`)
  - `ProductPayload` — campos de escritura: `supplier: number`, `warehouse: number`, `name`, `sku`, `description?`, `weight_kg?`, `unit_price`, `stock?`

### API
- [x] Crear `lib/api/endpoints/products.ts`
  - `productsApi.list(params?)` → `DRFPage<Product>`
  - `productsApi.getById(id)` → `Product`
  - `productsApi.create(data: ProductPayload)` → `Product`
  - `productsApi.update(id, data: Partial<ProductPayload>)` → `Product`
  - `productsApi.remove(id)` → void

### Hooks
- [x] Crear `lib/hooks/use-products.ts`
  - `useProducts(params?)` — queryKey `["products", params]`
  - `useCreateProduct()` — invalida `["products"]`
  - `useUpdateProduct()` — invalida `["products"]`
  - `useDeleteProduct()` — invalida `["products"]`

### Columns
- [x] Crear `app/(dashboard)/products/columns.tsx`
  - Columnas: `name`, `sku`, `supplier` (supplier.name), `warehouse` (warehouse.name), `unit_price`, `stock`, `is_active` (Badge), `actions`
  - `getColumns({ onEdit, onDelete })`

### Form
- [x] Crear `app/(dashboard)/products/product-form.tsx`
  - Props: `product?: Product`, `onSuccess: () => void`
  - Zod: name (min 1), sku (min 1), supplier (number), warehouse (number), unit_price (string, decimal > 0), stock (number ≥ 0, default 0), description (optional), weight_kg (optional string)
  - Carga `useSuppliers()` y `useWarehouses()` para poblar selects
  - Select para supplier y warehouse (valor = ID como string, parseado a number en submit)
  - Crea o edita según `product` prop

### Page
- [x] Crear `app/(dashboard)/products/page.tsx`
  - Estado: `page`, `sheetOpen`, `editTarget`, `supplierFilter`, `warehouseFilter`
  - `useProducts({ page: page+1, supplier: supplierFilter||undefined, warehouse: warehouseFilter||undefined })`
  - Toolbar: Select de supplier (Todos + lista), Select de warehouse (Todos + lista)
  - Carga `useSuppliers({ page: 1 })` y `useWarehouses({ page: 1 })` para los filtros
  - Botón "Nuevo producto", Sheet con `<ProductForm>`
  - Delete: `window.confirm` → `useDeleteProduct.mutate(id)`
  - Reset `page` a 0 al cambiar filtros

## Validation report

All 6 tasks passed. TypeScript check clean (0 errors). Supplier/warehouse stored as string IDs in form, converted to number on submit.

| File | Status |
|------|--------|
| `lib/types/product.ts` | ✅ |
| `lib/api/endpoints/products.ts` | ✅ |
| `lib/hooks/use-products.ts` | ✅ |
| `app/(dashboard)/products/columns.tsx` | ✅ |
| `app/(dashboard)/products/product-form.tsx` | ✅ |
| `app/(dashboard)/products/page.tsx` | ✅ |
