from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from sequences.models import Sequence

# Setting headers and titles.
admin.site.site_header = _("Aereo Cloud Administration")
admin.site.site_title = _("Aereo Cloud Admin")
admin.site.index_title = _("Control Center")

admin.site.site_url = None


class NoDeleteModelAdmin(admin.ModelAdmin):
    def has_delete_permission(self, request, obj=None):
        return False

    def delete_model(self, request, obj):
        pass


admin.site.unregister(Sequence)
