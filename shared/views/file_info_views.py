from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from iteration_manager.models import Iteration
from iteration_manager.permissions import can_view_iterations_or_403
from layer_manager.models import Layer
from org_manager.feature_flags import FeatureFlag
from org_manager.permissions import is_feature_flag_enabled
from org_manager.validators import validate_org_ownership
from rainbow import logger
from shared.constants import FileType
from shared.constants.files import FileStatus
from shared.exception_handling import ApiErrors
from shared.helpers import (
    complete_multipart_upload,
    create_s3_file_key,
    does_file_exist_in_s3,
    get_cog_metadata,
    get_download_url,
    get_object_or_none,
    get_object_with_uuid,
    get_presigned_url,
    start_uploading_file,
)
from shared.models import FileInfo
from shared.permissions import HasDeleteFileInfoPermission, HasDownloadFilePermission
from shared.serializers import (
    CreateFileInfoSerializer,
    FilePropertiesSerializer,
    FileSerializer,
    FileUploadCompleteSerializer,
    FileUploadSerializer,
    GetFileInfoSerializer,
    GetPresignedUrlSerializer,
    UpdateBatchJobStatusSerializer,
    UpdateFileStatusSerializer,
)

# FIXME: Find a better way to validate ownership for the occurenences in files.


class FileInfoViewSet(viewsets.ViewSet):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "destroy":
            self.permission_classes = [HasDeleteFileInfoPermission]
        elif self.action == "download_file":
            self.permission_classes = [HasDownloadFilePermission]
        return super().get_permissions()

    def get_object(self, pk=None) -> FileInfo:
        file_info: FileInfo = get_object_with_uuid(FileInfo, id=pk)
        self.check_object_permissions(self.request, file_info)
        return file_info

    def create(self, request):
        data = request.data
        serializer = CreateFileInfoSerializer(data=data, context={"user": request.user})
        if serializer.initial_data["filetype"] == FileType.MBTiles.value:
            is_feature_flag_enabled(self.request.user.org, FeatureFlag.MBTILES)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "File created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        """
        Endpoint allows user to delete a file.
        If the file is attached to a layer, all the files attached to that layer will be deleted.
        """
        file_info = self.get_object(pk)

        if file_info.type in FileType.USER_DELETABLE_FILE_TYPES and hasattr(
            file_info, "layerfile"
        ):
            layer: Layer = file_info.layerfile.layer

            all_layer_files = layer.layer_files.all()

            FileInfo.objects.filter(
                id__in=all_layer_files.values_list("file_info", flat=True)
            ).delete()
            all_layer_files.delete()
        else:
            file_info.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="upload-file")
    def upload_file(self, request, pk=None):
        file_info = self.get_object(pk)
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        filetype = serializer.data.get("filetype")

        key = create_s3_file_key(filetype, str(file_info.id) + file_info.extension)

        upload_id = None

        # If the file type is "mbtiles" start uploading the file otherwise
        # raise an exception that the Media type is not supported.
        if filetype == FileType.MBTiles.value:
            is_feature_flag_enabled(request.user.org, FeatureFlag.MBTILES)

        _, upload_id = start_uploading_file(
            key=key,
            filename=file_info.name,
            filetype=filetype,
            file_info=file_info,
            create_file_info=False,
        )

        response = {
            "message": f"{filetype} upload_id generated for {file_info.name}",
            "data": {
                "file_info": file_info.id,
                "upload_id": upload_id,
            },
        }
        return Response(response)

    @action(detail=True, methods=["get"], url_path="download-file")
    def download_file(self, request, pk=None):
        # HACK: Remove after fixing RAIN-4359.
        file_info = get_object_with_uuid(FileInfo.all_objects, id=pk)
        self.check_object_permissions(self.request, file_info)

        download_url = None
        if (
            does_file_exist_in_s3(file_info)
            and file_info.status == FileStatus.DONE.value
        ):
            download_url = get_download_url(file_info)

        logger.info(
            f"Download Tracking completed for file id {file_info.id} by user {request.user.id}"
        )
        response = {
            "message": f"File Downloaded for file id {file_info.id}",
            "data": {"download_url": download_url},
        }

        return Response(response, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="presigned-url")
    def presigned_url(self, request, pk=None):
        file_info = self.get_object(pk)
        serializer = GetPresignedUrlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        part_number = serializer.data.get("part_number")
        filetype = serializer.data.get("filetype")
        signed_url = None

        if filetype == FileType.MBTiles.value:
            is_feature_flag_enabled(request.user.org, FeatureFlag.MBTILES)

        signed_url = get_presigned_url(
            file_info.bucket_name, file_info.s3_key, upload_id, part_number
        )

        response = {
            "message": "Presigned url generated for " + file_info.name,
            "data": {"file_info": file_info.id, "url": signed_url},
        }
        return Response(response)

    @action(detail=True, methods=["post"], url_path="complete-upload")
    def complete_upload(self, request, pk=None):
        file_info = self.get_object(pk)
        serializer = FileUploadCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        parts = serializer.data.get("parts")
        filetype = serializer.data.get("filetype")
        uploaded = False

        if filetype == FileType.MBTiles.value:
            is_feature_flag_enabled(request.user.org, FeatureFlag.MBTILES)

        uploaded = complete_multipart_upload(file_info, parts, upload_id)

        get_file_info_serializer = GetFileInfoSerializer(file_info)

        response = {
            "success": uploaded,
            "message": "file upload " + ("completed" if uploaded else "failed"),
            "data": {"file_info": get_file_info_serializer.data},
        }
        return Response(
            response,
            status=status.HTTP_200_OK if uploaded else status.HTTP_406_NOT_ACCEPTABLE,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="batch-job-status",
        permission_classes=[AllowAny],
        serializer_class=UpdateBatchJobStatusSerializer,
    )
    def batch_job_status(self, request, pk=None):
        file_info: FileInfo = self.get_object(pk)

        serializer = self.serializer_class(
            file_info.batch_job, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": f"{file_info.name} batch job status updated",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[AllowAny],
        serializer_class=UpdateFileStatusSerializer,
    )
    def status(self, request, pk=None):
        file_info: FileInfo = self.get_object(pk)

        serializer = self.serializer_class(file_info, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": f"{file_info.name} status updated",
            "data": serializer.data,
        }
        return Response(response)

    # TODO: Remove after DSM as a layer.
    @action(
        detail=True,
        methods=["get", "patch"],
        url_path="properties",
        permission_classes=[AllowAny],
    )
    def properties(self, request, pk=None):
        file_info = get_object_with_uuid(FileInfo, pk)
        do_update = False
        properties = request.data
        message = f"{file_info.type} properties fetched successfully."

        is_captured_dsm_file = file_info.type in [
            FileType.CAPTURED_DSM.value,
            FileType.CAPTURED_DSM_COG.value,
        ]
        have_properties = file_info.properties is not None
        have_elevation_range_values_in_properties = have_properties and (
            (
                hasattr(file_info.properties, "min_elevation")
                and hasattr(file_info.properties, "max_elevation")
            )
            or hasattr(file_info.properties, "statistics")
        )

        if request.method == "GET":
            if not request.user.is_authenticated:
                raise NotAuthenticated()

            if iteration_id := request.GET.get("iteration_id"):
                iteration: Iteration = get_object_or_none(Iteration, id=iteration_id)
            else:
                raise ValidationError(ApiErrors.ITERATION_ID_NOT_FOUND.value)

            validate_org_ownership(request, iteration, True)
            can_view_iterations_or_403(request.user, iteration.site)

            if is_captured_dsm_file and not have_elevation_range_values_in_properties:
                do_update = True
                properties = {"properties": get_cog_metadata(file_info.s3_uri)}
            else:
                properties = {"properties": file_info.properties}
        else:
            do_update = True
            message = f"{file_info.type} properties updated successfully."

        if do_update and properties:
            serializer = FilePropertiesSerializer(file_info, data=properties)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        else:
            serializer = FilePropertiesSerializer(file_info)

        response = {
            "message": message,
            "data": {
                "properties": serializer.data["properties"],
            },
        }
        return Response(response)
