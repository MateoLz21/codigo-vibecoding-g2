# Spec — Routes

## Contexto

El módulo `routes` gestiona las rutas de transporte: una `Route` define el trayecto (almacén de origen + duración estimada) y sus `RouteStop` describen cada parada del trayecto en orden secuencial. Es requisito de `shipments` (Fase 4).

## Dependencias

- `apps.warehouses` — FK desde `Route.origin_warehouse_id` → tabla `warehouses`
- `apps.routes` propio — FK desde `RouteStop.route_id` → tabla `routes`

## Archivos a crear/modificar

| Acción | Archivo |
|---|---|
| Crear | `apps/routes/__init__.py` |
| Crear | `apps/routes/apps.py` |
| Crear | `apps/routes/models.py` |
| Crear | `apps/routes/serializers.py` |
| Crear | `apps/routes/views.py` |
| Crear | `apps/routes/urls.py` |
| Crear | `apps/routes/filters.py` |
| Crear | `apps/routes/admin.py` |
| Crear | `apps/routes/migrations/__init__.py` |
| Crear | `apps/routes/tests/__init__.py` |
| Crear | `apps/routes/tests/test_models.py` |
| Crear | `apps/routes/tests/test_views.py` |
| Modificar | `config/settings/base.py` — agregar `'apps.routes'` a `INSTALLED_APPS` |
| Modificar | `config/urls.py` — incluir `apps/routes/urls.py` bajo `/api/v1/` |
| Ejecutar | `python manage.py makemigrations routes` |

---

## Tareas

### TASK-01: Modelo `Route`

**Archivo:** `apps/routes/models.py`

**Descripción:** Definir el modelo `Route` con todos los campos del schema, relación FK a `warehouses` y configuración de tabla explícita.

**Detalles:**
- Clase `Route(models.Model)`
- Campo `name`: `CharField(max_length=200, null=False)`
- Campo `origin_warehouse`: `ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='routes')`
  - Columna en BD: `origin_warehouse_id`
  - `on_delete=PROTECT` porque si existe una ruta apoyada en un almacén, el almacén no debe poder borrarse
- Campo `estimated_duration_hours`: `DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)`
- Campo `is_active`: `BooleanField(default=True)`
- Campo `created_at`: `DateTimeField(auto_now_add=True)`
- Campo `updated_at`: `DateTimeField(auto_now=True)`
- `class Meta`: `db_table = 'routes'`, `ordering = ['name']`
- `__str__`: retornar `self.name`

---

### TASK-02: Modelo `RouteStop`

**Archivo:** `apps/routes/models.py` (mismo archivo, debajo de `Route`)

**Descripción:** Definir el modelo `RouteStop` con todos los campos del schema, relación FK a `Route` y configuración de tabla explícita.

**Detalles:**
- Clase `RouteStop(models.Model)`
- Campo `route`: `ForeignKey('routes.Route', on_delete=models.CASCADE, related_name='stops')`
  - Columna en BD: `route_id`
  - `on_delete=CASCADE` porque si se borra una ruta, sus paradas no tienen sentido sin ella
- Campo `stop_order`: `IntegerField(null=False)`
- Campo `address`: `TextField(null=False)`
- Campo `city`: `CharField(max_length=100, null=False)`
- Campo `latitude`: `DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
- Campo `longitude`: `DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
- Campo `estimated_arrival`: `TimeField(null=True, blank=True)`
- **Nota:** `RouteStop` NO tiene `is_active`, `created_at` ni `updated_at` — el schema no los define para esta tabla
- `class Meta`: `db_table = 'route_stops'`, `ordering = ['route', 'stop_order']`
- `__str__`: retornar `f"Stop {self.stop_order} — {self.city}"`

---

### TASK-03: Serializer `RouteStopSerializer`

**Archivo:** `apps/routes/serializers.py`

**Descripción:** Serializer para `RouteStop` que será usado tanto de forma independiente como anidado dentro de `RouteSerializer`.

**Detalles:**
- Clase `RouteStopSerializer(serializers.ModelSerializer)`
- `class Meta`: `model = RouteStop`, `fields = '__all__'`, `read_only_fields = ['id']`
- No tiene `created_at` ni `updated_at` (no existen en el modelo)
- No requiere validaciones custom adicionales

---

### TASK-04: Serializer `RouteSerializer`

**Archivo:** `apps/routes/serializers.py` (mismo archivo, debajo de `RouteStopSerializer`)

**Descripción:** Serializer para `Route`. Incluye las paradas como campo de solo lectura anidado para enriquecer el detalle de la ruta.

**Detalles:**
- Clase `RouteSerializer(serializers.ModelSerializer)`
- Campo adicional `stops`: `RouteStopSerializer(many=True, read_only=True)` — usa el `related_name='stops'` del FK
  - `read_only=True` porque las paradas se crean/modifican a través del endpoint anidado `/routes/{id}/stops/`, no dentro del payload de la ruta
- `class Meta`: `model = Route`, `fields = '__all__'`, `read_only_fields = ['id', 'created_at', 'updated_at']`

---

### TASK-05: ViewSet `RouteViewSet`

**Archivo:** `apps/routes/views.py`

**Descripción:** ViewSet estándar para `Route` con soft delete, filtrado, búsqueda y ordenamiento.

**Detalles:**
- Clase `RouteViewSet(viewsets.ModelViewSet)`
- `queryset = Route.objects.filter(is_active=True)`
- `serializer_class = RouteSerializer`
- `filterset_class = RouteFilter` (definido en `filters.py`)
- `search_fields = ['name']`
- `ordering_fields = ['name', 'created_at', 'estimated_duration_hours']`
- Override de `destroy()`: en vez de borrar el registro, hacer `instance.is_active = False; instance.save()` y retornar `Response(status=status.HTTP_204_NO_CONTENT)`

