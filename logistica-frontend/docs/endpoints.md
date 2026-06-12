# Endpoints Reference — logistica-api

Base: `http://localhost:8000/api/v1/`  
Auth header: `Authorization: Bearer <access_token>`

---

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/token/` | `{username, password}` | `{access, refresh}` |
| POST | `/auth/token/refresh/` | `{refresh}` | `{access}` |

---

## Warehouses `/warehouses/`

CRUD estándar. Soft delete.

**Campos:** `id`, `name`, `address`, `city`, `country` (default: "Peru"), `latitude`, `longitude`, `capacity_m3`, `is_active`, `created_at`, `updated_at`

**Filtros:** ninguno específico  
**Búsqueda:** no configurada  
**Ordenamiento:** `name`, `city`

---

## Suppliers `/suppliers/`

CRUD estándar. Soft delete.

**Campos:** `id`, `name`, `tax_id`, `email`, `phone`, `address`, `contact_name`, `is_active`, `created_at`, `updated_at`

---

## Customers `/customers/`

CRUD estándar. Soft delete.

**Campos:** `id`, `name`, `customer_type` (`company`|`individual`), `tax_id`, `email`, `phone`, `address`, `is_active`, `created_at`, `updated_at`

**Filtros:** `?customer_type=`, `?is_active=`, `?email=` (icontains), `?name=` (icontains)  
**Búsqueda:** `name`, `email`, `tax_id`  
**Ordenamiento:** `name`, `created_at`, `updated_at`

---

## Transport `/transport/`

CRUD estándar. Soft delete.

**Campos:** `id`, `driver` (FK→Driver, nullable), `plate_number`, `vehicle_type` (`truck`|`van`|`motorcycle`), `brand`, `model`, `year`, `max_capacity_kg`, `is_active`, `created_at`, `updated_at`

---

## Drivers `/drivers/`

CRUD estándar. Soft delete vía `user.is_active=False`.

**Campos:** `id`, `user` (OneToOne→User), `license_number`, `license_expiry`, `phone`, `is_available`, `created_at`, `updated_at`

**Búsqueda:** `license_number`, `user__first_name`, `user__last_name`, `user__email`  
**Ordenamiento:** `license_number`, `license_expiry`, `created_at`

---

## Products `/products/`

CRUD estándar. Soft delete.

**Campos:** `id`, `supplier` (FK→Supplier), `warehouse` (FK→Warehouse), `name`, `sku`, `description`, `weight_kg`, `unit_price`, `stock`, `is_active`, `created_at`, `updated_at`

**Validaciones:** `stock >= 0`, `unit_price > 0`

**Filtros:** `?supplier=<id>`, `?warehouse=<id>`, `?is_active=`, `?stock_min=`, `?stock_max=`, `?unit_price_min=`, `?unit_price_max=`  
**Búsqueda:** `name`, `sku`, `description`  
**Ordenamiento:** `name`, `unit_price`, `stock`, `weight_kg`, `created_at`

---

## Routes `/routes/`

CRUD estándar. Soft delete.

**Campos:** `id`, `name`, `origin_warehouse` (FK→Warehouse), `estimated_duration_hours`, `is_active`, `created_at`, `updated_at`, `stops` (nested read-only)

**Búsqueda:** `name`  
**Ordenamiento:** `name`, `created_at`, `estimated_duration_hours`

### Route Stops `/routes/<route_pk>/stops/`

CRUD estándar. **Borrado físico** (no soft delete).

**Campos:** `id`, `route` (read-only, desde URL), `stop_order`, `address`, `city`, `latitude`, `longitude`, `estimated_arrival`

---

## Shipments `/shipments/`

CRUD estándar. Soft delete.

**Campos:** `id`, `customer` (FK→Customer), `transport` (FK→Transport, nullable), `route` (FK→Route, nullable), `origin_warehouse` (FK→Warehouse), `status` (`pending`|`in_transit`|`delivered`|`cancelled`, default: `pending`), `origin_address`, `destination_address`, `shipping_date`, `estimated_delivery_date`, `actual_delivery_date`, `total_weight_kg` (read-only), `shipping_cost` (read-only), `notes`, `is_active`, `created_at`, `updated_at`

**Filtros:** `?status=`, `?customer=<id>`, `?transport=<id>`, `?route=<id>`, `?origin_warehouse=<id>`, `?shipping_date=`, `?shipping_date__gte=`, `?shipping_date__lte=`, `?estimated_delivery_date=`  
**Búsqueda:** `origin_address`, `destination_address`, `customer__name`  
**Ordenamiento:** `created_at`, `shipping_date`, `shipping_cost`, `total_weight_kg`

### Shipment Items `/shipments/<shipment_pk>/items/`

CRUD estándar. **Borrado físico** + recalcula totales del envío padre.

**Campos:** `id`, `shipment` (auto desde URL), `product` (FK→Product), `quantity` (≥1), `unit_price` (read-only, congelado), `subtotal` (read-only)

**Lógica de negocio (ver `docs/business-logic.md`):**
- `unit_price` se congela desde `product.unit_price` al crear el ítem
- `subtotal = quantity × unit_price`
- Al crear/actualizar/borrar un ítem → recalcula `total_weight_kg` y `shipping_cost` del envío padre
