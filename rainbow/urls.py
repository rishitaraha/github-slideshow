from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic.base import TemplateView

urlpatterns = [
    path("organisations/", include("org_manager.urls")),
    path("users/", include("user_manager.urls.user_urls")),
    path("auth/", include("auth_manager.urls")),
    path("user-groups/", include("user_manager.urls.user_group_urls")),
    path("projects/", include("project_manager.urls")),
    path("sites/", include("site_manager.urls")),
    path("iterations/", include("iteration_manager.urls")),
    path("workspaces/", include("workspace_manager.urls")),
    path("layers/", include("layer_manager.urls.layer_urls")),
    path("access-tags/", include("layer_manager.urls.access_tag_urls")),
    path("features/", include("layer_manager.urls.feature_urls")),
    path("dashboard/", include("dashboard.urls")),
    path("processing/", include("processing_workflow_manager.urls")),
    path("processing/", include("processing_manager.urls")),
    path("QXNoaXNoIFNpbmdo/", admin.site.urls),
    path("", include("shared.urls")),
]

# Adding static file urls.
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Enable api doc url only if debug is true.
if settings.DEBUG:
    urlpatterns.append(
        path(
            "api-doc/",
            TemplateView.as_view(
                template_name="openapi.html",
                extra_context={"schema_url": "openapi-schema"},
            ),
            name="api-doc",
        )
    )
