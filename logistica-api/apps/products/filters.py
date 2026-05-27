import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    supplier = django_filters.NumberFilter(field_name='supplier')
    warehouse = django_filters.NumberFilter(field_name='warehouse')
    is_active = django_filters.BooleanFilter(field_name='is_active')
    stock_min = django_filters.NumberFilter(field_name='stock', lookup_expr='gte')
    stock_max = django_filters.NumberFilter(field_name='stock', lookup_expr='lte')
    unit_price_min = django_filters.NumberFilter(field_name='unit_price', lookup_expr='gte')
    unit_price_max = django_filters.NumberFilter(field_name='unit_price', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['supplier', 'warehouse', 'is_active']
