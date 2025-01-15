from uuid import UUID

from django import forms

from layer_manager.models import Layer
from site_manager.models import Site

from .models import Iteration


class IterationForm(forms.ModelForm):
    class Meta:
        model = Iteration
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If the instance has attribute site (indicating edit mode), filter the sites so that admin can't move the iteration to different project's site.
        if hasattr(self.instance, "site"):
            site_field = self.fields["site"]
            site_field.queryset = site_field.queryset.filter(
                project=self.instance.site.project
            )

    def save(self, commit: bool):
        iteration: Iteration = super().save(commit)

        initial_site: UUID = self.initial.pop("site")
        cleaned_site: Site = self.cleaned_data.pop("site")

        # Update the site of all layers present in the iteration if the site of the iteration changes.
        if initial_site != cleaned_site.id:
            layers = Layer.objects.filter(iteration=iteration)
            layers.update(site=cleaned_site)

        return iteration
