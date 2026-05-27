from django.contrib import admin

from .models import Route, RouteStop


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'origin_warehouse', 'estimated_duration_hours', 'is_active', 'created_at']
    list_filter = ['is_active', 'origin_warehouse']
    search_fields = ['name']


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['id', 'route', 'stop_order', 'city', 'address', 'estimated_arrival']
    list_filter = ['route', 'city']
    search_fields = ['address', 'city']
