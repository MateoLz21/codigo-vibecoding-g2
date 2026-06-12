# Business Logic — logistica-api

## Cálculo de totales en Shipment

Toda la lógica vive en `apps/shipments/services.py`.

### Fórmulas

```
shipping_cost     = total_weight_kg × 0.5
total_weight_kg   = Σ (item.quantity × item.product.weight_kg)
```

### Cuándo se recalcula

| Evento | Efecto |
|--------|--------|
| Crear ShipmentItem | Congela `unit_price = product.unit_price`, calcula `subtotal`, recalcula totales del Shipment |
| Actualizar ShipmentItem | Usa `unit_price` ya congelado, recalcula `subtotal` y totales del Shipment |
| Borrar ShipmentItem | Borrado físico, recalcula totales del Shipment |

`total_weight_kg` y `shipping_cost` son **read-only** en el serializer — el frontend no los envía, solo los lee.

---

## Soft Delete

Todos los recursos con `is_active` usan soft delete:
- `DELETE /api/v1/<resource>/<id>/` → 204, marca `is_active=False`
- Los GETs de lista solo retornan `is_active=True`
- Excepción: `route-stops` y `shipment-items` → borrado físico real

Drivers: el soft delete marca `driver.user.is_active = False` (no el Driver directamente).

---

## Estado de Shipment

Valores: `pending` → `in_transit` → `delivered` | `cancelled`

El backend no valida transiciones de estado — el frontend debe manejar el flujo UX pero puede hacer PATCH con cualquier status válido.

---

## Congelamiento de precios

Al crear un ShipmentItem, `unit_price` se copia de `product.unit_price` en ese momento. Cambios futuros en el precio del producto **no afectan** ítems ya creados.

---

## Dependencias entre módulos

Para crear un `Product` necesitas: `Supplier` + `Warehouse` existentes.  
Para crear un `Shipment` necesitas: `Customer` + `Warehouse` (transport y route son opcionales).  
Para crear un `ShipmentItem` necesitas: `Shipment` activo + `Product` activo.  
Para crear un `Transport` puedes asignar un `Driver` existente (opcional).

---

## Paginación

Respuesta paginada estándar DRF:

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/shipments/?page=2",
  "previous": null,
  "results": [...]
}
```

Page size: 20. Param: `?page=N`.
