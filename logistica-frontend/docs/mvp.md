# MVP — logistica-frontend

Sistema de gestión logística para productos tecnológicos. Un módulo a la vez, usando metodología SDD.

## Orden de módulos

El orden respeta las dependencias del backend (ver `docs/backend-overview.md`).

| # | Módulo | Estado | Deps | Alcance |
|---|--------|--------|------|---------|
| 1 | auth | ✅ completado | — | Login form, logout, JWT storage, refresh automático vía interceptor |
| 2 | warehouses | ✅ completado | — | CRUD completo con tabla, filtros y formulario |
| 3 | suppliers | ✅ completado | — | CRUD completo con tabla, filtros y formulario |
| 4 | customers | ✅ completado | — | CRUD + filtro `customer_type` (company/individual) |
| 5 | transport | ✅ completado | — | CRUD + filtro `vehicle_type` (truck/van/motorcycle) |
| 6 | drivers | ✅ completado | — | CRUD + visualización del usuario Django vinculado |
| 7 | products | ✅ completado | warehouses, suppliers | CRUD + filtros precio/stock + selector supplier/warehouse |
| 8 | routes | ✅ completado | warehouses | CRUD + gestión inline de stops anidados |
| 9 | shipments | ✅ completado | customers, transport, routes, warehouses | CRUD + items anidados + cambio de status + totales read-only |

## Estados

- ⬜ pendiente — no iniciado
- 🔄 en progreso — spec aprobado, en implementación
- ✅ completado — validado por `/validator`

---

## Alcance por módulo

### 1. auth
- `/login` — formulario con validación (react-hook-form + zod)
- Guarda `accessToken` (memoria) y `refreshToken` (localStorage) en Zustand
- Logout: limpia store y redirige a `/login`
- Interceptor axios maneja refresh automático en 401

### 2. warehouses
- Lista: tabla con columnas name, city, country, capacity_m3, is_active
- Crear/editar: formulario en sheet/modal
- Soft delete con confirmación
- Búsqueda y ordenamiento

### 3. suppliers
- Lista: tabla con columnas name, contact_name, email, phone, is_active
- Crear/editar: formulario
- Soft delete con confirmación

### 4. customers
- Lista: tabla con columnas name, customer_type (badge), email, is_active
- Filtro por customer_type en toolbar
- Crear/editar: formulario con select de customer_type
- Soft delete con confirmación

### 5. transport
- Lista: tabla con columnas plate_number, vehicle_type (badge), brand, max_capacity_kg, is_active
- Filtro por vehicle_type
- Crear/editar: formulario
- Soft delete con confirmación

### 6. drivers
- Lista: tabla con columnas license_number, nombre completo (vía user), license_expiry, is_available
- Crear/editar: formulario + creación de User Django vinculado
- Soft delete con confirmación

### 7. products
- Lista: tabla con columnas name, sku, supplier, warehouse, unit_price, stock, is_active
- Filtros: supplier, warehouse, rango precio, rango stock
- Crear/editar: formulario con selects de supplier/warehouse
- Soft delete con confirmación

### 8. routes
- Lista: tabla con columnas name, origin_warehouse, estimated_duration_hours, is_active
- Detalle: muestra stops anidados en tabla secundaria
- Crear/editar stops inline
- Soft delete en routes; borrado físico en stops

### 9. shipments
- Lista: tabla con columnas customer, status (badge coloreado), shipping_date, total_weight_kg, shipping_cost
- Filtros: status, customer, fecha
- Detalle: muestra items anidados con subtotales
- Cambio de status con selector
- Totales (total_weight_kg, shipping_cost) son read-only — calculados por el backend
- Crear/editar items; borrado físico en items

---

## Convenciones de rutas (URL)

```
/login
/warehouses          ← lista
/warehouses/new      ← crear (o via sheet)
/warehouses/[id]     ← editar (o via sheet)
/suppliers
/customers
/transport
/drivers
/products
/routes
/routes/[id]         ← detalle con stops
/shipments
/shipments/[id]      ← detalle con items
```
