from django.contrib import admin

from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['plate_number', 'vehicle_type', 'brand', 'model', 'year', 'max_capacity_kg', 'driver', 'is_active']
    list_filter = ['vehicle_type', 'is_active', 'year']
    search_fields = ['plate_number', 'brand', 'model']
