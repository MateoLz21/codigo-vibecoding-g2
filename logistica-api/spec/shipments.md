# Spec — Shipments

## Contexto

`shipments` es la unidad central de negocio de la API. Representa un envío completo de productos tecnológicos desde un almacén de origen hasta la dirección de un cliente. Incluye dos modelos: `Shipment` (el envío) y `ShipmentItem` (los productos incluidos en él), con lógica de negocio para congelar precios y calcular peso y costo automáticamente.

## Dependencias

- `apps.customers` — FK `customer_id`
- `apps.transport` — FK `transport_id`
- `apps.routes` — FK `route_id`
- `apps.warehouses` — FK `origin_warehouse_id`
- `apps.products` — FK `product_id` en `ShipmentItem`

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `apps/shipments/models.py` | Crear |
| `apps/shipments/serializers.py` | Crear |
| `apps/shipments/services.py` | Crear |
| `apps/shipments/views.py` | Crear |
| `apps/shipments/urls.py` | Crear |
| `apps/shipments/filters.py` | Crear |
| `apps/shipments/admin.py` | Crear |
| `apps/shipments/apps.py` | Modificar |
| `apps/shipments/migrations/` | Generar migración |
| `config/urls.py` | Modificar — incluir URLs de shipments |
| `config/settings/base.py` | Modificar — agregar `apps.shipments` a `INSTALLED_APPS` |

---

## Tareas

### TASK-01: Modelo `Shipment`
**Archivo:** `apps/shipments/models.py`
**Descripción:** Crear el modelo `Shipment` que representa un envío completo.
**Detalles:**
- Clase: `Shipment(models.Model)`
- `Meta.db_table = 'shipments'`
- `Meta.ordering = ['-created_at']`
- Choices para `status`:
  ```python
  PENDING = 'pending'
  IN_TRANSIT = 'in_transit'
  DELIVERED = 'delivered'
  CANCELLED = 'cancelled'
  STATUS_CHOICES = [
      (PENDING, 'Pending'),
      (IN_TRANSIT, 'In Transit'),
      (DELIVERED, 'Delivered'),
      (CANCELLED, 'Cancelled'),
  ]
  ```
- Campos según `database-schema.md`:
  - `customer` = `ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='shipments')`
  - `transport` = `ForeignKey('transport.Transport', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')`
  - `route` = `ForeignKey('routes.Route', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')`
  - `origin_warehouse` = `ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='shipments')`
  - `status` = `CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)`
  - `origin_address` = `TextField()`
  - `destination_address` = `TextField()`
  - `shipping_date` = `DateField(null=True, blank=True)`
  - `estimated_delivery_date` = `DateField(null=True, blank=True)`
  - `actual_delivery_date` = `DateField(null=True, blank=True)`
  - `total_weight_kg` = `DecimalField(max_digits=10, decimal_places=3, default=0)`
  - `shipping_cost` = `DecimalField(max_digits=10, decimal_places=2, default=0)`
  - `notes` = `TextField(blank=True, null=True)`
  - `created_at` = `DateTimeField(auto_now_add=True)`
  - `updated_at` = `DateTimeField(auto_now=True)`
- `__str__`: retorna `f"Shipment {self.id} — {self.customer} [{self.status}]"`

---

### TASK-02: Modelo `ShipmentItem`
**Archivo:** `apps/shipments/models.py`
**Descripción:** Crear el modelo `ShipmentItem` que representa un producto incluido en un envío. El precio se congela en el momento de creación.
**Detalles:**
- Clase: `ShipmentItem(models.Model)`
- `Meta.db_table = 'shipment_items'`
- `Meta.ordering = ['id']`
- Campos según `database-schema.md`:
  - `shipment` = `ForeignKey(Shipment, on_delete=models.CASCADE, related_name='items')`
  - `product` = `ForeignKey('products.Product', on_delete=models.PROTECT, related_name='shipment_items')`
  - `quantity` = `IntegerField()`
  - `unit_price` = `DecimalField(max_digits=10, decimal_places=2)` — precio congelado al momento del envío
  - `subtotal` = `DecimalField(max_digits=10, decimal_places=2)` — calculado: `quantity × unit_price`
