from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    FailedProcessingStatusUpdateView,
    GCPImageTagViewSet,
    GCPViewSet,
    GeotagImageViewSet,
    ImagesUploadViewSet,
    IterationDatasetViewSet,
    PresetViewSet,
    TaskViewSet,
)

router = DefaultRouter()


router.register(
    "iteration-dataset", IterationDatasetViewSet, basename="iteration-dataset"
)
router.register("iteration-dataset", ImagesUploadViewSet, basename="iteration-dataset")
router.register("geotag-images", GeotagImageViewSet, basename="geotag-images")
router.register("gcps", GCPViewSet, basename="gcps")
router.register("presets", PresetViewSet, basename="presets")
router.register("gcp-image-tags", GCPImageTagViewSet, basename="gcp-image-tags")
router.register("tasks", TaskViewSet, basename="tasks")

urlpatterns = router.urls
urlpatterns += [
    path(
        "failed_status_update",
        FailedProcessingStatusUpdateView.as_view(),
        name="failed_status_update",
    ),
]
