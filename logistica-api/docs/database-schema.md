# Schema de Base de Datos — logistica-api

API REST de logística para gestión de envíos de productos tecnológicos.

---

## Tablas Django reutilizadas

Django genera estas tablas automáticamente. El proyecto las usa sin modificación.

| Tabla Django | Usada por |
|---|---|
| `auth_user` | `drivers.user_id` (relación 1:1) |

---

## Tablas del proyecto

### `customers`
Empresa o persona que genera envíos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(200) | NOT NULL | Nombre de la empresa o persona |
| `customer_type` | VARCHAR(10) | NOT NULL | `company` o `individual` |
| `tax_id` | VARCHAR(20) | UNIQUE, nullable | RUC o DNI |
| `email` | VARCHAR(254) | NOT NULL, UNIQUE | |
| `phone` | VARCHAR(20) | nullable | |
| `address` | TEXT | nullable | |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `warehouses`
Punto de partida y almacenamiento de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(200) | NOT NULL | |
| `address` | TEXT | NOT NULL | |
| `city` | VARCHAR(100) | NOT NULL | |
| `country` | VARCHAR(100) | NOT NULL, default='Peru' | |
| `latitude` | DECIMAL(9,6) | nullable | |
| `longitude` | DECIMAL(9,6) | nullable | |
| `capacity_m3` | DECIMAL(10,2) | nullable | Capacidad en metros cúbicos |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `suppliers`
Empresas que venden los productos tecnológicos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(200) | NOT NULL | |
| `tax_id` | VARCHAR(20) | UNIQUE, nullable | RUC del proveedor |
| `email` | VARCHAR(254) | nullable | |
| `phone` | VARCHAR(20) | nullable | |
| `address` | TEXT | nullable | |
| `contact_name` | VARCHAR(200) | nullable | Persona de contacto |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `products`
Productos tecnológicos que serán enviados.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `supplier_id` | INTEGER | FK → suppliers, NOT NULL | Proveedor del producto |
| `warehouse_id` | INTEGER | FK → warehouses, NOT NULL | Almacén donde está guardado |
| `name` | VARCHAR(200) | NOT NULL | |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Código único de producto |
| `description` | TEXT | nullable | |
| `weight_kg` | DECIMAL(8,3) | NOT NULL | Peso en kilogramos |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Precio unitario actual |
| `stock` | INTEGER | NOT NULL, default=0 | Unidades disponibles en almacén |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `drivers`
Persona asignada al transporte. Extiende `auth_user` de Django (1:1).

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `user_id` | INTEGER | FK → auth_user, UNIQUE, NOT NULL | Cuenta Django del conductor |
| `license_number` | VARCHAR(50) | UNIQUE, NOT NULL | Número de licencia de conducir |
| `license_expiry` | DATE | NOT NULL | Fecha de vencimiento de licencia |
| `phone` | VARCHAR(20) | nullable | |
| `is_available` | BOOLEAN | NOT NULL, default=True | Disponible para asignación |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `transport`
Vehículo utilizado para entregar productos al cliente.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `driver_id` | INTEGER | FK → drivers, nullable | Conductor asignado actualmente |
| `plate_number` | VARCHAR(20) | UNIQUE, NOT NULL | Placa del vehículo |
| `vehicle_type` | VARCHAR(20) | NOT NULL | `truck`, `van`, `motorcycle` |
| `brand` | VARCHAR(100) | nullable | Marca del vehículo |
| `model` | VARCHAR(100) | nullable | Modelo del vehículo |
| `year` | INTEGER | nullable | Año de fabricación |
| `max_capacity_kg` | DECIMAL(10,2) | NOT NULL | Capacidad máxima de carga en kg |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `routes`
Secuencia de paradas que sigue un transporte.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `name` | VARCHAR(200) | NOT NULL | Nombre descriptivo de la ruta |
| `origin_warehouse_id` | INTEGER | FK → warehouses, NOT NULL | Almacén de salida |
| `estimated_duration_hours` | DECIMAL(5,2) | nullable | Duración total estimada en horas |
| `is_active` | BOOLEAN | NOT NULL, default=True | |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

