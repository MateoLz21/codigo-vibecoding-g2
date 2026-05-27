from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RouteStopViewSet, RouteViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet, basename='route')

stops_router = DefaultRouter()
stops_router.register(r'stops', RouteStopViewSet, basename='route-stop')

urlpatterns = router.urls + [
    path('routes/<int:route_pk>/', include(stops_router.urls)),
]
