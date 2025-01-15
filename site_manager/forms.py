from django import forms

from .models import Site


class SiteForm(forms.ModelForm):
    class Meta:
        model = Site
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If the instance has attribute project (indicating edit mode), filter the projects so that admin can't move the site to different org's project.
        if hasattr(self.instance, "project"):
            project_field = self.fields["project"]
            project_field.queryset = project_field.queryset.filter(
                org=self.instance.project.org
            )
