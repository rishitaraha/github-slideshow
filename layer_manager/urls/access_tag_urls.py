from rest_framework.routers import DefaultRouter

from ..views import AccessTagViewSet

router = DefaultRouter()
router.register(r"", AccessTagViewSet, basename="access-tags")
urlpatterns = router.urls
