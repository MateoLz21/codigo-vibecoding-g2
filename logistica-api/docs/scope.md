# Alcance del MVP — Logística API

## Contexto

API REST de logística para gestión de envíos de productos tecnológicos. Cubre el ciclo completo desde recepción en almacén hasta entrega al cliente final. Se publica como MVP en Railway.

---

## Metodología

**Spec Driven Development (SDD)** con 4 agentes especializados:

```
Orquestador
    ├── Spec      → crea spec/{módulo}.md con tareas exactas
    ├── Implement → ejecuta las tareas en código Django
    └── Validator → verifica implementación vs spec + docs
```

Flujo por módulo:
1. Spec escribe las tareas
2. Implement ejecuta las tareas
3. Validator revisa el resultado
4. Si hay errores → Implement corrige → Validator re-revisa
5. Si no hay errores → módulo completo → siguiente módulo

---

## Alcance del MVP

### Autenticación

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/v1/auth/token/` | POST | Obtener access + refresh token JWT |
| `/api/v1/auth/token/refresh/` | POST | Renovar access token |

- Usa `auth_user` de Django sin modificación
- JWT con `djangorestframework-simplejwt`
- Todos los endpoints protegidos excepto `/auth/token/`

---

### CRUD por módulo

Cada módulo expone endpoints estándar DRF (`ModelViewSet`):

| Módulo | App | Endpoints base | Recursos anidados |
|---|---|---|---|
| Almacenes | `warehouses` | `/api/v1/warehouses/` | — |
| Proveedores | `suppliers` | `/api/v1/suppliers/` | — |
| Clientes | `customers` | `/api/v1/customers/` | — |
| Transporte | `transport` | `/api/v1/transport/` | — |
| Productos | `products` | `/api/v1/products/` | — |
| Rutas | `routes` | `/api/v1/routes/` | `/api/v1/routes/{id}/stops/` |
| Conductores | `drivers` | `/api/v1/drivers/` | — |
| Envíos | `shipments` | `/api/v1/shipments/` | `/api/v1/shipments/{id}/items/` |

Operaciones estándar por endpoint base:
- `GET /` → listar (paginado, filtrable, buscable)
- `POST /` → crear
- `GET /{id}/` → detalle
- `PUT /{id}/` → reemplazar
- `PATCH /{id}/` → actualizar parcial
- `DELETE /{id}/` → desactivar (soft delete con `is_active=False`)

---

### Orden de desarrollo (respeta grafo de dependencias)

### Fase 0 — Setup del proyecto

- Split de settings: `config/settings/base.py`, `development.py`, `production.py`
- Archivo `.env` con `SECRET_KEY`, `DEBUG`, `DATABASE_URL`
- Instalar dependencias faltantes: simplejwt, cors-headers, django-filter, drf-spectacular
- Registrar en `INSTALLED_APPS`: `rest_framework`, `corsheaders`, `django_filters`, `drf_spectacular`
- Configurar DRF en settings (auth, permisos, paginación, filtros, schema)
- Configurar JWT en settings
- Agregar endpoints de auth y docs a `config/urls.py`

### Fase 1 — Apps sin dependencias entre sí

Apps: `warehouses`, `suppliers`, `customers`, `transport`

Cada app sigue el patrón estándar:
1. `models.py` — modelo con `db_table` explícito
2. `serializers.py` — ModelSerializer
3. `views.py` — ModelViewSet
4. `urls.py` — DefaultRouter
5. `admin.py` — registro en admin
6. `filters.py` — filtros con django-filter
7. Migración generada y aplicada
8. URLs incluidas en `config/urls.py`

### Fase 2 — Apps con dependencias de Fase 1

Apps: `products` (→ suppliers, warehouses), `routes` (→ warehouses para stops)

Mismos pasos que Fase 1 + verificar FK correctas.

### Fase 3 — Drivers

App: `drivers` (→ `auth_user` OneToOne, referencia a `transport`)

Mismos pasos + manejo especial del OneToOne con `auth_user`.

### Fase 4 — Shipments

App: `shipments` (→ customers, warehouses, routes, drivers, products)

Mismos pasos + recursos nested:
- `ShipmentItemViewSet` anidado bajo `/shipments/{id}/items/`
- Cálculo de `total_cost` al confirmar envío


---

### Lógica de negocio del MVP

| Regla | Dónde | Descripción |
|---|---|---|
| Soft delete | todos los módulos | `DELETE` marca `is_active=False`, no borra |
| Precio congelado | `shipment_items` | `unit_price` se copia desde `products.unit_price` al crear |
| Peso calculado | `shipments` | `total_weight_kg` = suma de `(item.quantity × product.weight_kg)` |
| Costo calculado | `shipments` | `shipping_cost` = `total_weight_kg × 0.5` (tarifa flat MVP) |
| Stock no negativo | `products` | `stock >= 0` validado en serializer |

---

### Documentación automática

- Swagger UI: `/api/v1/docs/`
- OpenAPI schema: `/api/v1/schema/`
- Generado automáticamente por `drf-spectacular`

---

## Deployment — Railway

| Parámetro | Valor |
|---|---|
| Plataforma | Railway |
| Runtime | Python 3.14 |
| BD producción | PostgreSQL (Railway plugin) |
| Settings | `config/settings/production.py` |
| Variables de entorno | `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, `ALLOWED_HOSTS` |
| Start command | `gunicorn config.wsgi:application` |

---

## Fuera del alcance del MVP

- Roles y permisos granulares (admin vs. operador vs. conductor)
- Notificaciones (email, SMS, push)
- Tracking en tiempo real
- Historial de cambios de estado (`audit log`)
- Gestión de pagos
- Reportes y dashboards
- Integración con APIs externas (Google Maps, carriers)