- `__str__`: retorna `f"{self.quantity}x {self.product} @ {self.unit_price}"`
- **Nota:** `unit_price` y `subtotal` NO se calculan en el modelo; se asignan desde `services.py`

---

### TASK-03: Servicio de negocio `ShipmentService`
**Archivo:** `apps/shipments/services.py`
**Descripción:** Centralizar toda la lógica de negocio de shipments: congelación de precio, cálculo de subtotal, recálculo de peso y costo del envío.
**Detalles:**
- Crear módulo `services.py` con una clase `ShipmentService` o funciones independientes:

**Función `create_shipment_item(shipment, product, quantity)`:**
  - Copia `product.unit_price` al campo `unit_price` del item (precio congelado)
  - Calcula `subtotal = quantity * product.unit_price`
  - Crea y guarda el `ShipmentItem`
  - Llama a `recalculate_shipment_totals(shipment)` al terminar
  - Retorna el `ShipmentItem` creado

**Función `update_shipment_item(item, quantity)`:**
  - Actualiza `quantity` del item
  - Recalcula `subtotal = quantity * item.unit_price` (precio ya congelado — no se vuelve a leer del producto)
  - Guarda el item
  - Llama a `recalculate_shipment_totals(item.shipment)`
  - Retorna el item actualizado

**Función `recalculate_shipment_totals(shipment)`:**
  - Consulta todos los `ShipmentItem` del envío con `select_related('product')`
  - Calcula `total_weight_kg = sum(item.quantity * item.product.weight_kg for item in items)`
  - Calcula `shipping_cost = total_weight_kg * Decimal('0.5')`
  - Actualiza `shipment.total_weight_kg` y `shipment.shipping_cost`
  - Guarda con `shipment.save(update_fields=['total_weight_kg', 'shipping_cost'])`

---

### TASK-04: Serializers de `Shipment` y `ShipmentItem`
**Archivo:** `apps/shipments/serializers.py`
**Descripción:** Crear los serializers para `Shipment` y `ShipmentItem`. El serializer de item NO debe aceptar `unit_price` ni `subtotal` del cliente — esos campos son calculados por el servicio.
**Detalles:**

**`ShipmentItemSerializer`:**
  - `class Meta: model = ShipmentItem`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'unit_price', 'subtotal']`
  - `unit_price` y `subtotal` son de solo lectura porque los calcula `services.py`
  - Validación de `quantity`: debe ser `>= 1`; levantar `serializers.ValidationError` si es menor

**`ShipmentSerializer`:**
  - `class Meta: model = Shipment`
  - `fields = '__all__'`
  - `read_only_fields = ['id', 'total_weight_kg', 'shipping_cost', 'created_at', 'updated_at']`
  - `total_weight_kg` y `shipping_cost` son de solo lectura porque los calcula el servicio

---

### TASK-05: ViewSet de `Shipment`
**Archivo:** `apps/shipments/views.py`
**Descripción:** Crear `ShipmentViewSet` con CRUD estándar y soft delete.
**Detalles:**
- Clase: `ShipmentViewSet(viewsets.ModelViewSet)`
- `queryset = Shipment.objects.filter(is_active=True)` — **Nota:** `Shipment` NO tiene campo `is_active` en el schema; el queryset base debe ser `Shipment.objects.all()` con `select_related('customer', 'transport', 'route', 'origin_warehouse')`
- `serializer_class = ShipmentSerializer`
- `filterset_class = ShipmentFilter`
- `search_fields = ['origin_address', 'destination_address', 'customer__name']`
- `ordering_fields = ['created_at', 'shipping_date', 'shipping_cost', 'total_weight_kg']`
- Override de `destroy()`: retornar `HTTP 405 Method Not Allowed` con mensaje `{"detail": "Los envíos no se pueden eliminar."}` — el schema no tiene `is_active` en shipments, por lo que no aplica soft delete estándar
- **Alternativa aceptada:** si se desea soft delete, agregar campo `is_active` al modelo (ver TASK-01 nota adicional más abajo)

> **Decisión de diseño — soft delete en Shipment:** el `database-schema.md` NO incluye campo `is_active` en la tabla `shipments`. Dado que el spec de `spec.md` indica soft delete para "todos los módulos", se debe escoger una de dos opciones:
> - **Opción A (recomendada):** agregar `is_active = BooleanField(default=True)` al modelo `Shipment` y al schema (extiende el schema documentado para respetar la regla de negocio global)
> - **Opción B:** bloquear DELETE con 405 y no agregar el campo
>
> Este spec elige la **Opción A**: agregar `is_active` al modelo y aplicar soft delete consistente con el resto de la API. El campo se agrega en TASK-01 y se filtra en `ShipmentViewSet`.

**Corrección a TASK-01:** agregar campo `is_active = BooleanField(default=True)` al modelo `Shipment`.

**Con la Opción A:**
- `queryset = Shipment.objects.filter(is_active=True).select_related('customer', 'transport', 'route', 'origin_warehouse')`
- Override de `destroy()`:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.is_active = False
      instance.save(update_fields=['is_active'])
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```

