from functools import partial

from django.contrib import admin
from django.forms.models import modelformset_factory
from django.http import JsonResponse
from django.urls import path

from shared.filters import RelatedDropdownFilter
from workspace_manager.forms.hra_forms import HaulRoadRiskAnalysisSettingsForm

from .models import HaulRoadRiskAnalysisSettings, HaulRoadType


@admin.register(HaulRoadRiskAnalysisSettings)
class HaulRoadRiskAnalysisSettingsAdmin(admin.ModelAdmin):
    # List Config.
    list_display = (
        "org",
        "haul_road_type",
        "type",
        "min_range",
        "max_range",
        "risk_category",
        "color",
        "unit_of_range",
    )
    list_editable = (
        "type",
        "min_range",
        "max_range",
        "risk_category",
        "color",
        "unit_of_range",
    )

    list_filter = (
        ("org", RelatedDropdownFilter),
        "type",
        "haul_road_type",
        "unit_of_range",
    )
    list_per_page = 25
    search_fields = ("org", "type", "haul_road_type")
    ordering = ("org", "type", "haul_road_type", "risk_category")

    # Forms.
    form = HaulRoadRiskAnalysisSettingsForm

    def get_changelist_formset(self, request, **kwargs):
        """
        Return a FormSet class for use on the changelist page if list_editable
        is used.
        """

        return modelformset_factory(
            self.model,
            form=self.form,
            extra=0,
            fields=self.list_editable,
            **kwargs,
            formfield_callback=partial(self.formfield_for_dbfield, request=request),
        )

    # Custom Views.
    change_form_template = "admin/workspace_manager/hra_settings_change_form.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "ajax/load-haul-road-types/",
                self.admin_site.admin_view(self.load_haul_road_types),
                name="ajax_load_haul_road_types",
            ),
        ]
        return custom_urls + urls

    def load_haul_road_types(self, request):
        """
        AJAX view to load haul road types based on selected org.
        """

        org_id = request.GET.get("org_id")
        haul_road_types = HaulRoadType.objects.filter(org_id=org_id).values(
            "id", "name"
        )
        return JsonResponse(list(haul_road_types), safe=False)


@admin.register(HaulRoadType)
class HaulRoadTypeAdmin(admin.ModelAdmin):
    # List Config.
    list_display = (
        "name",
        "org",
    )

    list_filter = (("org", RelatedDropdownFilter),)
    list_per_page = 25
    search_fields = ("org", "name")
    ordering = ("org", "name")
