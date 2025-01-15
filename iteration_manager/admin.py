from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from shared.admin import NoDeleteModelAdmin
from shared.filters import RelatedDropdownFilter

from .forms import IterationForm
from .models import Iteration


@admin.register(Iteration)
class IterationAdmin(NoDeleteModelAdmin):
    # Form Config.
    fieldsets = (
        (_("Basic Info"), {"fields": ("id", "name", "site")}),
        (
            _("More Info"),
            {
                "fields": (
                    "date",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse", "readonly"),
            },
        ),
    )

    readonly_fields = (
        "id",
        "date",
        "created_at",
        "updated_at",
    )

    form = IterationForm

    # List Config.
    list_display = ("name", "date", "site")
    list_filter = (("site__project__org", RelatedDropdownFilter), "date")
    list_per_page = 25
    search_fields = ("name",)
    ordering = ("name",)

    def formfield_for_dbfield(self, *args, **kwargs):
        formfield = super().formfield_for_dbfield(*args, **kwargs)

        # Disabling add related to avoid moving the iteration to a site of different project/org.
        formfield.widget.can_add_related = False
        return formfield
