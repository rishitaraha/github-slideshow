from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from shared.constants.files import FileStatus, FileType
from shared.exception_handling import ValidationErrors
from shared.models import FileInfo
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from ...constants import LayerType
from ...helpers import run_batch_job
from ...models import Layer, LayerFile
from ...validators import access_tags_org_validator
from .layer_file_serializer import GetLayerFileSerializer


class CreateLayerSerializer(serializers.ModelSerializer):
    features_file = serializers.FileField(
        required=False,
        default=None,
        validators=[FileExtensionValidator(["zip"])],
    )
    file_id = serializers.PrimaryKeyRelatedField(
        queryset=FileInfo.objects.all(), required=False
    )
    files = GetLayerFileSerializer(read_only=True, many=True)
    clamp_to_terrain = serializers.BooleanField(required=False)

    class Meta:
        model = Layer
        fields = (
            "id",
            "name",
            "type",
            "iteration",
            "site",
            "files",
            "file_id",
            "source_id",
            "access_tags",
            "area_category",
            "features_file",
            "features_styles",
            "properties",
            "clamp_to_terrain",
        )
        read_only_fields = ("id", "files")
        write_only_fields = ("features_file", "file_id")

    def validate(self, data):
        data = super().validate(data)
        access_tags = data.get("access_tags")
        site = data.get("site")
        logged_user = self.context["logged_user"]
        iteration = data.get("iteration")
        access_type = SitePermission.objects.get_access_type(
            logged_user, iteration.site
        )
        file_info = data.get("file_id")
        type = data.get("type")
        validation_errors = {}

        if access_tags:
            # Validating if access tags and layer belongs to the same org.
            access_tags_org_validator(access_tags, site.project.org_id)

        # Only org admin can add a layer without any access tag.
        elif access_type != AccessType.BASIC.value and not logged_user.is_org_admin:
            validation_errors[
                "access_tags"
            ] = ValidationErrors.ACCESS_TAG_REQUIRED.value

        # MB tiles and Orthomosaic files are using multipart upload hence the file upload status needs to be validated.
        if type in [LayerType.MBTILES.value, LayerType.ORTHOMOSAIC.value]:
            if not file_info:
                validation_errors["file_id"] = ValidationErrors.FILE_ID_REQUIRED.value

            if file_info.status != FileStatus.DONE.value:
                validation_errors[
                    "file_id"
                ] = ValidationErrors.FILE_IS_NOT_UPLOADED.value

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return data

    def create(self, validated_data):
        data = validated_data.copy()
        features_file = data.pop("features_file", None)
        file_id = data.pop("file_id", None)
        data.pop("clamp_to_terrain", None)

        layer_created: Layer = super().create(data)

        if file_id:
            layer_file = LayerFile.objects.create(
                layer=layer_created, file_info=file_id
            )

            # Run batch job for file processing.
            run_batch_job(layer_file)

        if features_file and layer_created.type == LayerType.VECTOR.value:
            file_info = FileInfo.objects.create(
                status=FileStatus.PROCESSING.value, type=FileType.TEMPORARY.value
            )

            LayerFile.objects.create(layer=layer_created, file_info=file_info)

        return layer_created
