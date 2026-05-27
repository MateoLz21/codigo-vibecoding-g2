# Spec — Transport

## Contexto
Módulo que representa los vehículos utilizados para entregar productos al cliente. Cada vehículo puede tener un conductor asignado y expone información de capacidad de carga.

## Dependencias
- `apps.drivers` — FK opcional hacia el conductor asignado al vehículo (`driver_id`)

> Nota: según el grafo de dependencias, `transport` pertenece a la Fase 1 (sin dependencias entre apps propias). Sin embargo, la tabla `transport` tiene FK hacia `drivers`, y `drivers` a su vez depende de `auth_user`. En la práctica, `driver_id` es nullable, por lo que `transport` puede crearse sin conductor. Implement debe registrar el FK como nullable y con `on_delete=models.SET_NULL`.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `apps/transport/models.py` | Crear |
| `apps/transport/serializers.py` | Crear |
| `apps/transport/views.py` | Crear |
| `apps/transport/urls.py` | Crear |
| `apps/transport/filters.py` | Crear |
| `apps/transport/admin.py` | Modificar |
| `apps/transport/apps.py` | Modificar |
| `apps/transport/migrations/` | Generar con makemigrations |
| `config/urls.py` | Modificar — incluir URLs del módulo |
| `config/settings/base.py` | Modificar — agregar a INSTALLED_APPS |

---

## Tareas

### TASK-01: Modelo `Transport`
**Archivo:** `apps/transport/models.py`
**Descripción:** Definir el modelo Django que representa un vehículo de entrega, con todos los campos del schema, choices para `vehicle_type`, y FK nullable hacia `drivers`.
**Detalles:**
- Importar `from django.db import models`
- Importar `from apps.drivers.models import Driver` para la FK (importación diferida si hay circularidad — usar string `'drivers.Driver'`)
- Definir constantes y choices para `vehicle_type`:
  ```python
  TRUCK = 'truck'
  VAN = 'van'
  MOTORCYCLE = 'motorcycle'
  VEHICLE_TYPE_CHOICES = [
      (TRUCK, 'Truck'),
      (VAN, 'Van'),
      (MOTORCYCLE, 'Motorcycle'),
  ]
  ```
- Campos exactos según `docs/database-schema.md`:
  - `driver` → `ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')`
  - `plate_number` → `CharField(max_length=20, unique=True)`
  - `vehicle_type` → `CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)`
  - `brand` → `CharField(max_length=100, null=True, blank=True)`
  - `model` → `CharField(max_length=100, null=True, blank=True)`
  - `year` → `IntegerField(null=True, blank=True)`
  - `max_capacity_kg` → `DecimalField(max_digits=10, decimal_places=2)`
  - `is_active` → `BooleanField(default=True)`
  - `created_at` → `DateTimeField(auto_now_add=True)`
  - `updated_at` → `DateTimeField(auto_now=True)`
- `class Meta`:
  - `db_table = 'transport'`
  - `ordering = ['plate_number']`
- `__str__` → retornar `f"{self.plate_number} ({self.vehicle_type})"`

---

### TASK-02: Serializer `TransportSerializer`
**Archivo:** `apps/transport/serializers.py`
**Descripción:** Serializer estándar DRF para el modelo `Transport`.
**Detalles:**
- Importar `from rest_framework import serializers` y `from .models import Transport`
- Clase `TransportSerializer(serializers.ModelSerializer)`:
  - `model = Transport`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`
- No se requieren validaciones custom para este módulo (no hay reglas de negocio especiales en `docs/scope.md` para transport)

---

### TASK-03: ViewSet `TransportViewSet`
**Archivo:** `apps/transport/views.py`
**Descripción:** ViewSet DRF con soft delete, queryset filtrado por `is_active=True` y campos de búsqueda/filtrado/ordenamiento.
**Detalles:**
- Importar `from rest_framework import viewsets` y `from .models import Transport`, `from .serializers import TransportSerializer`, `from .filters import TransportFilter`
- Clase `TransportViewSet(viewsets.ModelViewSet)`:
  - `queryset = Transport.objects.filter(is_active=True)`
  - `serializer_class = TransportSerializer`
  - `filterset_class = TransportFilter`
  - `search_fields = ['plate_number', 'brand', 'model']`
  - `ordering_fields = ['plate_number', 'max_capacity_kg', 'created_at']`
- Override de `destroy()` para implementar soft delete:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.is_active = False
      instance.save()
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```
- Importar `from rest_framework.response import Response` y `from rest_framework import status`

---

