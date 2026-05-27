from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view

from .filters import RouteFilter
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer

_SOFT_DELETE_DESC = 'Soft delete: marca is_active=False. El registro permanece en la base de datos.'

_ROUTE_PK = OpenApiParameter(
    'route_pk',
    OpenApiTypes.INT,
    OpenApiParameter.PATH,
    description='ID de la ruta a la que pertenecen las paradas',
    required=True,
)


@extend_schema_view(
    destroy=extend_schema(description=_SOFT_DELETE_DESC),
)
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.filter(is_active=True)
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = RouteFilter
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'estimated_duration_hours']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        tags=['route-stops'],
        parameters=[_ROUTE_PK],
    ),
    create=extend_schema(
        tags=['route-stops'],
        parameters=[_ROUTE_PK],
        description='Crea una parada para la ruta indicada. El campo route se asigna automáticamente desde la URL.',
    ),
    retrieve=extend_schema(tags=['route-stops'], parameters=[_ROUTE_PK]),
    update=extend_schema(tags=['route-stops'], parameters=[_ROUTE_PK]),
    partial_update=extend_schema(tags=['route-stops'], parameters=[_ROUTE_PK]),
    destroy=extend_schema(
        tags=['route-stops'],
        parameters=[_ROUTE_PK],
        description='Borrado físico de la parada. La parada se elimina permanentemente de la base de datos.',
    ),
)
class RouteStopViewSet(viewsets.ModelViewSet):
    serializer_class = RouteStopSerializer
    permission_classes = [IsAuthenticated]
    queryset = RouteStop.objects.all()

    def get_queryset(self):
        return RouteStop.objects.filter(route_id=self.kwargs['route_pk'])

    def perform_create(self, serializer):
        serializer.save(route_id=self.kwargs['route_pk'])
