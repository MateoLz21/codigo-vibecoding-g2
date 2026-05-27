# Spec — Products

## Contexto

Productos tecnológicos almacenados en un almacén y provistos por un proveedor; son la unidad física que se incluye en los envíos.

## Dependencias

- `apps.warehouses` — FK `warehouse_id` (almacén donde está guardado el producto)
- `apps.suppliers` — FK `supplier_id` (empresa que provee el producto)

## Archivos a crear/modificar

| Acción | Archivo |
|---|---|
| Crear | `apps/products/models.py` |
| Crear | `apps/products/serializers.py` |
| Crear | `apps/products/views.py` |
| Crear | `apps/products/urls.py` |
| Crear | `apps/products/filters.py` |
| Crear | `apps/products/admin.py` |
| Modificar | `apps/products/apps.py` |
| Ejecutar | `python manage.py makemigrations products` |
| Modificar | `config/urls.py` |
| Modificar | `config/settings/base.py` |

---

## Tareas

### TASK-01: Modelo `Product`
**Archivo:** `apps/products/models.py`
**Descripción:** Definir el modelo Django que representa la tabla `products` del schema.
**Detalles:**
- Importar `from django.db import models` y las apps dependientes con importación lazy o mediante cadena de texto en ForeignKey
- Clase: `Product(models.Model)`
- Campo `supplier`: `ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='products')`
- Campo `warehouse`: `ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='products')`
- Campo `name`: `CharField(max_length=200)`
- Campo `sku`: `CharField(max_length=100, unique=True)`
- Campo `description`: `TextField(blank=True, null=True)`
- Campo `weight_kg`: `DecimalField(max_digits=8, decimal_places=3)`
- Campo `unit_price`: `DecimalField(max_digits=10, decimal_places=2)`
- Campo `stock`: `IntegerField(default=0)` — stock de unidades disponibles en almacén
- Campo `is_active`: `BooleanField(default=True)`
- Campo `created_at`: `DateTimeField(auto_now_add=True)`
- Campo `updated_at`: `DateTimeField(auto_now=True)`
- `Meta.db_table = 'products'`
- `Meta.ordering = ['name']`
- `__str__`: retorna `f"{self.sku} — {self.name}"`

---

### TASK-02: Serializer `ProductSerializer`
**Archivo:** `apps/products/serializers.py`
**Descripción:** Serializer DRF con validación de stock no negativo.
**Detalles:**
- Importar `from rest_framework import serializers` y `from .models import Product`
- Clase: `ProductSerializer(serializers.ModelSerializer)`
- `Meta.model = Product`
- `Meta.fields = '__all__'`
- `Meta.read_only_fields = ['id', 'created_at', 'updated_at']`
- Validación custom `validate_stock`: si `value < 0`, lanzar `serializers.ValidationError("El stock no puede ser negativo.")` — esta es la regla de negocio de scope.md
- No se necesitan serializers anidados; `supplier` y `warehouse` se exponen como IDs (ForeignKey estándar)

---

### TASK-03: ViewSet `ProductViewSet`
**Archivo:** `apps/products/views.py`
**Descripción:** ViewSet con queryset filtrado por activos y soft delete en `destroy`.
**Detalles:**
- Importar `from rest_framework import viewsets` y `from .models import Product` y `from .serializers import ProductSerializer` y `from .filters import ProductFilter`
- Clase: `ProductViewSet(viewsets.ModelViewSet)`
- `queryset = Product.objects.filter(is_active=True).select_related('supplier', 'warehouse')`
- `serializer_class = ProductSerializer`
- `filterset_class = ProductFilter`
- `search_fields = ['name', 'sku', 'description']`
- `ordering_fields = ['name', 'unit_price', 'stock', 'weight_kg', 'created_at']`
- Override de `destroy(self, request, *args, **kwargs)`:
  - Obtener la instancia con `self.get_object()`
  - Marcar `instance.is_active = False`
  - Llamar `instance.save()`
  - Retornar `Response(status=status.HTTP_204_NO_CONTENT)`
  - Importar `from rest_framework.response import Response` y `from rest_framework import status`

---

