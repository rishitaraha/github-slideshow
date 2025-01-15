from django.contrib import admin

from shared.admin import NoDeleteModelAdmin

from .filters import FeatureFlagFilter
from .forms import OrganisationForm
from .models import Organisation, OrganisationAccessToken


@admin.register(Organisation)
class OrganisationAdmin(NoDeleteModelAdmin):
    # Form Config.
    fieldsets = ((None, {"fields": ("id", "name", "feature_flags")}),)

    readonly_fields = ("id",)

    form = OrganisationForm

    # List Config.
    list_display = ("name", "created_at", "updated_at")
    list_filter = (FeatureFlagFilter,)
    list_per_page = 25
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(OrganisationAccessToken)
class OrgAccessTokenAdmin(NoDeleteModelAdmin):
    # Form Config.
    fieldsets = ((None, {"fields": ("org", "token", "is_active")}),)

    readonly_fields = ("token",)

    # List Config.
    list_display = ("org", "is_active", "created_at", "updated_at")
    list_filter = ("is_active",)
    list_per_page = 25
    search_fields = ("org__name",)
    ordering = ("org__name",)

    # Methods.
    def get_readonly_fields(self, request, obj=None):
        read_only_fields = super().get_readonly_fields(request, obj)

        # If obj is not None, it means we are editing an existing record.
        if obj:
            read_only_fields = [*read_only_fields, "org"]

        return read_only_fields
