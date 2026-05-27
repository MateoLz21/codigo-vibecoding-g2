import django_filters

from .models import Customer


class CustomerFilter(django_filters.FilterSet):
    email = django_filters.CharFilter(lookup_expr='icontains')
    name = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Customer
        fields = ['customer_type', 'is_active', 'email', 'name']
