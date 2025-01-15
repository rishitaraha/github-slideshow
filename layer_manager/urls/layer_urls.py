from rest_framework.routers import DefaultRouter

from ..views import LayerFileViewSet, LayerViewSet

router = DefaultRouter()
router.register(r"", LayerViewSet, basename="layers")
router.register(r"files", LayerFileViewSet, basename="layer-files")
urlpatterns = router.urls
