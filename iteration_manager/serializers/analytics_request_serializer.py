from rest_framework import serializers

from shared.exception_handling import ValidationErrors
from shared.validators import is_polygon

from ..constants import SelectedOutputs


class GenerateAnalyticsSerializer(serializers.Serializer):
    selected_outputs = serializers.MultipleChoiceField(
        choices=SelectedOutputs.choices()
    )
    polygon_wkt = serializers.CharField()

    def validate(self, data):
        data = super().validate(data)
        polygon_wkt = data.get("polygon_wkt")

        if not is_polygon(polygon_wkt):
            raise serializers.ValidationError(
                ValidationErrors.INVALID_POLYGON_WKT.value
            )

        return data

    class Meta:
        fields = ("selected_outputs", "polygon_wkt")
