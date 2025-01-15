from django.contrib.admin import SimpleListFilter

from .feature_flags import FeatureFlag


class FeatureFlagFilter(SimpleListFilter):
    title = "Feature Flag"
    parameter_name = "feature_flag_filter"

    def lookups(self, request, model_admin):
        return FeatureFlag.choices()

    def queryset(self, request, queryset):
        # Apply the filtering logic based on the selected option.
        if selected_feature_flag := self.value():
            return queryset.filter(
                feature_flags__contains={selected_feature_flag: True}
            )

        return queryset
