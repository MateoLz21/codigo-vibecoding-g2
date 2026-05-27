from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'supplier', 'warehouse', 'stock', 'unit_price', 'weight_kg', 'is_active']
    list_filter = ['is_active', 'supplier', 'warehouse']
    search_fields = ['name', 'sku', 'description']
    readonly_fields = ['created_at', 'updated_at']
