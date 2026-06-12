# Backend Overview — logistica-api

Django REST Framework API para gestión logística de productos tecnológicos.

## Base

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8000/api/v1/` |
| Auth | JWT Bearer (`Authorization: Bearer <token>`) |
| Access token TTL | 1 hora |
| Refresh token TTL | 7 días |
| Paginación | PageNumber, 20 items/página |
| OpenAPI docs | `GET /api/v1/docs/` |
| OpenAPI schema | `GET /api/v1/schema/` |

Todos los endpoints requieren token. Sin excepción.

## Módulos (8) + Auth

Orden de dependencias:

```
Fase 1 (sin deps):   warehouses · suppliers · customers · transport
Fase 2 (→ fase 1):   products(→supplier,→warehouse) · routes(→warehouse)
Fase 2/3:            drivers(→User)
Fase 4 (→ todo):     shipments(→customer,transport,route,warehouse)
```

| Módulo | Ruta base | Soft delete |
|--------|-----------|-------------|
| auth | `/auth/token/` | — |
| warehouses | `/warehouses/` | ✓ `is_active=False` |
| suppliers | `/suppliers/` | ✓ `is_active=False` |
| customers | `/customers/` | ✓ `is_active=False` |
| transport | `/transport/` | ✓ `is_active=False` |
| drivers | `/drivers/` | ✓ `user.is_active=False` |
| products | `/products/` | ✓ `is_active=False` |
| routes | `/routes/` | ✓ `is_active=False` |
| route-stops | `/routes/<id>/stops/` | ✗ borrado físico |
| shipments | `/shipments/` | ✓ `is_active=False` |
| shipment-items | `/shipments/<id>/items/` | ✗ borrado físico |

## Patrones globales

- `DELETE` en recursos con `is_active` → 204 sin borrar el registro
- `DELETE` en stops y shipment-items → borrado físico real
- `GET` de listas solo retorna registros activos (`is_active=True`)
- Query params soportados globalmente: `?search=`, `?ordering=`, `?page=`
- Filtros específicos por módulo: ver `docs/endpoints.md`

## Stack técnico

- Django + DRF + SimpleJWT + django-filters + drf-spectacular
- CORS habilitado (`corsheaders`)
- Zona horaria: `America/Lima`
