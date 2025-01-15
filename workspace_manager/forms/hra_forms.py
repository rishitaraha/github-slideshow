from django import forms
from django.utils.safestring import mark_safe

from shared.validators import is_number

from ..helpers import calculate_haul_road_risk_range
from ..models import HaulRoadRiskAnalysisSettings


class HaulRoadRiskAnalysisSettingsForm(forms.ModelForm):
    min_range = forms.CharField(
        help_text=mark_safe(
            "Enter a minimum risk value or formula. Use <strong>{vehicle_width}</strong> to represent vehicle width. For example: <strong>{vehicle_width} + 5</strong>."
        ),
        widget=forms.Textarea(attrs={"rows": 1, "cols": 25}),
    )
    max_range = forms.CharField(
        help_text=mark_safe(
            "Enter a maximum risk value or formula. Use <strong>{vehicle_width}</strong> to represent vehicle width. For example: <strong>{vehicle_width} * 2 + 5</strong>."
        ),
        widget=forms.Textarea(attrs={"rows": 1, "cols": 25}),
    )
    risk_category = forms.CharField()

    def clean(self):
        cleaned_data = super().clean()

        haul_road_type = cleaned_data.get("haul_road_type")
        org = cleaned_data.get("org")

        if haul_road_type and haul_road_type.org != org:
            self.add_error(
                "haul_road_type", f"Select a haul road type from {org.name} org"
            )

        min_range = cleaned_data.get("min_range")
        if not is_number(min_range):
            # Executing the formula to check if it is correct or not.
            try:
                calculate_haul_road_risk_range(min_range, 2)
            except:
                self.add_error(
                    "min_range",
                    "The formula you entered seems incorrect. Please check and try again",
                )

        max_range = cleaned_data.get("max_range")
        if not is_number(max_range):
            # Executing the formula to check if it is correct or not.
            try:
                calculate_haul_road_risk_range(max_range, 2)
            except:
                self.add_error(
                    "max_range",
                    "The formula you entered seems incorrect. Please check and try again",
                )

        return cleaned_data

    class Meta:
        model = HaulRoadRiskAnalysisSettings
        fields = "__all__"

        widgets = {
            "haul_road_type": forms.Select(attrs={"id": "id_haul_road_type"}),
            "org": forms.Select(attrs={"id": "id_org"}),
            "color": forms.TextInput(attrs={"type": "color"}),
        }
