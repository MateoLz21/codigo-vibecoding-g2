# Spec — Suppliers

## Contexto
Empresas proveedoras que venden los productos tecnológicos gestionados en el sistema de logística. Es un módulo de Fase 1: no depende de ninguna otra app del dominio.

## Dependencias
Ninguna app Django del dominio. Es referenciado por `products` (FK `supplier_id → suppliers.id`).

## Archivos a crear/modificar

| Acción | Archivo |
|---|---|
| Crear | `apps/suppliers/models.py` |
| Crear | `apps/suppliers/serializers.py` |
| Crear | `apps/suppliers/views.py` |
| Crear | `apps/suppliers/urls.py` |
| Crear | `apps/suppliers/filters.py` |
| Crear | `apps/suppliers/admin.py` |
| Modificar | `apps/suppliers/apps.py` |
| Ejecutar | `python manage.py makemigrations suppliers` |
| Modificar | `config/urls.py` |
| Modificar | `config/settings/base.py` |

---

## Tareas

### TASK-01: Modelo `Supplier`
**Archivo:** `apps/suppliers/models.py`
**Descripción:** Definir el modelo Django que representa la tabla `suppliers` según el schema.
**Detalles:**
- Clase `Supplier(models.Model)`
- Campos exactos:
  - `name = models.CharField(max_length=200, null=False)`
  - `tax_id = models.CharField(max_length=20, unique=True, null=True, blank=True)` — RUC del proveedor
  - `email = models.EmailField(max_length=254, null=True, blank=True)`
  - `phone = models.CharField(max_length=20, null=True, blank=True)`
  - `address = models.TextField(null=True, blank=True)`
  - `contact_name = models.CharField(max_length=200, null=True, blank=True)` — persona de contacto
  - `is_active = models.BooleanField(default=True, null=False)`
  - `created_at = models.DateTimeField(auto_now_add=True)`
  - `updated_at = models.DateTimeField(auto_now=True)`
- `class Meta:` con `db_table = 'suppliers'` y `ordering = ['name']`
- `__str__` retorna `self.name`

---

### TASK-02: Serializer `SupplierSerializer`
**Archivo:** `apps/suppliers/serializers.py`
**Descripción:** Serializer DRF estándar para el modelo `Supplier`.
**Detalles:**
- Clase `SupplierSerializer(serializers.ModelSerializer)`
- `fields = '__all__'`
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- No requiere validaciones custom adicionales para este módulo (no hay reglas de negocio especiales en `docs/scope.md` para suppliers)

---

### TASK-03: ViewSet `SupplierViewSet`
**Archivo:** `apps/suppliers/views.py`
**Descripción:** ViewSet DRF con soft delete y filtros estándar.
**Detalles:**
- Clase `SupplierViewSet(viewsets.ModelViewSet)`
- `queryset = Supplier.objects.filter(is_active=True)` — solo proveedores activos por defecto
- `serializer_class = SupplierSerializer`
- `filterset_class = SupplierFilter` (importado desde `filters.py`)
- `search_fields = ['name', 'tax_id', 'email', 'contact_name']`
- `ordering_fields = ['name', 'created_at']`
- Override del método `destroy(self, request, *args, **kwargs)`:
  - No eliminar el registro de la BD
  - Obtener el objeto con `self.get_object()`
  - Marcar `instance.is_active = False`
  - Llamar `instance.save()`
  - Retornar `Response(status=status.HTTP_204_NO_CONTENT)`

---

### TASK-04: URLs del módulo
**Archivo:** `apps/suppliers/urls.py`
**Descripción:** Registrar el ViewSet con `DefaultRouter`.
**Detalles:**
- Instanciar `router = DefaultRouter()`
- Registrar: `router.register(r'suppliers', SupplierViewSet)`
- `urlpatterns = router.urls`
- No hay recursos anidados para este módulo

---

### TASK-05: Filtros `SupplierFilter`
**Archivo:** `apps/suppliers/filters.py`
**Descripción:** FilterSet con campos filtrables relevantes para búsqueda operativa.
**Detalles:**
- Clase `SupplierFilter(django_filters.FilterSet)`
- Campos filtrables:
  - `is_active` — filtrar por estado activo/inactivo (tipo `BooleanFilter`)
  - `name` — búsqueda por nombre exacto (tipo `CharFilter` con `lookup_expr='icontains'`)
  - `contact_name` — búsqueda por persona de contacto (tipo `CharFilter` con `lookup_expr='icontains'`)
- `class Meta:` con `model = Supplier` y `fields = ['is_active', 'name', 'contact_name']`

---

### TASK-06: Admin `SupplierAdmin`
**Archivo:** `apps/suppliers/admin.py`
**Descripción:** Registrar el modelo en Django Admin con configuración básica de visualización.
**Detalles:**
- Clase `SupplierAdmin(admin.ModelAdmin)`
- `list_display = ['id', 'name', 'tax_id', 'email', 'contact_name', 'is_active', 'created_at']`
- `list_filter = ['is_active', 'created_at']`
- `search_fields = ['name', 'tax_id', 'email', 'contact_name']`
- Registrar con `admin.site.register(Supplier, SupplierAdmin)`

---

### TASK-07: AppConfig
**Archivo:** `apps/suppliers/apps.py`
**Descripción:** Configurar el `AppConfig` con el nombre correcto.
**Detalles:**
- Clase `SuppliersConfig(AppConfig)`
- `name = 'apps.suppliers'`
- `default_auto_field = 'django.db.models.BigAutoField'`
- Asegurarse de que `default_app_config` en `apps/suppliers/__init__.py` apunte a esta config (o que `apps.py` use la convención de Django 3.2+ con `default_auto_field`)

---

### TASK-08: Generar migración inicial
**Archivo:** `apps/suppliers/migrations/`
**Descripción:** Crear la migración para la tabla `suppliers`.
**Detalles:**
- Ejecutar: `python manage.py makemigrations suppliers`
- Verificar que la migración generada crea la tabla con `db_table = 'suppliers'`
- No es necesario aplicar la migración (`migrate`) en este paso — el Validator lo verificará

---

### TASK-09: Registrar URLs en el proyecto
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs del módulo `suppliers` bajo el prefijo `/api/v1/`.
**Detalles:**
- Agregar a `urlpatterns`:
  ```python
  path('api/v1/', include('apps.suppliers.urls')),
  ```
- Ubicar junto a los demás `include` de módulos de dominio, respetando el orden existente en el archivo

---

### TASK-10: Registrar app en `INSTALLED_APPS`
**Archivo:** `config/settings/base.py`
**Descripción:** Agregar `apps.suppliers` a la lista de apps instaladas.
**Detalles:**
- Agregar `'apps.suppliers'` a `INSTALLED_APPS` dentro del bloque de apps de dominio del proyecto
- Respetar el orden del grafo de dependencias: `suppliers` pertenece a la Fase 1 (sin dependencias entre apps del dominio), por lo que debe ir antes de `apps.products`
