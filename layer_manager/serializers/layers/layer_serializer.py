from rest_framework import serializers

from shared.constants.enums import Status
from shared.constants.files import FileError
from shared.exception_handling import ValidationErrors
from shared.models import FileInfo
from shared.serializers import FileSerializer

from ...constants import ClampToTerrainStatus, LayerType
from ...helpers import run_batch_job
from ...models import AccessTag, Feature, Layer, LayerFile
from ...validators import access_tags_org_validator
from .layer_file_serializer import GetLayerFileInfoSerializer, GetLayerFileSerializer


class LayerSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    file_id = serializers.PrimaryKeyRelatedField(
        queryset=FileInfo.objects.all(), required=False
    )
    tiles = FileSerializer(source="tiles.file_info", read_only=True)
    files = GetLayerFileInfoSerializer(read_only=True, many=True)
    access_tags = serializers.PrimaryKeyRelatedField(
        queryset=AccessTag.objects.all(),
        pk_field=serializers.UUIDField(),
        many=True,
        default=[],
    )
    features_count = serializers.SerializerMethodField()
    properties = serializers.SerializerMethodField()

    # TODO: Change it to `mapbox_style_spec` in lazy load task RAIN-2448
    styles = serializers.JSONField(source="mapbox_style_spec")

    class Meta:
        model = Layer
        fields = (
            "id",
            "name",
            "type",
            "status",
            "files",
            "tiles",
            "file_id",
            "source_id",
            "properties",
            "access_tags",
            "area_category",
            "features_styles",
            "can_edit_features",
            "features_count",
            "created_at",
            "clamped_status",
            "styles",
        )
        read_only_fields = ("id", "created_at")

    def get_properties(self, layer: Layer):
        properties = layer.properties or {}

        if "maxZoom" in properties:
            properties["maxzoom"] = properties["maxZoom"]
        if "minZoom" in properties:
            properties["minzoom"] = properties["minZoom"]

        if layer.type == LayerType.VECTOR.value:
            properties["bounds"] = Feature.objects.get_bounds(layer.id)

        return properties

    def get_features_count(self, layer: Layer):
        return Feature.objects.get_feature_count(layer.id)

    def validate(self, data):
        access_tags = data.get("access_tags")
        logged_user = self.context["logged_user"]
        if isinstance(access_tags, list):
            # Validating if access tags and layer belongs to the same org.
            if len(access_tags) > 0:
                access_tags_org_validator(
                    access_tags, self.instance.site.project.org_id
                )

            # Only org admin can add a layer without any access tag.
            elif not logged_user.is_org_admin:
                raise serializers.ValidationError(
                    {"access_tags": ValidationErrors.ACCESS_TAG_REQUIRED.value}
                )

        return super().validate(data)

    def update(self, instance, validated_data):
        file_info_object = validated_data.pop("file_id", None)

        if file_info_object:
            layer_file = LayerFile.objects.create(
                layer=instance, file_info=file_info_object
            )

            # Run batch job for file processing.
            run_batch_job(layer_file)

        return super().update(instance, validated_data)


class RetrieveLayerSerializer(serializers.ModelSerializer):
    files = GetLayerFileSerializer(read_only=True, many=True)

    class Meta:
        model = Layer
        fields = ("id", "name", "iteration", "files")


class ClampToTerrainStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        source="clamped_status", choices=ClampToTerrainStatus.choices()
    )

    class Meta:
        model = Layer
        fields = ("status",)


class UpdateLayerFileStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Status.choices(), required=True)
    errors = serializers.ListField(
        child=serializers.ChoiceField(choices=FileError.choices()),
        allow_empty=False,
        required=False,
    )
