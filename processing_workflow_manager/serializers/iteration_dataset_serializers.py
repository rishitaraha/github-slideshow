from rest_framework import serializers

from iteration_manager.models import Iteration
from processing_workflow_manager.helpers.iteration_helpers import unsign_token
from processing_workflow_manager.models import ProcessingIterationData
from rainbow.env_variables import EnvVariable
from shared.constants import FileStatus, FileType
from shared.models import FileInfo

from ..models import ProcessingIterationData
from .gcp_image_tags_serializers import RetrieveGCPImageTagSerializerForMetashape
from .gcp_serializers import GCPSerializer
from .geotag_image_serializers import GeotagImageSerializer


class RetrieveIterationDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessingIterationData
        fields = [
            "id",
            "is_archived",
            "image_folder_path",
            "geotag_column_order",
            "are_geotags_present",
            "are_gcps_present",
            "is_gcp_tagged",
            "geotag_horizontal_crs",
            "geotag_vertical_crs",
            "gcp_horizontal_crs",
            "gcp_vertical_crs",
            "is_preparing_geotags",
            "exif_extractor_job_id",
            "rotation_angle_type",
            "number_of_images",
            "number_of_images_enabled",
            "created_at",
            "updated_at",
        ]


class IterationDatasetSerializer(serializers.ModelSerializer):
    iteration = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all().select_related("site")
    )

    class Meta:
        model = ProcessingIterationData
        fields = [
            "id",
            "iteration",
            "is_archived",
            "image_folder_path",
            "geotag_column_order",
            "are_geotags_present",
            "are_gcps_present",
            "is_gcp_tagged",
            "geotag_horizontal_crs",
            "geotag_vertical_crs",
            "gcp_horizontal_crs",
            "gcp_vertical_crs",
            "is_preparing_geotags",
            "exif_extractor_job_id",
            "rotation_angle_type",
            "number_of_images",
            "number_of_images_enabled",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        (processing_data, created,) = ProcessingIterationData.objects.get_or_create(
            iteration=validated_data.get("iteration"),
        )
        processing_data.image_folder_path = FileInfo.objects.create(
            name=processing_data.iteration.name,
            is_folder=True,
            type=FileType.IMAGES_FOLDER.value,
            bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
            s3_key=f"{processing_data.id}/Images/",
            status=FileStatus.STARTED.value,
        )
        processing_data.save()

        return {"processing_data": processing_data, "created": created}


class IterationDatasetUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessingIterationData
        fields = [
            "is_archived",
            "geotag_column_order",
            "are_geotags_present",
            "are_gcps_present",
            "is_gcp_tagged",
            "geotag_horizontal_crs",
            "geotag_vertical_crs",
            "gcp_horizontal_crs",
            "gcp_vertical_crs",
            "is_preparing_geotags",
            "exif_extractor_job_id",
            "rotation_angle_type",
            "number_of_images",
            "number_of_images_enabled",
        ]


class IterationDownloadInputDataSerializer(serializers.Serializer):
    signed_token = serializers.CharField(required=True)

    def validate(self, data):
        if decoded_token := unsign_token(data["signed_token"]):
            data["image_folder_path"] = decoded_token.get("image_folder_path")
            data["zip_filename"] = decoded_token.get("zip_filename")
        return super().validate(data)


class RetrieveIterationDataForProcessingJobSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="iteration.name")
    site = serializers.CharField(source="iteration.site")
    geotag_column_order = serializers.SerializerMethodField()
    image_path = serializers.CharField(source="image_folder_path.s3_key")
    geotags = serializers.SerializerMethodField()
    gcps = serializers.SerializerMethodField()
    gcp_image_tags = serializers.SerializerMethodField()

    def get_geotag_column_order(self, obj):
        return obj.geotag_column_order or []

    def get_geotags(self, obj):
        geotags = self.context["geotags"]
        return GeotagImageSerializer(geotags, many=True).data

    def get_gcps(self, obj):
        gcps = self.context["gcps"]
        return GCPSerializer(gcps, many=True).data

    def get_gcp_image_tags(self, obj):
        gcp_image_tags = self.context["gcp_image_tags"]
        return RetrieveGCPImageTagSerializerForMetashape(gcp_image_tags, many=True).data

    class Meta:
        model = ProcessingIterationData
        fields = [
            "id",
            "name",
            "site",
            "image_path",
            "geotag_horizontal_crs",
            "geotag_vertical_crs",
            "gcp_horizontal_crs",
            "gcp_vertical_crs",
            "rotation_angle_type",
            "geotag_column_order",
            "geotags",
            "gcps",
            "gcp_image_tags",
        ]
