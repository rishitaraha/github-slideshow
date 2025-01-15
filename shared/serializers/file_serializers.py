from rest_framework import serializers

from shared.exception_handling import ValidationErrors

from ..constants import FileStatus, FileType
from ..helpers import (
    does_file_exist_in_s3,
    get_download_url,
    get_file_size,
    get_or_update_cog_file_properties,
)
from ..models import FileInfo
from .batch_job_serializers import BatchJobSerializer


class FileUploadSerializer(serializers.Serializer):
    filename = serializers.CharField()
    filetype = serializers.ChoiceField(choices=FileType.uploadable_choices())

    def validate(self, data):
        filetype = data.get("filetype")
        filename = data.get("filename")
        file_extension = filename.split(".")[-1].lower()

        validation_errors = {}
        if filetype == FileType.CAPTURED_DSM.value and file_extension not in [
            "tif",
            "tiff",
        ]:
            validation_errors[
                "filename"
            ] = ValidationErrors.INVALID_CAPTURED_DSM_FILE.value

        elif filetype == FileType.ORTHOMOSAIC.value and file_extension not in [
            "tif",
            "tiff",
        ]:
            validation_errors[
                "filename"
            ] = ValidationErrors.INVALID_ORTHOMOSAIC_FILE.value

        elif filetype == FileType.MBTiles.value and not file_extension == "mbtiles":
            validation_errors["filename"] = ValidationErrors.INVALID_MBTILES_FILE.value

        elif filetype == FileType.BASE_DSM.value and file_extension not in [
            "tif",
            "tiff",
        ]:
            validation_errors["filename"] = ValidationErrors.INVALID_BASE_DSM_FILE.value

        elif filetype == FileType.LEGEND_IMAGE.value and file_extension not in [
            "jpeg",
            "jpg",
            "png",
        ]:
            validation_errors[
                "filename"
            ] = ValidationErrors.INVALID_LEGEND_IMAGE_FILE.value

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return super().validate(data)


class GetPresignedUrlSerializer(serializers.Serializer):
    upload_id = serializers.CharField()
    part_number = serializers.IntegerField()
    filetype = serializers.ChoiceField(choices=FileType.uploadable_choices())


class FileUploadCompleteSerializer(serializers.Serializer):
    upload_id = serializers.CharField()
    parts = serializers.ListField()
    filetype = serializers.ChoiceField(choices=FileType.uploadable_choices())


class GetFileInfoSerializer(serializers.ModelSerializer):
    # https://www.django-rest-framework.org/api-guide/fields/#serializermethodfield
    filename = serializers.CharField(source="name")
    size = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    s3_key = serializers.CharField(source="s3_uri")
    properties = serializers.SerializerMethodField()
    errors = serializers.ListField(source="error_messages")

    def get_size(self, file_info: FileInfo):
        if (
            does_file_exist_in_s3(file_info)
            and file_info.status == FileStatus.DONE.value
        ):
            return get_file_size(file_info)

    def get_download_url(self, file_info: FileInfo):
        if (
            does_file_exist_in_s3(file_info)
            and file_info.status == FileStatus.DONE.value
        ):
            return get_download_url(file_info)

    def get_properties(self, file_info: FileInfo):
        return get_or_update_cog_file_properties(file_info)

    class Meta:
        model = FileInfo
        fields = (
            "id",
            "filename",
            "status",
            "type",
            "size",
            "s3_key",
            "properties",
            "extension",
            "download_url",
            "errors",
        )
        read_only_fields = ("id", "extension")


class FileSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="name")
    s3_key = serializers.CharField(source="s3_uri")
    batch_job = BatchJobSerializer(read_only=True)

    class Meta:
        model = FileInfo
        fields = (
            "id",
            "filename",
            "type",
            "s3_key",
            "status",
            "batch_job",
            "created_at",
            "properties",
        )


class CreateFileInfoSerializer(serializers.ModelSerializer):
    filename = serializers.CharField(source="name")
    filetype = serializers.CharField(source="type")

    def validate(self, data):
        user = self.context["user"]

        validation_errors = {}

        if data["type"] in FileType.GENERATABLE_FILE_TYPES:
            validation_errors["type"] = ValidationErrors.INVALID_FILE_TYPE.value

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        data["created_by"] = user
        data["org"] = user.org

        return super().validate(data)

    class Meta:
        model = FileInfo
        fields = ("id", "filename", "filetype")


class UpdateFileStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=FileStatus.choices())

    class Meta:
        model = FileInfo
        fields = ("status",)


class FilePropertiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileInfo
        fields = ("properties",)