### TASK-04: URLs del módulo
**Archivo:** `apps/transport/urls.py`
**Descripción:** Registrar `TransportViewSet` en un `DefaultRouter` y exponer las URLs del módulo.
**Detalles:**
- Importar `from rest_framework.routers import DefaultRouter` y `from .views import TransportViewSet`
- Crear `router = DefaultRouter()`
- Registrar: `router.register(r'transport', TransportViewSet)`
- `urlpatterns = router.urls`
- No hay recursos anidados para este módulo (a diferencia de `routes` con stops o `shipments` con items)

---

### TASK-05: Filtros `TransportFilter`
**Archivo:** `apps/transport/filters.py`
**Descripción:** FilterSet con los campos más relevantes para búsqueda operativa de vehículos.
**Detalles:**
- Importar `import django_filters` y `from .models import Transport`
- Clase `TransportFilter(django_filters.FilterSet)`:
  - `vehicle_type` → filtro exacto por tipo de vehículo (`truck`, `van`, `motorcycle`)
  - `is_active` → filtro booleano (aunque el queryset ya filtra `is_active=True`, incluirlo permite queries explícitas desde admin o integraciones)
  - `driver` → filtro por ID del conductor (`driver_id`)
  - `year` → filtro exacto por año de fabricación
  - `max_capacity_kg` → filtros de rango: `max_capacity_kg__gte` y `max_capacity_kg__lte`
- `class Meta`:
  - `model = Transport`
  - `fields = ['vehicle_type', 'is_active', 'driver', 'year']`

---

### TASK-06: Admin `TransportAdmin`
**Archivo:** `apps/transport/admin.py`
**Descripción:** Registrar el modelo `Transport` en Django Admin con configuración útil para operadores.
**Detalles:**
- Importar `from django.contrib import admin` y `from .models import Transport`
- Clase `TransportAdmin(admin.ModelAdmin)`:
  - `list_display = ['plate_number', 'vehicle_type', 'brand', 'model', 'year', 'max_capacity_kg', 'driver', 'is_active']`
  - `list_filter = ['vehicle_type', 'is_active', 'year']`
  - `search_fields = ['plate_number', 'brand', 'model']`
- Registrar con decorador: `@admin.register(Transport)` sobre la clase, o `admin.site.register(Transport, TransportAdmin)` al final del archivo

---

### TASK-07: AppConfig
**Archivo:** `apps/transport/apps.py`
**Descripción:** Asegurar que `AppConfig` tiene el `name` correcto con prefijo `apps.`.
**Detalles:**
- Clase `TransportConfig(AppConfig)`:
  - `default_auto_field = 'django.db.models.BigAutoField'`
  - `name = 'apps.transport'`
- En `apps/transport/__init__.py`: `default_app_config = 'apps.transport.apps.TransportConfig'` (opcional si Django lo detecta automáticamente por el `AppConfig.name`)

---

### TASK-08: Migración inicial
**Archivo:** `apps/transport/migrations/0001_initial.py` (generado automáticamente)
**Descripción:** Generar la migración inicial para el modelo `Transport`.
**Detalles:**
- Ejecutar: `python manage.py makemigrations transport`
- Verificar que la migración generada incluye la tabla `transport` con todos los campos y el FK hacia `drivers_driver`
- No ejecutar `migrate` todavía si `drivers` aún no está migrado (el FK lo requiere). Si `drivers` ya está implementado y migrado, ejecutar también `python manage.py migrate transport`

---

### TASK-09: Registro en `config/urls.py`
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs del módulo `transport` bajo el prefijo `/api/v1/`.
**Detalles:**
- En `config/urls.py`, dentro del `urlpatterns` o del `include` de `/api/v1/`, agregar:
  ```python
  path('api/v1/', include('apps.transport.urls')),
  ```
- Verificar que el `include` de `apps.transport.urls` queda junto a los demás módulos de Fase 1 (`warehouses`, `suppliers`, `customers`)
- El router ya incluye el prefijo `transport/`, por lo que el endpoint resultante será `/api/v1/transport/`

---

### TASK-10: Registro en `config/settings/base.py`
**Archivo:** `config/settings/base.py`
**Descripción:** Agregar la app `transport` a `INSTALLED_APPS`.
**Detalles:**
- En la lista `INSTALLED_APPS`, agregar `'apps.transport'` junto a las demás apps de dominio:
  ```python
  INSTALLED_APPS = [
      ...
      'apps.transport',
      ...
  ]
  ```
- Ubicar dentro del bloque de apps propias del proyecto, no mezclado con las apps de Django ni las de terceros
