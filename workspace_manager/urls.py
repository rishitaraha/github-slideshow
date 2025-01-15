from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HaulRoadAnalyticsViewSet, SmartDetectViewSet, WorkspaceViewSet

# Main workspace router.
router = DefaultRouter()
router.register("", WorkspaceViewSet, basename="workspace")

# Analytics router.
analytics_tools_router = DefaultRouter()
analytics_tools_router.register(
    "haul-roads", HaulRoadAnalyticsViewSet, basename="analytics-haul-roads"
)
analytics_tools_router.register(
    "smart-detects", SmartDetectViewSet, basename="analytics-smart-detects"
)

urlpatterns = [
    path("", include(router.urls)),
    path("analytics/", include(analytics_tools_router.urls)),
]
