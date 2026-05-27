import django_filters

from .models import Transport


class TransportFilter(django_filters.FilterSet):
    driver = django_filters.NumberFilter(field_name='driver_id')
    max_capacity_kg__gte = django_filters.NumberFilter(
        field_name='max_capacity_kg',
        lookup_expr='gte',
    )
    max_capacity_kg__lte = django_filters.NumberFilter(
        field_name='max_capacity_kg',
        lookup_expr='lte',
    )

    class Meta:
        model = Transport
        fields = ['vehicle_type', 'is_active', 'year']
