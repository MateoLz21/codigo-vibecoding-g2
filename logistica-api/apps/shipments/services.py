from decimal import Decimal

from .models import Shipment, ShipmentItem


def recalculate_shipment_totals(shipment: Shipment) -> None:
    """Recalcula total_weight_kg y shipping_cost del envío a partir de sus ítems."""
    items = shipment.items.select_related('product').all()
    total_weight_kg = sum(item.quantity * item.product.weight_kg for item in items)
    shipping_cost = total_weight_kg * Decimal('0.5')
    shipment.total_weight_kg = total_weight_kg
    shipment.shipping_cost = shipping_cost
    shipment.save(update_fields=['total_weight_kg', 'shipping_cost'])


def create_shipment_item(shipment: Shipment, product, quantity: int) -> ShipmentItem:
    """Crea un ShipmentItem congelando el precio y recalcula los totales del envío."""
    unit_price = product.unit_price
    subtotal = quantity * unit_price
    item = ShipmentItem.objects.create(
        shipment=shipment,
        product=product,
        quantity=quantity,
        unit_price=unit_price,
        subtotal=subtotal,
    )
    recalculate_shipment_totals(shipment)
    return item


def update_shipment_item(item: ShipmentItem, quantity: int) -> ShipmentItem:
    """Actualiza la cantidad de un ítem usando el precio ya congelado y recalcula totales."""
    item.quantity = quantity
    item.subtotal = quantity * item.unit_price
    item.save(update_fields=['quantity', 'subtotal'])
    recalculate_shipment_totals(item.shipment)
    return item


def delete_shipment_item(item: ShipmentItem) -> None:
    """Elimina un ítem físicamente y recalcula los totales del envío padre."""
    shipment = item.shipment
    item.delete()
    recalculate_shipment_totals(shipment)
