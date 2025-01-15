import copy

from django.core.validators import FileExtensionValidator
from rest_framework import serializers
from shapely import LineString, wkt

from iteration_manager.models import Iteration
from layer_manager.constants import LayerType
from layer_manager.models import Layer, LayerFile
from shared.constants import FileError, FileType, Status
from shared.exception_handling import ValidationErrors
from shared.models import FileInfo
from shared.serializers import QueryParamSerializerMixin

from ..constants import HaulRoadLayerType
from ..models import HaulRoad, HaulRoadLayer, HaulRoadType


class HaulRoadLayerInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = ("id", "name", "type", "status", "is_deleted")


class HaulRoadLayerSerializer(serializers.Serializer):
    layer = HaulRoadLayerInfoSerializer()
    type = serializers.ChoiceField(choices=HaulRoadLayerType.choices())


class HaulRoadAnalyticsDetailsSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="type.name")
    haul_road_layers = HaulRoadLayerSerializer(many=True, required=False)

    class Meta:
        model = HaulRoad
        fields = (
            "name",
            "type",
            "vehicle_width",
            "chainage_interval",
            "haul_road_layers",
        )


class HaulRoadAnalyticsListQueryParams(QueryParamSerializerMixin):
    iteration = serializers.PrimaryKeyRelatedField(queryset=Iteration.objects.all())


class HaulRoadAnalyticsSerializer(serializers.ModelSerializer):
    smart_line_wkt = serializers.CharField(required=False, write_only=True)
    edge_layer = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.filter(type=LayerType.VECTOR.value),
        required=False,
        write_only=True,
    )
    center_line_layer = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.filter(type=LayerType.VECTOR.value),
        required=False,
        write_only=True,
    )
    medians_layer = serializers.PrimaryKeyRelatedField(
        queryset=Layer.objects.filter(type=LayerType.VECTOR.value),
        required=False,
        write_only=True,
    )
    vehicle_width = serializers.FloatField(min_value=1, max_value=100)
    chainage_interval = serializers.IntegerField(min_value=1, max_value=500)

    def validate(self, data):
        validated_data = super().validate(data)

        smart_line_wkt = validated_data.get("smart_line_wkt")
        center_line_layer = validated_data.get("center_line_layer")
        edge_layer = validated_data.get("edge_layer")

        if not smart_line_wkt and not (center_line_layer or edge_layer):
            raise serializers.ValidationError(
                ValidationErrors.EITHER_LAYER_OR_SMART_LINE_SHOULD_BE_PROVIDED.value
            )

        if smart_line_wkt is not None:
            try:
                geometry = wkt.loads(smart_line_wkt)
                if not isinstance(geometry, LineString):
                    raise serializers.ValidationError(
                        ValidationErrors.FEATURE_MUST_BE_LINESTRING.value
                    )
            except Exception:
                raise serializers.ValidationError(
                    ValidationErrors.INVALID_LINE_WKT.value
                )

        return validated_data

    def create(self, validated_data):
        data = copy.copy(validated_data)
        data["created_by"] = self.context["created_by"]
        data["updated_by"] = self.context["created_by"]
        data.pop("smart_line_wkt", None)
        data.pop("center_line_layer", None)
        data.pop("edge_layer", None)
        data.pop("medians_layer", None)

        iteration = data["iteration"]

        haul_road = HaulRoad.objects.create(**data)

        layer_configs = [
            {
                "name": f"Center Line - {haul_road.name}",
                "haul_road_layer_type": HaulRoadLayerType.CENTER_LINE.value,
            },
            {
                "name": f"Edges - {haul_road.name}",
                "haul_road_layer_type": HaulRoadLayerType.EDGES.value,
            },
            {
                "name": f"Gradient Analysis - {haul_road.name}",
                "haul_road_layer_type": HaulRoadLayerType.GRADIENT_ANALYSIS.value,
            },
            {
                "name": f"Width Analysis - {haul_road.name}",
                "haul_road_layer_type": HaulRoadLayerType.WIDTH_ANALYSIS.value,
            },
            {
                "name": f"Median - {haul_road.name}",
                "haul_road_layer_type": HaulRoadLayerType.MEDIANS.value,
            },
        ]

        for config in layer_configs:
            layer = Layer.objects.create(
                name=config["name"],
                iteration=iteration,
                type=LayerType.VECTOR.value,
                site=iteration.site,
            )

            fileInfo = FileInfo.objects.create(
                status=Status.PROCESSING.value, type=FileType.TEMPORARY.value
            )

            LayerFile.objects.create(layer=layer, file_info=fileInfo)

            HaulRoadLayer.objects.create(
                haul_road=haul_road,
                layer=layer,
                type=config["haul_road_layer_type"],
            )

        return haul_road

    class Meta:
        model = HaulRoad
        fields = (
            "id",
            "name",
            "type",
            "vehicle_width",
            "chainage_interval",
            "iteration",
            "smart_line_wkt",
            "edge_layer",
            "center_line_layer",
            "medians_layer",
        )


class UploadShapefileSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=HaulRoadLayerType.choices())
    shape_file = serializers.FileField(
        required=True,
        allow_empty_file=False,
        validators=[FileExtensionValidator(["zip"])],
    )


class HaulRoadAnalyticsStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Status.choices(), required=True)


class HaulRoadAnalyticsLayerStatusSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=HaulRoadLayerType.choices())
    status = serializers.ChoiceField(choices=Status.choices(), required=True)
    errors = serializers.ListField(
        child=serializers.ChoiceField(choices=FileError.choices()),
        allow_empty=False,
        required=False,
    )


class HaulRoadTypesSerializer(serializers.ModelSerializer):
    class Meta:
        model = HaulRoadType
        fields = ["id", "name"]
