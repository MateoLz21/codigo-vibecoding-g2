from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ShipmentItemViewSet, ShipmentViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')

shipment_item_list = ShipmentItemViewSet.as_view({'get': 'list', 'post': 'create'})
shipment_item_detail = ShipmentItemViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = router.urls + [
    path('shipments/<int:shipment_pk>/items/', shipment_item_list, name='shipment-item-list'),
    path('shipments/<int:shipment_pk>/items/<int:pk>/', shipment_item_detail, name='shipment-item-detail'),
]
