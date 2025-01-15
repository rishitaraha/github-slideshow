from django.urls import path
from rest_framework.routers import DefaultRouter

from shared.views.file_info_views import FileInfoViewSet

from .views import environment, index, ping

urlpatterns = [
    path("", index, name="index"),
    path("ping", ping, name="ping"),
    path("environment/", environment, name="environment"),
]

router = DefaultRouter()
router.register(r"files", FileInfoViewSet, basename="files")
urlpatterns += router.urls
