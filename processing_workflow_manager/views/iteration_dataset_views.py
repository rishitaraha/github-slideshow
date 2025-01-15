from django.db.models import CharField, Prefetch
from django.db.models.functions import Cast
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from stream_zip import async_stream_zip

from iteration_manager.permissions import HasManageDatasetPermission
from org_manager.permissions import IsFeatureFlagEnabled
from processing_workflow_manager.helpers import generate_signed_token, unzipped_files
from processing_workflow_manager.models import Task
from rainbow import logger
from rainbow.env_variables import EnvVariable
from shared.aws import AwsManager
from shared.exception_handling import ApiErrors, S3DownloadException

from ..models import GCP, GCPImageTag, GeotagImage, ProcessingIterationData
from ..serializers import (
    IterationDatasetSerializer,
    IterationDatasetUpdateSerializer,
    IterationDownloadInputDataSerializer,
    RetrieveIterationDataForProcessingJobSerializer,
    TaskDetailSerializer,
)


class IterationDatasetViewSet(ViewSet):
    serializer_class = IterationDatasetSerializer
    permission_classes = [IsFeatureFlagEnabled, HasManageDatasetPermission]

    def get_object(self, id):
        iteration_dataset = (
            ProcessingIterationData.objects.filter(id=id)
            .select_related("iteration")
            .first()
        )
        return iteration_dataset

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.check_object_permissions(
            self.request, serializer.validated_data["iteration"].site
        )
        serializer_data = serializer.save()

        processing_data_created = serializer_data["created"]
        processing_data = self.serializer_class(serializer_data["processing_data"]).data

        response_message = (
            "Created Processing Iteration Data"
            if processing_data_created
            else "Processing Iteration Data already exists"
        )
        status_code = (
            status.HTTP_201_CREATED
            if processing_data_created
            else status.HTTP_208_ALREADY_REPORTED
        )

        response = {
            "message": response_message,
            "data": {
                "processing_data": processing_data,
            },
        }

        return Response(
            response,
            status=status_code,
        )

    def retrieve(self, request, pk):
        iteration_dataset = get_object_or_404(
            ProcessingIterationData.objects.prefetch_related(
                Prefetch(
                    "tasks",
                    queryset=Task.objects.prefetch_related(
                        "output_folder_path",
                        "output_project_file_info",
                        "output_dense_point_cloud_file_info",
                        "output_dem",
                        "output_dem_cog",
                        "output_ortho",
                        "output_ortho_cog",
                        "output_ortho_tile_zip",
                        "output_report",
                        "output_all_assets_zip",
                        "continued_from_task",
                    ),
                )
            ),
            id=pk,
        )
        self.check_object_permissions(request, iteration_dataset.iteration.site)
        serializer = self.serializer_class(iteration_dataset)
        task_list = iteration_dataset.tasks
        task_details = TaskDetailSerializer(task_list, many=True).data
        iteration_data = {**serializer.data, "tasks": task_details}
        response = {
            "message": "iteration_dataset_details_fetched_successfully",
            "data": iteration_data,
        }

        return Response(
            response,
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, pk):
        iteration_dataset = self.get_object(id=pk)
        self.check_object_permissions(self.request, iteration_dataset.iteration.site)
        request_data = request.data

        update_serializer = IterationDatasetUpdateSerializer(
            iteration_dataset,
            data=request_data,
            partial=True,
        )

        update_serializer.is_valid()
        updated_iteration_dataset = update_serializer.save()

        updated_iteration_dataset_details = IterationDatasetSerializer(
            updated_iteration_dataset
        ).data

        response = {
            "message": "iteration_dataset_updated_successfully",
            "data": {"iteration_dataset": updated_iteration_dataset_details},
        }
        return Response(response)

    @action(detail=True, url_path="signed-token", url_name="signed-token")
    def signed_token(self, request, pk):
        iteration_dataset = self.get_object(id=pk)
        self.check_object_permissions(request, iteration_dataset.iteration.site)
        image_folder_path = iteration_dataset.image_folder_path.s3_key
        zip_filename = f"{iteration_dataset.iteration.name}-input"
        signed_token = generate_signed_token(image_folder_path, zip_filename)
        response = {
            "data": {"signed_token": signed_token},
        }
        return Response(response)

    @action(
        detail=True,
        url_path="input-data",
        url_name="input-data",
        methods=["get"],
        permission_classes=[AllowAny],
    )
    def download(self, request, pk):
        request_data = request.GET
        serializer = IterationDownloadInputDataSerializer(
            data=request_data,
        )
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        image_folder_path = validated_data["image_folder_path"]
        zip_filename = validated_data["zip_filename"]
        try:
            key_list = []
            s3_objects = AwsManager.get_objects_in_s3_folder(
                bucket=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                prefix=image_folder_path,
            )
            for obj in s3_objects:
                key_list.append(obj["Key"])

            zipped_chunks = async_stream_zip(
                unzipped_files(key_list, AwsManager.s3_resource)
            )

            response = StreamingHttpResponse(
                streaming_content=zipped_chunks, content_type="application/zip"
            )
            response["Content-Disposition"] = 'attachment; filename="{0}"'.format(
                zip_filename + ".zip"
            )
            return response

        except Exception as e:
            logger.exception(e)
            raise S3DownloadException(
                ApiErrors.DOWNLOAD_FAILED.value,
            )

    # MCLI API
    # Check the MCLI box when there is a change made in this method
    @action(
        detail=True,
        methods=["get"],
        url_path="processing-job-data",
        url_name="processing-job-data",
    )
    @method_decorator(gzip_page)
    def get_data_for_processing_job(self, request, pk):
        iteration_dataset = get_object_or_404(ProcessingIterationData, id=pk)
        geotags = GeotagImage.objects.filter(iteration_dataset=iteration_dataset)
        gcps = GCP.objects.filter(iteration_dataset=iteration_dataset)
        gcp_ids = gcps.values_list("id", flat=True)
        gcp_image_tags = GCPImageTag.objects.filter(gcp__in=gcp_ids).annotate(
            gcp_label=Cast("gcp__label", CharField()),
            gcp_type=Cast("gcp__type", CharField()),
            geotag_image_filename=Cast("geotag_image__filename", CharField()),
        )

        serializer = RetrieveIterationDataForProcessingJobSerializer(
            iteration_dataset,
            context={
                "geotags": geotags,
                "gcps": gcps,
                "gcp_image_tags": gcp_image_tags,
            },
        )
        response = {
            "message": "iteration_fetched_successfully",
            "data": serializer.data,
        }
        return Response(response)