---

### `route_stops`
Paradas individuales de una ruta, en orden.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `route_id` | INTEGER | FK → routes, NOT NULL | Ruta a la que pertenece |
| `stop_order` | INTEGER | NOT NULL | Orden de la parada (1, 2, 3…) |
| `address` | TEXT | NOT NULL | Dirección de la parada |
| `city` | VARCHAR(100) | NOT NULL | |
| `latitude` | DECIMAL(9,6) | nullable | |
| `longitude` | DECIMAL(9,6) | nullable | |
| `estimated_arrival` | TIME | nullable | Hora estimada de llegada |

---

### `shipments`
Unidad central de negocio. Representa un envío completo de productos a un cliente.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `customer_id` | INTEGER | FK → customers, NOT NULL | Cliente que genera el envío |
| `transport_id` | INTEGER | FK → transport, nullable | Vehículo asignado (al confirmar) |
| `route_id` | INTEGER | FK → routes, nullable | Ruta asignada |
| `origin_warehouse_id` | INTEGER | FK → warehouses, NOT NULL | Almacén de origen |
| `status` | VARCHAR(20) | NOT NULL, default='pending' | `pending`, `in_transit`, `delivered`, `cancelled` |
| `origin_address` | TEXT | NOT NULL | Dirección de recogida |
| `destination_address` | TEXT | NOT NULL | Dirección de entrega |
| `shipping_date` | DATE | nullable | Fecha programada de envío |
| `estimated_delivery_date` | DATE | nullable | Fecha estimada de entrega |
| `actual_delivery_date` | DATE | nullable | Fecha real de entrega (al completar) |
| `total_weight_kg` | DECIMAL(10,3) | NOT NULL, default=0 | Suma del peso de todos los items |
| `shipping_cost` | DECIMAL(10,2) | NOT NULL, default=0 | Costo calculado del envío |
| `notes` | TEXT | nullable | Observaciones adicionales |
| `created_at` | DATETIME | NOT NULL, auto | |
| `updated_at` | DATETIME | NOT NULL, auto | |

> `total_weight_kg` y `shipping_cost` se calculan en código al agregar o modificar `shipment_items`.

---

### `shipment_items`
Productos incluidos en un envío. Congela el precio unitario al momento del envío.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement | |
| `shipment_id` | INTEGER | FK → shipments, NOT NULL | |
| `product_id` | INTEGER | FK → products, NOT NULL | |
| `quantity` | INTEGER | NOT NULL | Cantidad de unidades |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Precio al momento del envío |
| `subtotal` | DECIMAL(10,2) | NOT NULL | `quantity × unit_price` |

---

## Relaciones

```
auth_user ──────────────── drivers              (1:1)

suppliers ──────────────── products             (1:N)
warehouses ─────────────── products             (1:N, almacén donde está el producto)

warehouses ─────────────── routes               (1:N, almacén de origen)
routes ─────────────────── route_stops          (1:N)

drivers ────────────────── transport            (1:N, conductor asignado al vehículo)

customers ──────────────── shipments            (1:N)
warehouses ─────────────── shipments            (1:N, almacén de origen del envío)
transport ──────────────── shipments            (1:N)
routes ─────────────────── shipments            (1:N)

shipments ──────────────── shipment_items       (1:N)
products ───────────────── shipment_items       (1:N)
```

---

## Diagrama de dependencias

```
auth_user
    └── drivers
            └── transport
                    └── shipments ◄── customers
                            │         ◄── warehouses ◄── routes ◄── route_stops
                            │         ◄── routes
                            └── shipment_items ◄── products ◄── suppliers
                                                               ◄── warehouses
```
