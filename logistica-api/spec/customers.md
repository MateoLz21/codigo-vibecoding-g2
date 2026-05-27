# Spec — Customers

## Contexto
Módulo que representa a la empresa o persona que genera envíos; es referenciado por `shipments` como cliente del envío.

## Dependencias
Ninguna — `customers` no tiene FK hacia otras apps del proyecto. Es una app de Fase 1 (sin dependencias entre apps propias).

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `apps/customers/models.py` | Crear |
| `apps/customers/serializers.py` | Crear |
| `apps/customers/views.py` | Crear |
| `apps/customers/urls.py` | Crear |
| `apps/customers/filters.py` | Crear |
| `apps/customers/admin.py` | Modificar (reemplazar contenido por defecto) |
| `apps/customers/apps.py` | Modificar (verificar `name`) |
| `config/settings/base.py` | Modificar (agregar a `INSTALLED_APPS`) |
| `config/urls.py` | Modificar (incluir URLs del módulo) |

---

## Tareas

### TASK-01: Modelo `Customer`
**Archivo:** `apps/customers/models.py`
**Descripción:** Crear el modelo Django `Customer` con todos los campos del schema, incluyendo choices para `customer_type`, metadatos de tabla y método `__str__`.
**Detalles:**
- Importar `from django.db import models`
- Definir la clase `Customer(models.Model)`
- Definir choices como constantes de clase antes de los campos:
  - `COMPANY = 'company'`
  - `INDIVIDUAL = 'individual'`
  - `CUSTOMER_TYPE_CHOICES = [(COMPANY, 'Company'), (INDIVIDUAL, 'Individual')]`
- Campos exactos según `docs/database-schema.md`:
  - `name = models.CharField(max_length=200, null=False)`
  - `customer_type = models.CharField(max_length=10, choices=CUSTOMER_TYPE_CHOICES, null=False)`
  - `tax_id = models.CharField(max_length=20, unique=True, null=True, blank=True)`
  - `email = models.EmailField(max_length=254, unique=True, null=False)`
  - `phone = models.CharField(max_length=20, null=True, blank=True)`
  - `address = models.TextField(null=True, blank=True)`
  - `is_active = models.BooleanField(default=True, null=False)`
  - `created_at = models.DateTimeField(auto_now_add=True, null=False)`
  - `updated_at = models.DateTimeField(auto_now=True, null=False)`
- Clase `Meta`:
  - `db_table = 'customers'`
  - `ordering = ['name']`
- Método `__str__`: retornar `self.name`

---