### TASK-04: Router de URLs
**Archivo:** `apps/products/urls.py`
**Descripción:** Registrar el ViewSet en un `DefaultRouter`.
**Detalles:**
- Importar `from rest_framework.routers import DefaultRouter` y `from .views import ProductViewSet`
- Crear `router = DefaultRouter()`
- `router.register(r'products', ProductViewSet)`
- `urlpatterns = router.urls`
- No hay recursos anidados para este módulo según architecture.md

---

### TASK-05: Filtros `ProductFilter`
**Archivo:** `apps/products/filters.py`
**Descripción:** FilterSet con los campos más relevantes para búsqueda operativa de productos.
**Detalles:**
- Importar `import django_filters` y `from .models import Product`
- Clase: `ProductFilter(django_filters.FilterSet)`
- Filtro `supplier`: `django_filters.NumberFilter(field_name='supplier')` — filtrar por ID de proveedor
- Filtro `warehouse`: `django_filters.NumberFilter(field_name='warehouse')` — filtrar por ID de almacén
- Filtro `is_active`: `django_filters.BooleanFilter(field_name='is_active')`
- Filtro `stock_min`: `django_filters.NumberFilter(field_name='stock', lookup_expr='gte')` — stock mínimo
- Filtro `stock_max`: `django_filters.NumberFilter(field_name='stock', lookup_expr='lte')` — stock máximo
- Filtro `unit_price_min`: `django_filters.NumberFilter(field_name='unit_price', lookup_expr='gte')`
- Filtro `unit_price_max`: `django_filters.NumberFilter(field_name='unit_price', lookup_expr='lte')`
- `Meta.model = Product`
- `Meta.fields = ['supplier', 'warehouse', 'is_active']`

---

### TASK-06: Admin `ProductAdmin`
**Archivo:** `apps/products/admin.py`
**Descripción:** Registrar el modelo en el panel Django Admin con campos útiles.
**Detalles:**
- Importar `from django.contrib import admin` y `from .models import Product`
- Clase: `ProductAdmin(admin.ModelAdmin)`
- `list_display = ['sku', 'name', 'supplier', 'warehouse', 'stock', 'unit_price', 'weight_kg', 'is_active']`
- `list_filter = ['is_active', 'supplier', 'warehouse']`
- `search_fields = ['name', 'sku', 'description']`
- `readonly_fields = ['created_at', 'updated_at']`
- Registrar: `admin.site.register(Product, ProductAdmin)`

---

### TASK-07: AppConfig
**Archivo:** `apps/products/apps.py`
**Descripción:** Asegurarse de que `AppConfig` tiene el `name` correcto.
**Detalles:**
- Clase: `ProductsConfig(AppConfig)`
- `default_auto_field = 'django.db.models.BigAutoField'`
- `name = 'apps.products'`
- El archivo `apps/products/__init__.py` debe contener `default_app_config = 'apps.products.apps.ProductsConfig'` si no existe aún

---

### TASK-08: Migración inicial
**Archivo:** `apps/products/migrations/`
**Descripción:** Generar la migración del modelo `Product`.
**Detalles:**
- Ejecutar: `python manage.py makemigrations products`
- Verificar que la migración generada incluye los campos `supplier`, `warehouse`, `name`, `sku`, `description`, `weight_kg`, `unit_price`, `stock`, `is_active`, `created_at`, `updated_at`
- Verificar que las FK apuntan a `warehouses.Warehouse` y `suppliers.Supplier` correctamente
- No ejecutar `migrate` — lo hace el usuario manualmente

---

### TASK-09: Registro en `config/urls.py`
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs de `apps.products` bajo el prefijo `/api/v1/`.
**Detalles:**
- Agregar a `urlpatterns` la línea: `path('api/v1/', include('apps.products.urls'))`
- Verificar que el import `from django.urls import include, path` ya existe
- No duplicar el prefijo `api/v1/` si ya hay un `include` general que agrupa todas las apps — en ese caso agregar solo la línea `path('api/v1/', include('apps.products.urls'))` junto a los otros módulos del mismo nivel

---

### TASK-10: Registro en `INSTALLED_APPS`
**Archivo:** `config/settings/base.py`
**Descripción:** Agregar `apps.products` a `INSTALLED_APPS`.
**Detalles:**
- Agregar `'apps.products'` a la lista `INSTALLED_APPS` en `config/settings/base.py`
- Colocarla después de `'apps.suppliers'` y `'apps.warehouses'` para respetar el orden del grafo de dependencias
