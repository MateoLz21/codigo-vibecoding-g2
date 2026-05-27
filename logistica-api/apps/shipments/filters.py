import django_filters

from .models import Shipment


class ShipmentFilter(django_filters.FilterSet):
    class Meta:
        model = Shipment
        fields = {
            'status': ['exact'],
            'customer': ['exact'],
            'transport': ['exact'],
            'route': ['exact'],
            'origin_warehouse': ['exact'],
            'shipping_date': ['exact', 'gte', 'lte'],
            'estimated_delivery_date': ['exact'],
        }
