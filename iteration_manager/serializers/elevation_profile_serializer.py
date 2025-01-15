from rest_framework import serializers

from layer_manager.constants import FeatureType
from layer_manager.models import Feature
from shared.exception_handling import ValidationErrors
from shared.serializers import QueryParamSerializerMixin


class ElevationProfileSerializer(serializers.Serializer):
    iterations = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    line_wkt = serializers.CharField(required=False)
    feature = serializers.PrimaryKeyRelatedField(
        queryset=Feature.objects.all(), required=False
    )

    def validate(self, data):
        validated_data = super().validate(data)

        feature: Feature | None = validated_data.get("feature")
        line_wkt = validated_data.get("line_wkt")

        if feature is not None:
            if feature.type != FeatureType.LINE_STRING.value:
                raise serializers.ValidationError(
                    {"feature": ValidationErrors.FEATURE_MUST_BE_LINESTRING.value}
                )

            validated_data["line_wkt"] = feature.get_2d_geometry_wkt()

        elif line_wkt is None:
            raise serializers.ValidationError(
                ValidationErrors.EITHER_LINE_WKT_OR_FEATURE_REQUIRED.value
            )

        return validated_data


class DownloadElevationProfileQueryParamSerializer(
    QueryParamSerializerMixin, ElevationProfileSerializer
):
    pass
