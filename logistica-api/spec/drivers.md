# Spec — Drivers

## Contexto
Módulo que representa a los conductores asignados al transporte. Cada conductor es una extensión del usuario Django (`auth_user`) a través de una relación OneToOne, e incluye datos de licencia de conducir y disponibilidad operativa.

## Estado del stub existente
El agente Implement de `transport` ya creó un stub funcional con lo siguiente **ya implementado y migrado**:
- `apps/drivers/models.py` — modelo `Driver` completo con todos los campos del schema
- `apps/drivers/migrations/0001_initial.py` — migración inicial ya aplicada
- `apps/drivers/apps.py` — `AppConfig` con `name = 'apps.drivers'`
- App registrada en `INSTALLED_APPS`

**No** tienen implementación aún: `serializers.py`, `views.py`, `urls.py`, `filters.py`, `admin.py`.
`config/urls.py` tampoco incluye las URLs de `drivers`.

## Dependencias
- `auth_user` (Django built-in) — OneToOneField para la cuenta del conductor

> `drivers` no tiene FK hacia ninguna app propia del proyecto. Es `transport` quien tiene FK hacia `drivers` (no al revés), por lo que este módulo no tiene dependencias de apps propias.

## Decisión sobre `is_active`

**Decisión: NO agregar `is_active` al modelo `Driver`.**

Justificación:
1. El schema (`docs/database-schema.md`) no define `is_active` en la tabla `drivers`. Agregarlo requeriría una migración adicional sobre una tabla ya migrada.
2. El ciclo de vida de un conductor se gestiona a través del campo `is_available` (disponible para asignación) y del usuario Django asociado (`user.is_active`). Para deshabilitar un conductor, el operador puede desactivar la cuenta Django correspondiente (`user.is_active = False`).
3. El soft delete del recurso `Driver` se implementará mediante `user.is_active = False` en el override de `destroy()`, lo que es semánticamente correcto: desactivar al conductor equivale a desactivar su cuenta de usuario.

Esta decisión es consistente con la arquitectura OneToOne con `auth_user`: la actividad del conductor vive en `auth_user.is_active`, no en una columna redundante.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `apps/drivers/models.py` | **No tocar** — ya existe y está migrado |
| `apps/drivers/serializers.py` | Crear |
| `apps/drivers/views.py` | Crear |
| `apps/drivers/urls.py` | Crear |
| `apps/drivers/filters.py` | Crear |
| `apps/drivers/admin.py` | Modificar (ya existe vacío) |
| `apps/drivers/apps.py` | **No tocar** — ya tiene `name = 'apps.drivers'` |
| `config/urls.py` | Modificar — incluir URLs del módulo |

---

## Tareas

### TASK-01: Serializer `DriverSerializer`
**Archivo:** `apps/drivers/serializers.py`
**Descripción:** Serializer estándar DRF para el modelo `Driver`. Expone todos los campos del modelo incluyendo el FK hacia `user`.
**Detalles:**
- Importar `from rest_framework import serializers` y `from .models import Driver`
- Clase `DriverSerializer(serializers.ModelSerializer)`:
  - `model = Driver`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`
- El campo `user` es un `PrimaryKeyRelatedField` por defecto (comportamiento DRF estándar). No se requiere serializer anidado para el MVP.
- No se requieren validaciones custom para este módulo: no hay reglas de negocio especiales en `docs/scope.md` que apliquen a `drivers`.

---

### TASK-02: ViewSet `DriverViewSet`
**Archivo:** `apps/drivers/views.py`
**Descripción:** ViewSet DRF con soft delete implementado mediante `user.is_active = False`, queryset filtrado por conductores con usuario activo, y campos de búsqueda/filtrado/ordenamiento.
**Detalles:**
- Importaciones requeridas:
  ```python
  from rest_framework import viewsets, status
  from rest_framework.response import Response
  from .models import Driver
  from .serializers import DriverSerializer
  from .filters import DriverFilter
  ```
- Clase `DriverViewSet(viewsets.ModelViewSet)`:
  - `queryset = Driver.objects.filter(user__is_active=True).select_related('user')`
  - `serializer_class = DriverSerializer`
  - `filterset_class = DriverFilter`
  - `search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']`
  - `ordering_fields = ['license_number', 'license_expiry', 'created_at']`
