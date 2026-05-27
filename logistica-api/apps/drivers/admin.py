from django.contrib import admin

from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'license_number', 'license_expiry', 'phone', 'is_available']
    list_filter = ['is_available', 'license_expiry']
    search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']
