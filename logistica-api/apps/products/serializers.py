from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['supplier'] = {
            'id': instance.supplier_id,
            'name': instance.supplier.name,
        }
        data['warehouse'] = {
            'id': instance.warehouse_id,
            'name': instance.warehouse.name,
        }
        return data

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return value

    def validate_unit_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio unitario debe ser mayor a cero.")
        return value
