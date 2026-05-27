# Spec — Warehouses

## Contexto

Almacén es el punto físico de partida y almacenamiento de productos tecnológicos. Es una app de Fase 1 (sin dependencias de otras apps propias), pero otras apps dependen de ella: `products`, `routes` y `shipments` referencian `warehouses` via FK.

## Dependencias

Ninguna. `warehouses` no tiene FK hacia otras apps propias del proyecto.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `apps/warehouses/models.py` | Crear |
| `apps/warehouses/serializers.py` | Crear |
| `apps/warehouses/views.py` | Crear |
| `apps/warehouses/urls.py` | Crear |
| `apps/warehouses/filters.py` | Crear |
| `apps/warehouses/admin.py` | Modificar |
| `apps/warehouses/apps.py` | Modificar |
| `config/settings/base.py` | Modificar — agregar a `INSTALLED_APPS` |
| `config/urls.py` | Modificar — registrar rutas del módulo |

---

## Tareas

### TASK-01: Modelo `Warehouse`

**Archivo:** `apps/warehouses/models.py`

**Descripción:** Definir el modelo Django `Warehouse` con todos los campos del schema, `Meta` correcta y método `__str__`.

**Detalles:**
- Clase: `Warehouse(models.Model)`
- Campos exactos (nombres y tipos según `docs/database-schema.md`):
  - `name` → `models.CharField(max_length=200, null=False, blank=False)`
  - `address` → `models.TextField(null=False, blank=False)`
  - `city` → `models.CharField(max_length=100, null=False, blank=False)`
  - `country` → `models.CharField(max_length=100, null=False, blank=False, default='Peru')`
  - `latitude` → `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - `longitude` → `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - `capacity_m3` → `models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)`
  - `is_active` → `models.BooleanField(default=True, null=False)`
  - `created_at` → `models.DateTimeField(auto_now_add=True)`
  - `updated_at` → `models.DateTimeField(auto_now=True)`
- Sin campos `Choices` (no hay columnas con valores fijos en este modelo)
- `class Meta`:
  - `db_table = 'warehouses'`
  - `ordering = ['name']`
- `__str__`: retornar `f"{self.name} — {self.city}"`

---

### TASK-02: Serializer `WarehouseSerializer`

**Archivo:** `apps/warehouses/serializers.py`

**Descripción:** Definir el serializer DRF para el modelo `Warehouse`.

