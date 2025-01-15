from rest_framework.routers import DefaultRouter

from ..views import FeatureViewSet

router = DefaultRouter()
router.register(r"", FeatureViewSet, basename="features")
urlpatterns = router.urls