---

### TASK-06: ViewSet de `ShipmentItem` (recurso anidado)
**Archivo:** `apps/shipments/views.py`
**Descripción:** Crear `ShipmentItemViewSet` para gestionar los ítems de un envío específico. Usa `services.py` para toda la lógica de negocio.
**Detalles:**
- Clase: `ShipmentItemViewSet(viewsets.ModelViewSet)`
- `queryset = ShipmentItem.objects.select_related('product', 'shipment')`
- `serializer_class = ShipmentItemSerializer`
- Override de `get_queryset()`: filtra por `shipment_id` extraído de `self.kwargs['shipment_pk']`
  ```python
  def get_queryset(self):
      return ShipmentItem.objects.filter(
          shipment_id=self.kwargs['shipment_pk']
      ).select_related('product', 'shipment')
  ```
- Override de `perform_create()`: en lugar de llamar `serializer.save()` directamente, usar el servicio:
  ```python
  def perform_create(self, serializer):
      from .services import create_shipment_item
      shipment = get_object_or_404(Shipment, pk=self.kwargs['shipment_pk'])
      product = serializer.validated_data['product']
      quantity = serializer.validated_data['quantity']
      create_shipment_item(shipment=shipment, product=product, quantity=quantity)
  ```
- Override de `perform_update()`: usar el servicio `update_shipment_item` para recalcular:
  ```python
  def perform_update(self, serializer):
      from .services import update_shipment_item
      item = self.get_object()
      quantity = serializer.validated_data.get('quantity', item.quantity)
      update_shipment_item(item=item, quantity=quantity)
  ```
- Override de `destroy()`: borrado real (los items de envío sí se eliminan físicamente) y llamar a `recalculate_shipment_totals` para actualizar totales del envío padre:
  ```python
  def destroy(self, request, *args, **kwargs):
      from .services import recalculate_shipment_totals
      instance = self.get_object()
      shipment = instance.shipment
      instance.delete()
      recalculate_shipment_totals(shipment)
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```

---

### TASK-07: URLs con recurso anidado
**Archivo:** `apps/shipments/urls.py`
**Descripción:** Configurar el router local con `ShipmentViewSet` y el recurso anidado `ShipmentItemViewSet` bajo `/shipments/{shipment_pk}/items/`.
**Detalles:**
- Usar `DefaultRouter` de DRF
- Registrar `ShipmentViewSet` con prefix `shipments`
- Para el recurso anidado, usar rutas manuales (no hay dependencia externa de `drf-nested-routers`):
  ```python
  from rest_framework.routers import DefaultRouter
  from django.urls import path, include
  from .views import ShipmentViewSet, ShipmentItemViewSet

  router = DefaultRouter()
  router.register(r'shipments', ShipmentViewSet, basename='shipment')

  shipment_item_list = ShipmentItemViewSet.as_view({'get': 'list', 'post': 'create'})
  shipment_item_detail = ShipmentItemViewSet.as_view({
      'get': 'retrieve',
      'put': 'update',
      'patch': 'partial_update',
      'delete': 'destroy',
  })

  urlpatterns = router.urls + [
      path('shipments/<int:shipment_pk>/items/', shipment_item_list, name='shipment-item-list'),
      path('shipments/<int:shipment_pk>/items/<int:pk>/', shipment_item_detail, name='shipment-item-detail'),
  ]
  ```

