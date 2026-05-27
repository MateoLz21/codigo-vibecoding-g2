import django_filters

from .models import Warehouse


class WarehouseFilter(django_filters.FilterSet):
    capacity_m3__gte = django_filters.NumberFilter(
        field_name='capacity_m3',
        lookup_expr='gte',
    )
    capacity_m3__lte = django_filters.NumberFilter(
        field_name='capacity_m3',
        lookup_expr='lte',
    )

    class Meta:
        model = Warehouse
        fields = ['city', 'country', 'is_active']