**Detalles:**
- Importar `Warehouse` desde `.models`
- Clase: `WarehouseSerializer(serializers.ModelSerializer)`
- `class Meta`:
  - `model = Warehouse`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`
- No requiere validaciones custom (no hay reglas de negocio especiales en `docs/scope.md` para este módulo)

---

### TASK-03: ViewSet `WarehouseViewSet`

**Archivo:** `apps/warehouses/views.py`

**Descripción:** Definir el ViewSet DRF con soft delete, filtros, búsqueda y ordenamiento.

**Detalles:**
- Importaciones necesarias: `viewsets` de `rest_framework`, `WarehouseSerializer`, `Warehouse`, `WarehouseFilter`
- Clase: `WarehouseViewSet(viewsets.ModelViewSet)`
- `queryset = Warehouse.objects.filter(is_active=True)`
- `serializer_class = WarehouseSerializer`
- `filterset_class = WarehouseFilter`
- `search_fields = ['name', 'city', 'country', 'address']`
- `ordering_fields = ['name', 'city', 'country', 'capacity_m3', 'created_at']`
- Override del método `destroy(self, request, *args, **kwargs)`:
  - Obtener la instancia con `self.get_object()`
  - Marcar `instance.is_active = False`
  - Llamar `instance.save()`
  - Retornar `Response(status=status.HTTP_204_NO_CONTENT)`
  - Importar `Response` y `status` desde `rest_framework`
  - **No eliminar el registro de la base de datos**

---

### TASK-04: Router y URLs `urls.py`

**Archivo:** `apps/warehouses/urls.py`

**Descripción:** Registrar el ViewSet en un `DefaultRouter` y exponer `urlpatterns`.

**Detalles:**
- Importar `DefaultRouter` desde `rest_framework.routers`
- Importar `WarehouseViewSet` desde `.views`
- Instanciar `router = DefaultRouter()`
- Registrar: `router.register(r'warehouses', WarehouseViewSet, basename='warehouse')`
- `urlpatterns = router.urls`
- No hay recursos anidados para `warehouses`

---

### TASK-05: Filtros `WarehouseFilter`

**Archivo:** `apps/warehouses/filters.py`

**Descripción:** Definir un `FilterSet` con los campos más relevantes para búsqueda operativa de almacenes.

**Detalles:**
- Importar `django_filters` y el modelo `Warehouse`
- Clase: `WarehouseFilter(django_filters.FilterSet)`
- Campos filtrables:
  - `city` → filtro exacto (`exact`)
  - `country` → filtro exacto (`exact`)
  - `is_active` → filtro exacto (`exact`)
  - `capacity_m3` → filtros de rango: `capacity_m3__gte` y `capacity_m3__lte` usando `NumberFilter` con `field_name='capacity_m3'` y `lookup_expr='gte'` / `lookup_expr='lte'`
- `class Meta`:
  - `model = Warehouse`
  - `fields = ['city', 'country', 'is_active']`

---

### TASK-06: Admin `WarehouseAdmin`

**Archivo:** `apps/warehouses/admin.py`

**Descripción:** Registrar el modelo `Warehouse` en Django Admin con configuración útil para operadores.

**Detalles:**
- Importar `admin` desde `django.contrib`
- Importar `Warehouse` desde `.models`
- Clase: `WarehouseAdmin(admin.ModelAdmin)`
- `list_display = ['id', 'name', 'city', 'country', 'capacity_m3', 'is_active', 'created_at']`
- `list_filter = ['city', 'country', 'is_active']`
- `search_fields = ['name', 'city', 'address']`
- Registrar: `admin.site.register(Warehouse, WarehouseAdmin)`

---

### TASK-07: AppConfig en `apps.py`

**Archivo:** `apps/warehouses/apps.py`

**Descripción:** Asegurar que `AppConfig` tiene el `name` correcto para que Django reconozca la app.

**Detalles:**
- Clase: `WarehousesConfig(AppConfig)`
- `name = 'apps.warehouses'`
- `default_auto_field = 'django.db.models.BigAutoField'` (consistente con el resto del proyecto)
- Variable de módulo: `default_app_config = 'apps.warehouses.apps.WarehousesConfig'` en `__init__.py` si no existe la detección automática, o simplemente verificar que `apps.py` usa el `name` correcto

---

### TASK-08: Migración inicial

**Archivo:** `apps/warehouses/migrations/`

**Descripción:** Generar la migración inicial para el modelo `Warehouse`.

**Detalles:**
- Ejecutar: `python manage.py makemigrations warehouses`
- Verificar que el archivo generado refleja todos los campos de TASK-01
- Verificar que `db_table = 'warehouses'` aparece en `options` de la migración
- No aplicar la migración (`migrate`) — eso queda a cargo del usuario o del proceso de deploy

---

### TASK-09: Registro en `config/urls.py`

**Archivo:** `config/urls.py`

**Descripción:** Incluir las URLs del módulo `warehouses` bajo el prefijo `/api/v1/`.

**Detalles:**
- Agregar a `urlpatterns`:
  ```python
  path('api/v1/', include('apps.warehouses.urls')),
  ```
- Asegurarse de que `include` está importado desde `django.urls`
- El endpoint resultante será: `GET/POST /api/v1/warehouses/` y `GET/PUT/PATCH/DELETE /api/v1/warehouses/{id}/`

---

### TASK-10: Registro en `INSTALLED_APPS`

**Archivo:** `config/settings/base.py`

**Descripción:** Agregar `apps.warehouses` a `INSTALLED_APPS` para que Django detecte el modelo y las migraciones.

**Detalles:**
- Agregar la siguiente línea dentro del bloque de apps de dominio en `INSTALLED_APPS`:
  ```python
  'apps.warehouses',
  ```
- Posición sugerida: dentro del grupo de apps propias del proyecto, antes de apps que dependen de `warehouses` (`apps.products`, `apps.routes`, `apps.shipments`)