- Override de `destroy()` para implementar soft delete mediante `user.is_active = False`:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.user.is_active = False
      instance.user.save()
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```
  Este override es correcto porque `Driver` no tiene campo `is_active` propio (ver decisión en sección "Decisión sobre `is_active`"). Desactivar la cuenta Django del conductor es el mecanismo de soft delete para este módulo.

---

### TASK-03: URLs del módulo
**Archivo:** `apps/drivers/urls.py`
**Descripción:** Registrar `DriverViewSet` en un `DefaultRouter` y exponer las URLs del módulo.
**Detalles:**
- Importar `from rest_framework.routers import DefaultRouter` y `from .views import DriverViewSet`
- Crear `router = DefaultRouter()`
- Registrar: `router.register(r'drivers', DriverViewSet)`
- `urlpatterns = router.urls`
- No hay recursos anidados para este módulo (según `docs/scope.md`, `drivers` no expone sub-recursos)

---

### TASK-04: Filtros `DriverFilter`
**Archivo:** `apps/drivers/filters.py`
**Descripción:** FilterSet con los campos más relevantes para búsqueda operativa de conductores.
**Detalles:**
- Importar `import django_filters` y `from .models import Driver`
- Clase `DriverFilter(django_filters.FilterSet)`:
  - `is_available` → filtro booleano exacto por disponibilidad del conductor (`BooleanFilter`)
  - `license_expiry` → filtro de rango: `license_expiry__gte` (vence desde) y `license_expiry__lte` (vence hasta) — útil para identificar licencias próximas a vencer
  - `user__is_active` → filtro booleano para mostrar conductores con cuenta activa/inactiva (aunque el queryset base ya filtra `user__is_active=True`, el filtro explícito permite queries desde el admin)
- `class Meta`:
  - `model = Driver`
  - `fields = ['is_available']`
- Los filtros de rango para `license_expiry` se definen explícitamente como atributos de la clase usando `django_filters.DateFilter`:
  ```python
  license_expiry_gte = django_filters.DateFilter(field_name='license_expiry', lookup_expr='gte')
  license_expiry_lte = django_filters.DateFilter(field_name='license_expiry', lookup_expr='lte')
  ```

---

### TASK-05: Admin `DriverAdmin`
**Archivo:** `apps/drivers/admin.py`
**Descripción:** Registrar el modelo `Driver` en Django Admin con configuración útil para operadores.
**Detalles:**
- Importar `from django.contrib import admin` y `from .models import Driver`
- Clase `DriverAdmin(admin.ModelAdmin)`:
  - `list_display = ['__str__', 'license_number', 'license_expiry', 'phone', 'is_available']`
  - `list_filter = ['is_available', 'license_expiry']`
  - `search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']`
- Registrar con decorador: `@admin.register(Driver)` sobre la clase `DriverAdmin`
- El método `__str__` del modelo ya retorna `"{nombre completo} ({license_number})"`, lo que hace que `'__str__'` en `list_display` sea suficientemente descriptivo.

---

### TASK-06: Registro en `config/urls.py`
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs del módulo `drivers` bajo el prefijo `/api/v1/`.
**Detalles:**
- En `config/urls.py`, dentro del bloque de "Apps de dominio", agregar:
  ```python
  path('api/v1/', include('apps.drivers.urls')),
  ```
- Ubicar **antes** de `apps.transport.urls`, ya que `transport` tiene FK hacia `drivers` y es semánticamente correcto que `drivers` aparezca primero en el listado.
- El estado actual de `config/urls.py` tiene registrados: `warehouses`, `suppliers`, `customers`, `transport`, `products`, `routes`. Insertar `apps.drivers.urls` antes de `apps.transport.urls`.
- El router ya incluye el prefijo `drivers/`, por lo que el endpoint resultante será `/api/v1/drivers/`
