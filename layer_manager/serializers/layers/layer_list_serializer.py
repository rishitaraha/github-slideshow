from rest_framework import serializers

from shared.serializers import DynamicFieldsSerializerMixin

from ...constants import FeatureType, LayerType
from ...models import Feature, Layer
from ..features import FeatureSerializer
from .layer_file_serializer import GetLayerFileInfoSerializer


class LayerListSerializer(DynamicFieldsSerializerMixin, serializers.ModelSerializer):
    status = serializers.CharField()
    tiles = serializers.SerializerMethodField()
    files = GetLayerFileInfoSerializer(read_only=True, many=True)
    features = FeatureSerializer(many=True)
    features_count = serializers.SerializerMethodField()
    properties = serializers.SerializerMethodField()

    # TODO: Change it to `mapbox_style_spec` in lazy load task RAIN-2448
    styles = serializers.JSONField(source="mapbox_style_spec")

    def get_tiles(self, layer: Layer):
        if hasattr(layer, "vector_tiles") and layer.vector_tiles:
            layer_file_info_serializer = GetLayerFileInfoSerializer(
                layer.vector_tiles[0]
            )
            return layer_file_info_serializer.data

    def get_features_count(self, layer: Layer):
        return {
            "polygons": layer.features.filter(type=FeatureType.POLYGON.value).count(),
            "lines": layer.features.filter(type=FeatureType.LINE_STRING.value).count(),
            "points": layer.features.filter(type=FeatureType.POINT.value).count(),
            "textbox": layer.features.filter(type=FeatureType.TEXT_BOX.value).count(),
        }

    def get_properties(self, layer: Layer):
        properties = layer.properties or {}

        if "maxZoom" in properties:
            properties["maxzoom"] = properties["maxZoom"]

        if "minZoom" in properties:
            properties["minzoom"] = properties["minZoom"]

        if layer.type == LayerType.VECTOR.value:
            properties["bounds"] = Feature.objects.get_bounds(layer.id)

        return properties

    class Meta:
        model = Layer
        fields = (
            "id",
            "name",
            "type",
            "status",
            "files",
            "tiles",
            "source_id",
            "properties",
            "features_count",
            "features",
            "features_styles",
            "area_category",
            "created_at",
            "styles",
            "clamped_status",
            "can_edit_features",
        )
        read_only_fields = ("id", "created_at")
