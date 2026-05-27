from django.contrib import admin

from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'city', 'country', 'capacity_m3', 'is_active', 'created_at']
    list_filter = ['city', 'country', 'is_active']
    search_fields = ['name', 'city', 'address']
