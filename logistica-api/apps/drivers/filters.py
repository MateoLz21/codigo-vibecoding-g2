import django_filters

from .models import Driver


class DriverFilter(django_filters.FilterSet):
    is_available = django_filters.BooleanFilter(field_name='is_available')
    license_expiry_gte = django_filters.DateFilter(field_name='license_expiry', lookup_expr='gte')
    license_expiry_lte = django_filters.DateFilter(field_name='license_expiry', lookup_expr='lte')
    user_is_active = django_filters.BooleanFilter(field_name='user__is_active')

    class Meta:
        model = Driver
        fields = ['is_available']
