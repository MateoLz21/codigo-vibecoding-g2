from rest_framework import status, viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from .filters import ShipmentFilter
from .models import Shipment, ShipmentItem
from .serializers import ShipmentItemSerializer, ShipmentSerializer
from .services import create_shipment_item, recalculate_shipment_totals, update_shipment_item

_SOFT_DELETE_DESC = 'Soft delete: marca is_active=False. El registro permanece en la base de datos.'

_SHIPMENT_PK = OpenApiParameter(
    'shipment_pk',
    OpenApiTypes.INT,
    OpenApiParameter.PATH,
    description='ID del envío al que pertenecen los ítems',
    required=True,
)


@extend_schema_view(
    destroy=extend_schema(description=_SOFT_DELETE_DESC),
)
class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.filter(is_active=True).select_related(
        'customer', 'transport', 'route', 'origin_warehouse'
    )
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ShipmentFilter
    search_fields = ['origin_address', 'destination_address', 'customer__name']
    ordering_fields = ['created_at', 'shipping_date', 'shipping_cost', 'total_weight_kg']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        tags=['shipment-items'],
        parameters=[_SHIPMENT_PK],
    ),
    create=extend_schema(
        tags=['shipment-items'],
        parameters=[_SHIPMENT_PK],
        description='Crea un ítem congelando el precio actual del producto y recalcula total_weight_kg y shipping_cost del envío.',
    ),
    retrieve=extend_schema(tags=['shipment-items'], parameters=[_SHIPMENT_PK]),
    update=extend_schema(tags=['shipment-items'], parameters=[_SHIPMENT_PK]),
    partial_update=extend_schema(tags=['shipment-items'], parameters=[_SHIPMENT_PK]),
    destroy=extend_schema(
        tags=['shipment-items'],
        parameters=[_SHIPMENT_PK],
        description='Borrado físico del ítem. Recalcula total_weight_kg y shipping_cost del envío padre.',
    ),
)
class ShipmentItemViewSet(viewsets.ModelViewSet):
    queryset = ShipmentItem.objects.select_related('product', 'shipment')
    serializer_class = ShipmentItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShipmentItem.objects.filter(
            shipment_id=self.kwargs['shipment_pk']
        ).select_related('product', 'shipment')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipment = get_object_or_404(Shipment, pk=self.kwargs['shipment_pk'], is_active=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        item = create_shipment_item(shipment=shipment, product=product, quantity=quantity)
        return Response(ShipmentItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data.get('quantity', instance.quantity)
        item = update_shipment_item(item=instance, quantity=quantity)
        return Response(ShipmentItemSerializer(item).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        shipment = instance.shipment
        instance.delete()
        recalculate_shipment_totals(shipment)
        return Response(status=status.HTTP_204_NO_CONTENT)
