from rest_framework.routers import DefaultRouter

from .views import ProcessingViewSet

router = DefaultRouter()
router.register(r"", ProcessingViewSet, basename="processing")
urlpatterns = router.urls
