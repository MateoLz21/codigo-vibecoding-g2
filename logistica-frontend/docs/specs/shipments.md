# Spec: Shipments

## Context

Envíos — entidad central del sistema. Deps: customers, transport, routes, warehouses, products. Tiene lista (`/shipments`) y detalle (`/shipments/[id]`). Totales calculados por backend (read-only). Items con precio congelado al crear. Cambio de status inline en detalle. Borrado físico en items.

## Backend contract

**Endpoint envíos:** `/api/v1/shipments/`  
**Método:** CRUD estándar. Soft delete.

**Campos de envío (lectura):**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `customer` | `{ id, name }` | FK→Customer, nested |
| `transport` | `{ id, plate_number }` \| null | FK→Transport, opcional |
| `route` | `{ id, name }` \| null | FK→Route, opcional |
| `origin_warehouse` | `{ id, name }` | FK→Warehouse |
| `status` | `"pending"` \| `"in_transit"` \| `"delivered"` \| `"cancelled"` | default `pending` |
| `origin_address` | string | requerido |
| `destination_address` | string | requerido |
| `shipping_date` | string | date ISO, requerido |
| `estimated_delivery_date` | string\|null | date ISO, opcional |
| `actual_delivery_date` | string\|null | date ISO, opcional |
| `total_weight_kg` | string | **read-only**, calculado |
| `shipping_cost` | string | **read-only**, calculado |
| `notes` | string\|null | opcional |
| `is_active` | boolean | soft delete |
| `created_at` | string | read-only |
| `updated_at` | string | read-only |

**Payload de escritura (shipment):** `customer`, `origin_warehouse`, `transport`, `route` enviados como integer IDs.

**Filtros:** `?status=`, `?customer=<id>`, `?shipping_date__gte=`, `?shipping_date__lte=`  
**Búsqueda:** `origin_address`, `destination_address`, `customer__name`  
**Ordenamiento:** `created_at`, `shipping_date`, `shipping_cost`, `total_weight_kg`  
**Paginación:** `?page=N`  
**Soft delete:** `DELETE /api/v1/shipments/<id>/` → 204

---

**Endpoint items:** `/api/v1/shipments/<shipment_pk>/items/`  
**Borrado físico** + recalcula totales del envío padre.

**Campos de item:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | number | read-only |
| `shipment` | number | read-only |
| `product` | `{ id, name, sku }` | FK→Product, nested |
| `quantity` | number | ≥ 1 |
| `unit_price` | string | read-only, congelado al crear |
| `subtotal` | string | read-only, `quantity × unit_price` |

**Payload de escritura (item):** `product` como integer ID, `quantity` como number.

## Tasks

### Types
- [x] Crear `lib/types/shipment.ts`
  - `ShipmentStatus` — union `"pending" | "in_transit" | "delivered" | "cancelled"`
  - `ShipmentCustomer`, `ShipmentTransport`, `ShipmentRoute`, `ShipmentWarehouse` — FK nested shapes
  - `ShipmentProduct` — `{ id: number; name: string; sku: string }`
  - `ShipmentItem` — todos los campos de item
  - `Shipment` — todos los campos de envío
  - `ShipmentPayload` — campos de escritura (FKs como number IDs, sin totales)
  - `ShipmentItemPayload` — `{ product: number; quantity: number }`

### API
- [x] Crear `lib/api/endpoints/shipments.ts`
  - `shipmentsApi.list(params?)` → `DRFPage<Shipment>`
  - `shipmentsApi.getById(id)` → `Shipment`
  - `shipmentsApi.create(data: ShipmentPayload)` → `Shipment`
  - `shipmentsApi.update(id, data: Partial<ShipmentPayload>)` → `Shipment`
  - `shipmentsApi.remove(id)` → void
  - `shipmentsApi.createItem(shipmentId, data: ShipmentItemPayload)` → `ShipmentItem`
  - `shipmentsApi.updateItem(shipmentId, itemId, data: Partial<ShipmentItemPayload>)` → `ShipmentItem`
  - `shipmentsApi.removeItem(shipmentId, itemId)` → void

