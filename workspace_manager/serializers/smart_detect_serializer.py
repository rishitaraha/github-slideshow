import copy

from django.core.validators import FileExtensionValidator
from rest_framework import serializers
from shapely import Polygon, wkt

from layer_manager.constants.feature_constants import FeatureType
from layer_manager.models import Layer
from layer_manager.models.feature_models import Feature
from shared.constants.enums import Status
from shared.exception_handling import ValidationErrors
from shared.validators.geometry_validators import is_multi_polygon
from workspace_manager.constants import SmartDetectType
from workspace_manager.helpers import create_smart_detect_outputs_and_layers
from workspace_manager.models import SmartDetect


class SmartDetectOutputType(serializers.DictField):
    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError("Input must be a dictionary.")
        validated_data = {}
        if "output_type" not in data or "name" not in data:
            raise serializers.ValidationError(
                "Payload must include 'output_type' and 'name'."
            )
        valid_keys = SmartDetectType.values()
        output_type = data["output_type"]
        if output_type not in valid_keys:
            raise serializers.ValidationError(
                {
                    "smart_detect_outputs": ValidationErrors.INVALID_SMART_DETECT_OUTPUT_TYPE.value
                }
            )

        validated_data["output_type"] = output_type
        validated_data["name"] = data.get("name")

        return validated_data

    def to_representation(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Output must be a dictionary.")
        representation = {
            "output_type": value.get("output_type", {}),
            "name": value.get("name", ""),
        }
        return super().to_representation(representation)


class SmartDetectSerializer(serializers.ModelSerializer):
    input_aoi_layer = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.all(), required=False, write_only=True
    )
    smart_area_wkt = serializers.CharField(required=False, write_only=True)
    smart_detect_outputs = serializers.ListField(
        child=SmartDetectOutputType(), allow_empty=False, required=True, write_only=True
    )

    def validate(self, data):
        validated_data = super().validate(data)

        smart_area_wkt = validated_data.get("smart_area_wkt")
        input_aoi_layer = validated_data.get("input_aoi_layer")

        if not smart_area_wkt and not input_aoi_layer:
            raise serializers.ValidationError(
                ValidationErrors.EITHER_LAYER_OR_SMART_AREA_SHOULD_BE_PROVIDED.value
            )

        if input_aoi_layer:
            if not Feature.objects.filter(
                layer=input_aoi_layer, type=FeatureType.POLYGON.value
            ).exists():
                raise serializers.ValidationError(
                    ValidationErrors.ONLY_POLYGON_FEATURE_ALLOWED.value
                )

        if smart_area_wkt is not None:
            try:
                geometry = wkt.loads(smart_area_wkt)
                if not isinstance(geometry, Polygon) or is_multi_polygon(
                    smart_area_wkt
                ):
                    raise serializers.ValidationError(
                        ValidationErrors.FEATURE_MUST_BE_POLYGON.value
                    )
            except Exception:
                raise serializers.ValidationError(
                    ValidationErrors.INVALID_POLYGON_WKT.value
                )

        return validated_data

    def create(self, validated_data):
        data = copy.copy(validated_data)
        data["created_by"] = self.context["created_by"]
        data["updated_by"] = self.context["created_by"]
        aoi_wkt = (
            data.get("smart_area_wkt")
            if data.get("smart_area_wkt")
            else Feature.objects.filter(
                layer=data["input_aoi_layer"],
                type=FeatureType.POLYGON.value,
            )[0].get_2d_geometry_wkt()
        )
        data.pop("input_aoi_layer", None)
        data.pop("smart_area_wkt", None)
        data.pop("smart_detect_outputs", None)
        instance = super().create(data)
        try:
            create_smart_detect_outputs_and_layers(
                validated_data=validated_data,
                smart_detect=instance,
                aoi_wkt=aoi_wkt,
            )
        except Exception as e:
            raise Exception(e)
        return instance

    class Meta:
        model = SmartDetect
        fields = (
            "id",
            "iteration",
            "input_ortho_layer",
            "input_aoi_layer",
            "smart_area_wkt",
            "smart_detect_outputs",
        )


class UploadSmartDetectShapefileSerializer(serializers.Serializer):
    layer_id = serializers.PrimaryKeyRelatedField(queryset=Layer.objects.all())
    shape_file = serializers.FileField(
        required=True,
        allow_empty_file=False,
        validators=[FileExtensionValidator(["zip"])],
    )


class SmartDetectAnalyticsStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Status.choices(), required=True)
