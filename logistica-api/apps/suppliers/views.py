from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view

from .filters import SupplierFilter
from .models import Supplier
from .serializers import SupplierSerializer

_SOFT_DELETE_DESC = 'Soft delete: marca is_active=False. El registro permanece en la base de datos.'


@extend_schema_view(
    destroy=extend_schema(description=_SOFT_DELETE_DESC),
)
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = SupplierFilter
    search_fields = ['name', 'tax_id', 'email', 'contact_name']
    ordering_fields = ['name', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