### Hooks
- [x] Crear `lib/hooks/use-shipments.ts`
  - `useShipments(params?)` — queryKey `["shipments", params]`
  - `useShipment(id)` — queryKey `["shipment", id]`
  - `useCreateShipment()` — invalida `["shipments"]`
  - `useUpdateShipment()` — invalida `["shipments"]` y `["shipment", id]`
  - `useDeleteShipment()` — invalida `["shipments"]`
  - `useCreateShipmentItem(shipmentId)` — invalida `["shipment", shipmentId]`
  - `useUpdateShipmentItem(shipmentId)` — invalida `["shipment", shipmentId]`
  - `useDeleteShipmentItem(shipmentId)` — invalida `["shipment", shipmentId]`

### Columns (list)
- [x] Crear `app/(dashboard)/shipments/columns.tsx`
  - Columnas: `customer` (customer.name), `status` (Badge coloreado), `shipping_date`, `total_weight_kg`, `shipping_cost`, `actions` (Detalle + Eliminar)
  - Status: pending→outline "Pendiente", in_transit→default "En tránsito", delivered→secondary "Entregado", cancelled→destructive "Cancelado"
  - `getColumns({ onDelete })` — "Detalle" navega a `/shipments/[id]`

### Form (shipment)
- [x] Crear `app/(dashboard)/shipments/shipment-form.tsx`
  - Props: `shipment?: Shipment`, `onSuccess: () => void`
  - Campos requeridos: customer (Select), origin_warehouse (Select), origin_address, destination_address, shipping_date (date input)
  - Campos opcionales: transport (Select), route (Select), estimated_delivery_date (date), notes
  - Carga `useCustomers()`, `useWarehouses()`, `useTransport()`, `useRoutes()` para poblar selects
  - Zod: customer (string→number), origin_warehouse (string→number), origin_address (min 1), destination_address (min 1), shipping_date (min 1), transport (optional), route (optional)

### Page (list)
- [x] Crear `app/(dashboard)/shipments/page.tsx`
  - Estado: `page`, `sheetOpen`, `statusFilter`
  - `useShipments({ page: page+1, status: statusFilter||undefined })`
  - Toolbar: Select de status (Todos / Pendiente / En tránsito / Entregado / Cancelado)
  - Botón "Nuevo envío", Sheet con `<ShipmentForm>`
  - Delete: `window.confirm` → `useDeleteShipment.mutate(id)`
  - Reset `page` a 0 al cambiar filtro

### Item form
- [x] Crear `app/(dashboard)/shipments/[id]/item-form.tsx`
  - Props: `shipmentId: number`, `item?: ShipmentItem`, `onSuccess: () => void`
  - Zod: product (string→number), quantity (number ≥ 1)
  - Select para product (carga `useProducts()`)
  - En edición: product deshabilitado (solo editar quantity)

### Detail page
- [x] Crear `app/(dashboard)/shipments/[id]/page.tsx`
  - Carga `useShipment(id)`
  - Muestra: info del envío, status badge, totales read-only (total_weight_kg, shipping_cost)
  - Selector de status inline: Select → `useUpdateShipment().mutate({id, data: {status}})`
  - Tabla de items: columnas product.name, product.sku, quantity, unit_price, subtotal, acciones
  - Sheet para crear/editar items con `<ItemForm>`
  - Delete item: `window.confirm` → `useDeleteShipmentItem(shipmentId).mutate(itemId)`

## Validation report

All 8 tasks passed. TypeScript check clean (0 errors). Added `items?: ShipmentItem[]` to `Shipment` type (backend includes items in GET detail). Status change via inline Select calls `useUpdateShipment` directly. Item form disables product select on edit mode.

| File | Status |
|------|--------|
| `lib/types/shipment.ts` | ✅ |
| `lib/api/endpoints/shipments.ts` | ✅ |
| `lib/hooks/use-shipments.ts` | ✅ |
| `app/(dashboard)/shipments/columns.tsx` | ✅ |
| `app/(dashboard)/shipments/shipment-form.tsx` | ✅ |
| `app/(dashboard)/shipments/page.tsx` | ✅ |
| `app/(dashboard)/shipments/[id]/item-form.tsx` | ✅ |
| `app/(dashboard)/shipments/[id]/page.tsx` | ✅ |
