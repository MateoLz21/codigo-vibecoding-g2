from rest_framework import serializers

from .models import Shipment, ShipmentItem


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ['id', 'unit_price', 'subtotal', 'shipment']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['product'] = {
            'id': instance.product_id,
            'name': instance.product.name,
            'sku': instance.product.sku,
        }
        return data

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser mayor o igual a 1.")
        return value


class ShipmentSerializer(serializers.ModelSerializer):
    # Reverse FK — not included by DRF's __all__ (only forward relations are).
    # Needed so the detail page can render items without a separate API call.
    items = ShipmentItemSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['id', 'total_weight_kg', 'shipping_cost', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['customer'] = {
            'id': instance.customer_id,
            'name': instance.customer.name,
        }
        data['origin_warehouse'] = {
            'id': instance.origin_warehouse_id,
            'name': instance.origin_warehouse.name,
        }
        data['transport'] = (
            {'id': instance.transport_id, 'plate_number': instance.transport.plate_number}
            if instance.transport_id
            else None
        )
        data['route'] = (
            {'id': instance.route_id, 'name': instance.route.name}
            if instance.route_id
            else None
        )
        return data
