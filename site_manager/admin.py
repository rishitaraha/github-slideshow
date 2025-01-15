from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from shared.admin import NoDeleteModelAdmin
from shared.filters import RelatedDropdownFilter

from .forms import SiteForm
from .models import Site


@admin.register(Site)
class SiteAdmin(NoDeleteModelAdmin):
    # Form Config.
    fieldsets = (
        (_("Basic Info"), {"fields": ("id", "name", "project", "type")}),
        (
            _("More Info"),
            {
                "fields": (
                    "latitude",
                    "longitude",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse", "readonly"),
            },
        ),
    )

    readonly_fields = (
        "id",
        "latitude",
        "longitude",
        "created_at",
        "updated_at",
    )

    form = SiteForm

    # List Config.
    list_display = ("name", "project", "type", "created_at")
    list_filter = (("project__org", RelatedDropdownFilter), "type")
    list_per_page = 25
    search_fields = ("name",)
    ordering = ("name",)
