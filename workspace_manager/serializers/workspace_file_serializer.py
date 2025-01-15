from rest_framework import serializers

from layer_manager.models import LayerFile
from shared.helpers.file_info_helpers import get_or_update_cog_file_properties
from shared.models.file_models import FileInfo
from shared.serializers.batch_job_serializers import BatchJobSerializer


class SelectedIterationCapturedDsmSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileInfo
        fields = (
            "id",
            "status",
        )


class SelectedIterationCapturedDsmCogSerializer(serializers.ModelSerializer):
    batch_job = BatchJobSerializer(read_only=True)

    class Meta:
        model = FileInfo
        fields = ("id", "status", "batch_job", "created_at")


class TerrainIterationCapturedDsmSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileInfo
        fields = (
            "id",
            "status",
        )


class TerrainIterationCapturedDsmCogSerializer(serializers.ModelSerializer):
    batch_job = BatchJobSerializer(read_only=True)

    class Meta:
        model = FileInfo
        fields = ("id", "s3_key", "status", "batch_job")


class GetWorkspaceFileInfoSerializer(serializers.ModelSerializer):
    # https://www.django-rest-framework.org/api-guide/fields/#serializermethodfield
    filename = serializers.CharField(source="name")
    s3_key = serializers.CharField(source="s3_uri")
    properties = serializers.SerializerMethodField()

    def get_properties(self, file_info: FileInfo):
        return get_or_update_cog_file_properties(file_info)

    class Meta:
        model = FileInfo
        fields = (
            "filename",
            "id",
            "status",
            "type",
            "s3_key",
            "properties",
        )


class GetWorkspaceLayerFileInfoSerializer(serializers.ModelSerializer):
    file_info = GetWorkspaceFileInfoSerializer(read_only=True)

    class Meta:
        model = LayerFile
        fields = "__all__"

    def to_representation(self, instance):
        serialized_data = super().to_representation(instance)
        return serialized_data["file_info"]


class GetWorkspaceLayerFileSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="name")

    class Meta:
        model = FileInfo
        fields = (
            "id",
            "filename",
            "status",
            "properties",
        )