### TASK-02: Serializer `CustomerSerializer`
**Archivo:** `apps/customers/serializers.py`
**Descripción:** Crear `CustomerSerializer` como `ModelSerializer` estándar sin validaciones especiales (el módulo customers no tiene reglas de negocio custom en el scope del MVP).
**Detalles:**
- Importar `from rest_framework import serializers` y `from .models import Customer`
- Definir `class CustomerSerializer(serializers.ModelSerializer)`
- Clase `Meta`:
  - `model = Customer`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`
- No se requieren validaciones custom — `customers` no tiene reglas de negocio especiales en `docs/scope.md`

---

### TASK-03: ViewSet `CustomerViewSet`
**Archivo:** `apps/customers/views.py`
**Descripción:** Crear `CustomerViewSet` con queryset filtrado por `is_active=True`, campos de filtrado, búsqueda y ordenamiento, y soft delete en el método `destroy()`.
**Detalles:**
- Importaciones:
  ```python
  from rest_framework import viewsets
  from rest_framework.response import Response
  from rest_framework import status
  from .models import Customer
  from .serializers import CustomerSerializer
  from .filters import CustomerFilter
  ```
- Definir `class CustomerViewSet(viewsets.ModelViewSet)`
- Atributos del ViewSet:
  - `queryset = Customer.objects.filter(is_active=True)`
  - `serializer_class = CustomerSerializer`
  - `filterset_class = CustomerFilter`
  - `search_fields = ['name', 'email', 'tax_id']`
  - `ordering_fields = ['name', 'created_at', 'updated_at']`
- Override del método `destroy(self, request, *args, **kwargs)`:
  - Obtener la instancia con `self.get_object()`
  - Ejecutar `instance.is_active = False` y `instance.save()`
  - Retornar `Response(status=status.HTTP_204_NO_CONTENT)`
  - No llamar al método `destroy` del padre — no se borra el registro

---

### TASK-04: URLs `customers/urls.py`
**Archivo:** `apps/customers/urls.py`
**Descripción:** Registrar `CustomerViewSet` en un `DefaultRouter` y exponer `urlpatterns`.
**Detalles:**
- Importaciones:
  ```python
  from rest_framework.routers import DefaultRouter
  from .views import CustomerViewSet
  ```
- Crear instancia: `router = DefaultRouter()`
- Registrar: `router.register(r'customers', CustomerViewSet)`
- Exponer: `urlpatterns = router.urls`
- No hay recursos anidados para este módulo (customers no tiene sub-recursos en el scope del MVP)

---

### TASK-05: Filtros `CustomerFilter`
**Archivo:** `apps/customers/filters.py`
**Descripción:** Crear `CustomerFilter` con `django-filter` para permitir filtrado por los campos más relevantes operativamente.
**Detalles:**
- Importaciones:
  ```python
  import django_filters
  from .models import Customer
  ```
- Definir `class CustomerFilter(django_filters.FilterSet)`
- Campos filtrables:
  - `customer_type` — filtro exacto por tipo (`company` o `individual`)
  - `is_active` — filtro booleano (aunque el queryset base ya filtra `is_active=True`, el filtro permite queries explícitas desde admin o uso interno)
  - `email` — filtro de búsqueda con `lookup_expr='icontains'`
  - `name` — filtro de búsqueda con `lookup_expr='icontains'`
- Clase `Meta`:
  - `model = Customer`
  - `fields = ['customer_type', 'is_active', 'email', 'name']`

---

### TASK-06: Admin `CustomerAdmin`
**Archivo:** `apps/customers/admin.py`
**Descripción:** Registrar `Customer` en el Django Admin con configuración mínima de visualización.
**Detalles:**
- Importaciones:
  ```python
  from django.contrib import admin
  from .models import Customer
  ```
- Definir `class CustomerAdmin(admin.ModelAdmin)` con:
  - `list_display = ['id', 'name', 'customer_type', 'email', 'tax_id', 'is_active', 'created_at']`
  - `list_filter = ['customer_type', 'is_active']`
  - `search_fields = ['name', 'email', 'tax_id']`
- Registrar: `admin.site.register(Customer, CustomerAdmin)`

---

### TASK-07: `AppConfig` de customers
**Archivo:** `apps/customers/apps.py`
**Descripción:** Verificar y corregir si es necesario la clase `AppConfig` para que use el nombre correcto de la app.
**Detalles:**
- La clase debe heredar de `django.apps.AppConfig`
- `name` debe ser exactamente `'apps.customers'`
- `default_auto_field` puede ser `'django.db.models.BigAutoField'` (valor por defecto de Django)
- Ejemplo esperado:
  ```python
  from django.apps import AppConfig

  class CustomersConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'apps.customers'
  ```

---

### TASK-08: Migración inicial
**Archivo:** `apps/customers/migrations/` (generado automáticamente)
**Descripción:** Generar la migración inicial para el modelo `Customer`.
**Detalles:**
- Ejecutar el comando: `python manage.py makemigrations customers`
- Verificar que se crea `apps/customers/migrations/0001_initial.py`
- El archivo de migración debe reflejar todos los campos definidos en TASK-01
- No es necesario aplicar (`migrate`) en este paso — el agente Validator lo verificará al final

---

### TASK-09: Registro de URLs en `config/urls.py`
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs del módulo `customers` bajo el prefijo `/api/v1/`.
**Detalles:**
- Agregar al `urlpatterns` existente:
  ```python
  path('api/v1/', include('apps.customers.urls')),
  ```
- Si ya existe un bloque `api/v1/` compartido con otras apps (por ejemplo usando un router central), agregar el include dentro de ese bloque
- El resultado final debe exponer:
  - `GET/POST /api/v1/customers/`
  - `GET/PUT/PATCH/DELETE /api/v1/customers/{id}/`

---

### TASK-10: Registro en `INSTALLED_APPS`
**Archivo:** `config/settings/base.py`
**Descripción:** Agregar la app `customers` a la lista `INSTALLED_APPS`.
**Detalles:**
- Localizar la lista `INSTALLED_APPS` en `config/settings/base.py`
- Agregar `'apps.customers'` dentro del bloque de apps del proyecto (separado de las apps de terceros)
- Ejemplo de bloque esperado:
  ```python
  INSTALLED_APPS = [
      # Django built-in
      ...
      # Third party
      ...
      # Project apps
      'apps.customers',
      ...
  ]
  ```
