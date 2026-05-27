# Arquitectura de Desarrollo — Logística API MVP

## Stack técnico

| Componente           | Tecnología                    | Versión |
| -------------------- | ----------------------------- | ------- |
| Runtime              | Python                        | 3.14    |
| Framework web        | Django                        | 6.0.5   |
| API REST             | Django REST Framework         | 3.17.1  |
| Autenticación        | djangorestframework-simplejwt | latest  |
| Documentación API    | drf-spectacular               | latest  |
| Filtrado             | django-filter                 | latest  |
| CORS                 | django-cors-headers           | latest  |
| Variables de entorno | python-decouple               | 3.8     |
| BD desarrollo        | SQLite                        | —       |
| BD producción        | PostgreSQL                    | —       |

---

## Estructura de carpetas

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          ← settings comunes a todos los entornos
│   │   ├── development.py   ← SQLite, DEBUG=True
│   │   └── production.py    ← PostgreSQL, DEBUG=False
│   ├── urls.py              ← URL raíz del proyecto
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                    ← todas las apps de dominio
│   ├── customers/
│   ├── warehouses/
│   ├── suppliers/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   └── shipments/
│
├── docs/
│   ├── database-schema.md   ← referencia del schema de BD
│   └── architecture.md      ← este archivo
│
├── .env                     ← variables de entorno (nunca commitear)
├── .env.example             ← plantilla de variables (sí commitear)
├── manage.py
└── requirements/
    ├── base.txt             ← dependencias comunes
    ├── development.txt      ← dependencias de desarrollo
    └── production.txt       ← dependencias de producción
```

---

## Estructura interna de cada app

Todas las apps de dominio siguen el mismo patrón:

```
apps/<nombre>/
├── __init__.py
├── apps.py
├── admin.py          ← registro en Django Admin
├── models.py         ← modelo Django (según docs/database-schema.md)
├── serializers.py    ← serializers DRF
├── views.py          ← ViewSets DRF
├── urls.py           ← router local de la app
├── filters.py        ← filtros django-filter
├── migrations/
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

---

## Configuración DRF (`settings/base.py`)

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

## Endpoints — `/api/v1/`

| Módulo            | Endpoint                        | Métodos                 |
| ----------------- | ------------------------------- | ----------------------- |
| Auth              | `/api/v1/auth/token/`           | POST                    |
| Auth              | `/api/v1/auth/token/refresh/`   | POST                    |
| Clientes          | `/api/v1/customers/`            | GET, POST               |
| Clientes          | `/api/v1/customers/{id}/`       | GET, PUT, PATCH, DELETE |
| Almacenes         | `/api/v1/warehouses/`           | GET, POST               |
| Almacenes         | `/api/v1/warehouses/{id}/`      | GET, PUT, PATCH, DELETE |
| Proveedores       | `/api/v1/suppliers/`            | GET, POST               |
| Proveedores       | `/api/v1/suppliers/{id}/`       | GET, PUT, PATCH, DELETE |
| Productos         | `/api/v1/products/`             | GET, POST               |
| Productos         | `/api/v1/products/{id}/`        | GET, PUT, PATCH, DELETE |
| Transporte        | `/api/v1/transport/`            | GET, POST               |
| Transporte        | `/api/v1/transport/{id}/`       | GET, PUT, PATCH, DELETE |
| Conductores       | `/api/v1/drivers/`              | GET, POST               |
| Conductores       | `/api/v1/drivers/{id}/`         | GET, PUT, PATCH, DELETE |
| Rutas             | `/api/v1/routes/`               | GET, POST               |
| Rutas             | `/api/v1/routes/{id}/`          | GET, PUT, PATCH, DELETE |
| Paradas de ruta   | `/api/v1/routes/{id}/stops/`    | GET, POST               |
| Envíos            | `/api/v1/shipments/`            | GET, POST               |
| Envíos            | `/api/v1/shipments/{id}/`       | GET, PUT, PATCH, DELETE |
| Ítems de envío    | `/api/v1/shipments/{id}/items/` | GET, POST               |
| Docs (OpenAPI)    | `/api/v1/schema/`               | GET                     |
| Docs (Swagger UI) | `/api/v1/docs/`                 | GET                     |

---

## Patrón de implementación por app

Ejemplo con `customers` — todas las apps replican este patrón:

**`models.py`**

```python
class Customer(models.Model):
    COMPANY = 'COMPANY'
    INDIVIDUAL = 'INDIVIDUAL'
    TYPE_CHOICES = [(COMPANY, 'Company'), (INDIVIDUAL, 'Individual')]

    name = models.CharField(max_length=255)
    customer_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=COMPANY)
    # ... resto de campos según database-schema.md
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
```

**`serializers.py`**

```python
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**`views.py`**

```python
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    filterset_fields = ['customer_type', 'city', 'country']
    search_fields = ['name', 'email', 'tax_id']
    ordering_fields = ['name', 'created_at']
```

**`urls.py`**

```python
router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
urlpatterns = router.urls
```

---

## Orden de desarrollo (grafo de dependencias del schema)

```
Fase 1 — Sin dependencias entre apps propias
  ├── warehouses
  ├── suppliers
  ├── customers
  └── transport

Fase 2 — Dependen de Fase 1
  ├── products  (→ warehouses, suppliers)
  └── routes    (→ warehouses)

Fase 3 — Depende de Fase 1 + 2
  └── drivers   (→ transport, auth_user de Django)

Fase 4 — Depende de todo
  └── shipments (→ customers, drivers, transport, routes, warehouses, products)
```

---

## Dependencias a agregar

```
# requirements/base.txt
djangorestframework-simplejwt
django-cors-headers
django-filter
drf-spectacular
```

---

## Variables de entorno — `.env.example`

```ini
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Decisiones de diseño

| Decisión                | Elección                                        | Razón                                                                     |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Autenticación           | JWT (simplejwt)                                 | Stateless, estándar DRF, compatible con cualquier frontend                |
| Docs API                | drf-spectacular                                 | Auto-generado desde el código, cero mantenimiento manual                  |
| Settings                | base / dev / prod                               | Separación limpia de entornos desde el inicio                             |
| Soft delete             | `is_active=False`                               | Evita pérdida de datos; los ViewSets filtran `is_active=True` por defecto |
| Recursos anidados       | `/routes/{id}/stops/`, `/shipments/{id}/items/` | Refleja la relación de pertenencia del schema                             |
| `drivers` → `auth_user` | OneToOneField                                   | Reutiliza el sistema de auth de Django sin duplicar campos                |
| Nombre de tablas        | Explícito con `db_table`                        | Coincide exactamente con el schema documentado                            |

---

## Checklist de verificación del MVP

- [ ] `python manage.py check` — sin errores ni advertencias
- [ ] `python manage.py migrate` — todas las migraciones aplicadas
- [ ] `python manage.py test` — todos los tests pasan
- [ ] Swagger UI accesible en `/api/v1/docs/`
- [ ] Flujo completo funcional: token JWT → warehouse → supplier → product → customer → shipment con ítems
