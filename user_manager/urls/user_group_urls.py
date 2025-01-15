from rest_framework.routers import DefaultRouter

from ..views import UserGroupViewSet

router = DefaultRouter()
router.register(r"", UserGroupViewSet, basename="user-groups")
urlpatterns = router.urls
