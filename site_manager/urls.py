from rest_framework.routers import DefaultRouter

from .views import KpiViewSet, SiteViewSet

router = DefaultRouter()
router.register(r"", SiteViewSet, basename="site")
router.register(r"", KpiViewSet, basename="site-kpi")
urlpatterns = router.urls
