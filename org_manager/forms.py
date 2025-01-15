from django import forms

from .feature_flags import FeatureFlag
from .models import Organisation


class OrganisationForm(forms.ModelForm):
    feature_flags = forms.MultipleChoiceField(
        choices=FeatureFlag.choices(),
        widget=forms.CheckboxSelectMultiple(attrs={"class": "multiple-select"}),
        required=False,
    )

    class Meta:
        model = Organisation
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        instance = kwargs.get("instance")
        initial_values = kwargs.pop("initial", {})

        # If instance is present (indicating edit mode) we will fetch the feature flags from the db otherwise we will use the default feature flags.
        feature_flags = (
            instance.get_feature_flags() if instance else FeatureFlag.DEFAULTS
        )

        initial_values["feature_flags"] = [
            key for key, value in feature_flags.items() if value
        ]

        super().__init__(initial=initial_values, *args, **kwargs)

    def save(self, commit=True):
        org = super().save(commit=False)

        feature_flags = self.cleaned_data.pop("feature_flags", [])

        org.feature_flags = {
            flag: flag in feature_flags for flag in FeatureFlag.values()
        }

        if commit:
            org.save()
            if hasattr(self, "save_m2m"):
                self.save_m2m()
        return org
