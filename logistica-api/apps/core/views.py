from django.contrib.auth.models import Group, Permission, User
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.permissions import IsSuperAdmin
from apps.core.serializers import (
    AssignGroupsSerializer,
    CustomTokenObtainPairSerializer,
    GroupSerializer,
    PermissionSerializer,
    UserSerializer,
)

DOMAIN_APPS = [
    'customers', 'drivers', 'products', 'routes',
    'shipments', 'suppliers', 'transport', 'warehouses',
]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=True, methods=['post'], url_path='assign-groups')
    def assign_groups(self, request, pk=None):
        user = self.get_object()
        serializer = AssignGroupsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.groups.set(serializer.validated_data['group_ids'])
        return Response(UserSerializer(user).data)


class GroupViewSet(ModelViewSet):
    queryset = Group.objects.all().order_by('id')
    serializer_class = GroupSerializer
    permission_classes = [IsSuperAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']


class PermissionViewSet(ReadOnlyModelViewSet):
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperAdmin]
    pagination_class = None

    def get_queryset(self):
        return (
            Permission.objects
            .filter(content_type__app_label__in=DOMAIN_APPS)
            .select_related('content_type')
            .order_by('content_type__app_label', 'codename')
        )
