from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view

from .filters import TransportFilter
from .models import Transport
from .serializers import TransportSerializer

_SOFT_DELETE_DESC = 'Soft delete: marca is_active=False. El registro permanece en la base de datos.'


@extend_schema_view(
    destroy=extend_schema(description=_SOFT_DELETE_DESC),
)
class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.filter(is_active=True)
    serializer_class = TransportSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = TransportFilter
    search_fields = ['plate_number', 'brand', 'model']
    ordering_fields = ['plate_number', 'max_capacity_kg', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
