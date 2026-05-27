from django.contrib import admin

from .models import Shipment, ShipmentItem


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0
    readonly_fields = ['unit_price', 'subtotal']


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'origin_warehouse', 'total_weight_kg', 'shipping_cost', 'shipping_date', 'created_at']
    list_filter = ['status', 'origin_warehouse', 'shipping_date']
    search_fields = ['customer__name', 'origin_address', 'destination_address']
    readonly_fields = ['total_weight_kg', 'shipping_cost', 'created_at', 'updated_at']
    inlines = [ShipmentItemInline]


@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'shipment', 'product', 'quantity', 'unit_price', 'subtotal']
    search_fields = ['shipment__id', 'product__name', 'product__sku']
    readonly_fields = ['unit_price', 'subtotal']