---

### TASK-08: Filtros `ShipmentFilter`
**Archivo:** `apps/shipments/filters.py`
**Descripción:** Crear `ShipmentFilter` con los campos más relevantes para búsqueda operativa de envíos.
**Detalles:**
- Importar `django_filters` y el modelo `Shipment`
- Clase: `ShipmentFilter(django_filters.FilterSet)`
- Campos a filtrar:
  - `status` — exact
  - `customer` — exact (por ID)
  - `transport` — exact (por ID)
  - `route` — exact (por ID)
  - `origin_warehouse` — exact (por ID)
  - `shipping_date` — exact, `shipping_date__gte`, `shipping_date__lte` (rango de fechas)
  - `estimated_delivery_date` — exact
- `class Meta: model = Shipment; fields = [...]`

---

### TASK-09: Admin de `Shipment` y `ShipmentItem`
**Archivo:** `apps/shipments/admin.py`
**Descripción:** Registrar ambos modelos en Django Admin con configuración útil para operaciones.
**Detalles:**

**`ShipmentAdmin`:**
- `list_display = ['id', 'customer', 'status', 'origin_warehouse', 'total_weight_kg', 'shipping_cost', 'shipping_date', 'created_at']`
- `list_filter = ['status', 'origin_warehouse', 'shipping_date']`
- `search_fields = ['customer__name', 'origin_address', 'destination_address']`
- `readonly_fields = ['total_weight_kg', 'shipping_cost', 'created_at', 'updated_at']`

**`ShipmentItemInline`** (TabularInline para ver items dentro del envío):
- `model = ShipmentItem`
- `extra = 0`
- `readonly_fields = ['unit_price', 'subtotal']`

Agregar el inline a `ShipmentAdmin`:
- `inlines = [ShipmentItemInline]`

**`ShipmentItemAdmin`** (registro independiente):
- `list_display = ['id', 'shipment', 'product', 'quantity', 'unit_price', 'subtotal']`
- `search_fields = ['shipment__id', 'product__name', 'product__sku']`
- `readonly_fields = ['unit_price', 'subtotal']`

---

### TASK-10: `AppConfig`
**Archivo:** `apps/shipments/apps.py`
**Descripción:** Verificar o crear el `AppConfig` correcto para la app `shipments`.
**Detalles:**
- Clase: `ShipmentsConfig(AppConfig)`
- `name = 'apps.shipments'`
- `verbose_name = 'Shipments'`
- `default_auto_field = 'django.db.models.BigAutoField'`

---

### TASK-11: Migración inicial
**Archivo:** `apps/shipments/migrations/`
**Descripción:** Generar la migración inicial para los modelos `Shipment` y `ShipmentItem`.
**Detalles:**
- Ejecutar: `python manage.py makemigrations shipments`
- Verificar que la migración crea las tablas `shipments` y `shipment_items` con todos los campos y FK correctos
- Ejecutar: `python manage.py migrate` para aplicar

---

### TASK-12: Registro en `INSTALLED_APPS`
**Archivo:** `config/settings/base.py`
**Descripción:** Agregar la app `shipments` a `INSTALLED_APPS`.
**Detalles:**
- Agregar `'apps.shipments'` a la lista `INSTALLED_APPS` en `config/settings/base.py`
- Posición recomendada: al final de las apps de dominio del proyecto, después de `'apps.routes'`

---

### TASK-13: Registro de URLs en el proyecto
**Archivo:** `config/urls.py`
**Descripción:** Incluir las URLs del módulo `shipments` bajo el prefijo `/api/v1/`.
**Detalles:**
- Agregar a los `urlpatterns` de `config/urls.py`:
  ```python
  path('api/v1/', include('apps.shipments.urls')),
  ```
- Verificar que los endpoints resultantes sean:
  - `GET/POST /api/v1/shipments/`
  - `GET/PUT/PATCH/DELETE /api/v1/shipments/{id}/`
  - `GET/POST /api/v1/shipments/{id}/items/`
  - `GET/PUT/PATCH/DELETE /api/v1/shipments/{id}/items/{pk}/`
