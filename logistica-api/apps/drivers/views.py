from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view

from .filters import DriverFilter
from .models import Driver
from .serializers import DriverSerializer

_SOFT_DELETE_DESC = 'Soft delete: marca user.is_active=False (via OneToOne con auth_user). El registro permanece en la base de datos.'


@extend_schema_view(
    destroy=extend_schema(description=_SOFT_DELETE_DESC),
)
class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.filter(user__is_active=True).select_related('user')
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = DriverFilter
    search_fields = ['license_number', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['license_number', 'license_expiry', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.user.is_active = False
        instance.user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
