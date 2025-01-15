from rest_framework.routers import DefaultRouter

from .views import HeapBoundaryViewSet, IterationViewSet

router = DefaultRouter()
router.register(r"heap-boundary", HeapBoundaryViewSet, basename="heap-boundary")
router.register(r"", IterationViewSet, basename="iteration")
urlpatterns = router.urls
