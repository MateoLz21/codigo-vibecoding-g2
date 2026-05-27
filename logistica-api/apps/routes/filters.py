import django_filters

from .models import Route


class RouteFilter(django_filters.FilterSet):
    class Meta:
        model = Route
        fields = ['origin_warehouse', 'is_active']