---

### TASK-06: ViewSet `RouteStopViewSet`

**Archivo:** `apps/routes/views.py` (mismo archivo, debajo de `RouteViewSet`)

**Descripción:** ViewSet para `RouteStop` anidado bajo una ruta. Filtra automáticamente por la ruta padre y no expone paradas de otras rutas.

**Detalles:**
- Clase `RouteStopViewSet(viewsets.ModelViewSet)`
- `serializer_class = RouteStopSerializer`
- `queryset = RouteStop.objects.all()`
- Override de `get_queryset()`: retornar `RouteStop.objects.filter(route_id=self.kwargs['route_pk'])` para filtrar solo las paradas de la ruta indicada en la URL
- Override de `perform_create()`: asignar `serializer.save(route_id=self.kwargs['route_pk'])` para que la parada quede vinculada a la ruta de la URL automáticamente
- **No implementar soft delete** en `RouteStop` — la tabla no tiene campo `is_active`; el `DELETE` hace borrado real (`super().destroy()`)

---

### TASK-07: Filtro `RouteFilter`

**Archivo:** `apps/routes/filters.py`

**Descripción:** Filtro django-filter para el endpoint de rutas.

**Detalles:**
- Clase `RouteFilter(django_filters.FilterSet)`
- Campos filtrables:
  - `origin_warehouse`: filtro exact por ID del almacén (`origin_warehouse_id`)
  - `is_active`: filtro exact por booleano (aunque el queryset base ya filtra `True`, conviene exponer para admin o debug)
- `class Meta`: `model = Route`, `fields = ['origin_warehouse', 'is_active']`

---

### TASK-08: Configuración de URLs con recurso anidado

**Archivo:** `apps/routes/urls.py`

**Descripción:** Registrar `RouteViewSet` en el router principal y configurar el recurso anidado `stops` bajo cada ruta usando dos routers o rutas manuales.

**Detalles:**
- Crear un `DefaultRouter()` principal y registrar: `router.register(r'routes', RouteViewSet, basename='route')`
- Para el recurso anidado, crear un segundo `DefaultRouter()` y registrar: `stops_router.register(r'stops', RouteStopViewSet, basename='route-stop')`
- Combinar en `urlpatterns`:
  ```python
  urlpatterns = router.urls + [
      path('routes/<int:route_pk>/', include(stops_router.urls)),
  ]
  ```
- Esto genera los endpoints:
  - `GET/POST /routes/` y `GET/PUT/PATCH/DELETE /routes/{id}/`
  - `GET/POST /routes/{route_pk}/stops/` y `GET/PUT/PATCH/DELETE /routes/{route_pk}/stops/{id}/`

---

### TASK-09: Registro en Django Admin

**Archivo:** `apps/routes/admin.py`

**Descripción:** Registrar ambos modelos en el panel de administración Django.

**Detalles:**
- Clase `RouteAdmin(admin.ModelAdmin)`:
  - `list_display = ['id', 'name', 'origin_warehouse', 'estimated_duration_hours', 'is_active', 'created_at']`
  - `list_filter = ['is_active', 'origin_warehouse']`
  - `search_fields = ['name']`
  - Decorador `@admin.register(Route)`
- Clase `RouteStopAdmin(admin.ModelAdmin)`:
  - `list_display = ['id', 'route', 'stop_order', 'city', 'address', 'estimated_arrival']`
  - `list_filter = ['route', 'city']`
  - `search_fields = ['address', 'city']`
  - Decorador `@admin.register(RouteStop)`

---

### TASK-10: AppConfig

**Archivo:** `apps/routes/apps.py`

**Descripción:** Configurar la clase `AppConfig` de la app.

**Detalles:**
- Clase `RoutesConfig(AppConfig)`
- `default_auto_field = 'django.db.models.BigAutoField'`
- `name = 'apps.routes'`
- En `apps/routes/__init__.py`: `default_app_config = 'apps.routes.apps.RoutesConfig'`

---

### TASK-11: Registro en `INSTALLED_APPS`

**Archivo:** `config/settings/base.py`

**Descripción:** Agregar la app `routes` a la lista de apps instaladas.

**Detalles:**
- En la lista `INSTALLED_APPS`, agregar `'apps.routes'` después de `'apps.warehouses'` (ya que `routes` depende de `warehouses`)

---

### TASK-12: Registro de URLs en el proyecto

**Archivo:** `config/urls.py`

**Descripción:** Incluir las URLs del módulo `routes` bajo el prefijo `/api/v1/`.

**Detalles:**
- Agregar a `urlpatterns`:
  ```python
  path('api/v1/', include('apps.routes.urls')),
  ```
- Verificar que no haya conflicto de prefijo con otras apps ya registradas (cada app registra su propio prefijo dentro de su `urls.py`)

---

### TASK-13: Generar migración inicial

**Descripción:** Generar y aplicar la migración inicial del módulo.

**Detalles:**
- Ejecutar: `python manage.py makemigrations routes`
- Verificar que el archivo generado en `apps/routes/migrations/0001_initial.py` contenga:
  - Tabla `routes` con todos los campos de `Route`
  - Tabla `route_stops` con todos los campos de `RouteStop`
  - FK de `route_stops.route_id` → `routes.id`
  - FK de `routes.origin_warehouse_id` → `warehouses.id`
- No ejecutar `migrate` — lo hace el usuario manualmente
