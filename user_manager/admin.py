from django.contrib import admin
from django.contrib.auth.forms import UserChangeForm
from django.utils.translation import gettext_lazy as _

from shared.admin import NoDeleteModelAdmin
from shared.filters import RelatedDropdownFilter

from .forms import CreateUserForm
from .models import CustomUser


@admin.register(CustomUser)
class UserAdmin(NoDeleteModelAdmin):
    title = "Users"

    common_fieldsets = (
        (_("Personal info"), {"fields": ("first_name", "last_name", "org")}),
        (_("Permissions"), {"fields": ("type", "is_active")}),
    )

    # Form Config.
    fieldsets = (
        (None, {"fields": ("email",)}),
        *common_fieldsets,
        (
            _("More Info"),
            {
                "fields": ("last_login", "created_at", "updated_at"),
                "classes": ("collapse", "readonly"),
            },
        ),
    )

    # Fields for add user form.
    add_fieldsets = (
        (
            None,
            # password1 is password field and password2 is confirm password field.
            {"fields": ("email", "password1", "password2")},
        ),
        *common_fieldsets,
    )

    radio_fields = {"type": admin.HORIZONTAL}
    readonly_fields = ("last_login", "created_at", "updated_at")

    form = UserChangeForm
    add_form = CreateUserForm

    # List Config.
    list_display = ("name", "email", "type", "org", "created_at")
    list_filter = (("org", RelatedDropdownFilter), "type", "is_active")
    list_per_page = 25
    search_fields = ("first_name", "last_name", "email")
    ordering = ("first_name", "last_name", "email")

    # Methods.
    def get_readonly_fields(self, request, obj=None):
        read_only_fields = super().get_readonly_fields(request, obj)

        # If obj is not None, it means we are editing an existing record.
        if obj:
            read_only_fields = [*read_only_fields, "org"]

        return read_only_fields

    def get_fieldsets(self, request, obj=None):
        # If obj is None, it means we are adding a record.
        if not obj:
            return self.add_fieldsets

        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        defaults = {}

        # Use different form during user creation.
        if not obj:
            defaults["form"] = self.add_form

        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)
