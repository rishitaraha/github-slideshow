import json
import time
from datetime import datetime

from botocore.exceptions import ClientError
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from rest_framework.viewsets import ViewSet

from iteration_manager.permissions import HasManageDatasetPermission
from org_manager.permissions import IsFeatureFlagEnabled
from processing_workflow_manager.constants import (
    ContinuedFromDatasetType,
    ProcessingStatus,
    task_field_file_type_mapping,
)
from processing_workflow_manager.helpers import (
    TaskRecordType,
    clone_task_records,
    copy_gcp_image_tags_to_task,
    copy_geotagimage_records_to_task,
    copy_records_to_task,
    create_task_batch_job,
    gcp_field_mapping,
    generate_slack_message_for_task,
    geotag_image_field_mapping,
    get_instance_mapping_data,
    get_instance_params_and_job_details,
    send_processing_progress_details_to_redis,
    slack_notification_handler,
    trigger_mail_for_task_status_update,
    update_task_geotag_errors,
    validate_geotag_images,
)
from processing_workflow_manager.helpers.task_email_helpers import (
    trigger_mail_for_task_status_update,
)
from processing_workflow_manager.models import (
    GCP,
    GeotagImage,
    ProcessingIterationData,
    Task,
    TaskGCP,
    TaskGCPImageTag,
    TaskGeotagImage,
)
from processing_workflow_manager.permissions.task_permissions import IsApiKeyPresent
from processing_workflow_manager.serializers import (
    RetrieveTaskForProcessingJobSerializer,
    TaskDetailSerializer,
    TaskGeotagErrorSerializer,
    TaskGeotagImageAlignmentSerializer,
    TaskSerializer,
    TaskStatusUpdateSerializer,
    TaskUpdateSerializer,
)
from rainbow import logger
from shared.aws import AwsManager
from shared.constants import BatchJobStatus
from shared.models.file_models import FileInfo
from shared.serializers import BatchJobSerializer

from ..constants import ProcessingStatus


class TaskViewSet(ViewSet):
    permission_classes = [HasManageDatasetPermission, IsFeatureFlagEnabled]

    def get_permissions(self):
        if self.action == "create":
            self.permission_classes = [
                HasManageDatasetPermission,
                IsFeatureFlagEnabled,
            ]
        elif self.action == "partial_update":
            self.permission_classes = [
                (HasManageDatasetPermission & IsFeatureFlagEnabled) | IsApiKeyPresent
            ]
        elif self.action in [
            "get_data_for_processing_job",
            "update_geotag_errors",
        ]:
            self.permission_classes = [IsApiKeyPresent]

        return super().get_permissions()

    def create(self, request):
        iteration_dataset = (
            ProcessingIterationData.objects.filter(
                id=request.data.get("iteration_dataset")
            )
            .select_related("iteration", "image_folder_path", "iteration__site")
            .first()
        )
        self.check_object_permissions(
            self.request,
            iteration_dataset.iteration.site,
        )

        validate_geotag_images(iteration_dataset)
        serializer = TaskSerializer(
            data=request.data,
            context={"created_by": request.user},
        )
        serializer.is_valid(raise_exception=True)
        task: Task = serializer.save()
        options_dict = json.loads(request.data.get("options"))
        optimization_options = options_dict.get("optimization-options", {})
        is_reoptimize_task = optimization_options.get("reoptimize-cameras", False)

        if (
            task.continued_from == ContinuedFromDatasetType.TASK.value
            and not is_reoptimize_task
        ):
            continued_from_task_id = task.continued_from_task.id
            new_task_id = task.id
            clone_task_records(
                model_to_clone=TaskGeotagImage,
                original_task_id=continued_from_task_id,
                new_task_id=new_task_id,
            )
            clone_task_records(
                model_to_clone=TaskGCP,
                original_task_id=continued_from_task_id,
                new_task_id=new_task_id,
            )
        else:
            cropping_region = request.data.get("cropping_region")
            cropping_region_behaviour = serializer.data["cropping_region_behaviour"]

            copy_geotagimage_records_to_task(
                geotag_image=GeotagImage,
                task_geotag_image=TaskGeotagImage,
                task=task,
                source_dataset=iteration_dataset,
                field_mapping=geotag_image_field_mapping,
                foreign_key_field=TaskRecordType.GEOTAG_IMAGE.value,
                cropping_region=cropping_region,
                cropping_region_behaviour=cropping_region_behaviour,
            )
            copy_records_to_task(
                source_model=GCP,
                target_model=TaskGCP,
                task=task,
                source_dataset=iteration_dataset,
                field_mapping=gcp_field_mapping,
                foreign_key_field=TaskRecordType.GCP.value,
            )

        copy_gcp_image_tags_to_task(task)

        user_selected_instance = request.data.get("instance_name")
        instance_mapping_config = get_instance_mapping_data(user_selected_instance)
        (
            instance_params,
            job_definition,
            job_queue,
        ) = get_instance_params_and_job_details(
            instance_mapping_config,
            TaskGeotagImage.objects.filter(task=task, is_image_available=True).count(),
            user_selected_instance,
        )

        batch_job = create_task_batch_job(
            instance_params, job_definition, job_queue, task.id
        )
        task.batch_job_details = batch_job
        task.save()

        slack_message = generate_slack_message_for_task(task)
        slack_notification_handler(slack_message, task)
        response = {
            "data": {
                "message": "task_added_successfully",
                "task": TaskSerializer(task).data,
            },
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        task = get_object_or_404(
            Task.objects.select_related(
                "iteration_dataset__iteration",
                "iteration_dataset__iteration__site",
            ),
            id=pk,
        )
        self.check_object_permissions(
            self.request, task.iteration_dataset.iteration.site
        )
        task_details = TaskDetailSerializer(task).data
        response = {
            "message": "task_details_fetched_successfully.",
            "data": task_details,
        }
        return Response(response)

    def partial_update(self, request, pk):
        task_object = get_object_or_404(Task, id=pk)

        serializer = TaskUpdateSerializer(
            instance=task_object, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Task updated successfully.",
                    "task": serializer.data,
                },
                status=HTTP_200_OK,
            )
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

    # MCLI API
    @action(
        detail=True,
        methods=["get"],
        url_path="processing-job-data",
        url_name="processing-job-data",
    )
    @method_decorator(gzip_page)
    def get_data_for_processing_job(self, request, pk):
        task_object = get_object_or_404(
            Task.objects.select_related(
                "iteration_dataset__iteration",
                "iteration_dataset__iteration__site",
            ),
            id=pk,
        )
        geotags = TaskGeotagImage.objects.filter(task=task_object)
        gcps = TaskGCP.objects.filter(task=task_object)
        gcp_ids = gcps.values_list("id", flat=True)
        gcp_image_tags = TaskGCPImageTag.objects.filter(task_gcp__in=gcp_ids)

        serializer = RetrieveTaskForProcessingJobSerializer(
            task_object,
            context={
                "geotags": geotags,
                "gcps": gcps,
                "gcp_image_tags": gcp_image_tags,
            },
        )
        response = {
            "message": "task_fetched_successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["post"],
        url_path="update-geotag-errors",
        url_name="update-geotag-errors",
        permission_classes=[IsApiKeyPresent],
    )
    def update_geotag_errors(self, request, pk=None):
        task_object = get_object_or_404(Task, id=pk)
        serializer = TaskGeotagErrorSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            geotags_error_data = serializer.validated_data["geotags_error_data"]
            average_errors = serializer.validated_data.get("average_errors")
            execution_start_time = time.time()
            update_task_geotag_errors(task_object, geotags_error_data, average_errors)
            execution_time = time.time() - execution_start_time
            logger.info(
                {
                    "execution_time [Func] -> update_task_geotag_errors()": f"{execution_time:.3f} sec",
                }
            )
            return Response({"message": "Task geotags error saved successfully."})

    @action(
        detail=True,
        methods=["post"],
        url_path="aligned-cameras",
        url_name="aligned-cameras",
        permission_classes=[IsApiKeyPresent],
    )
    def update_aligned_cameras(self, request, pk):
        serializer = TaskGeotagImageAlignmentSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            aligned_images_id_list = serializer.data["aligned_cameras"]

            task_geotags = TaskGeotagImage.objects.filter(
                task_id=pk, id__in=aligned_images_id_list
            )
            if task_geotags.count() != len(aligned_images_id_list):
                response = {"message": "invalid_task_geotag_ids_found"}
                return Response(response, status=status.HTTP_400_BAD_REQUEST)

            task_geotags.update(is_image_aligned=True)
            response = {"message": "task_geotag_image_alignment_saved_successfully"}
            return Response(response)

    @action(
        detail=True,
        methods=["patch"],
        url_path="cancel-task",
        url_name="cancel-task",
    )
    def cancel_task(self, request, pk):
        task = get_object_or_404(Task, id=pk)
        site = task.iteration_dataset.iteration.site
        self.check_object_permissions(request, site)

        if task.status == ProcessingStatus.CANCELLED.value:
            response = {
                "message": "task_is_cancelled",
                "data": {},
            }
            return Response(response)

        send_processing_progress_details_to_redis(
            str(task.id),
            current_state=task.status,
            next_state=ProcessingStatus.CANCELLED.value,
        )
        data = {"status": ProcessingStatus.CANCELLED.value}

        task_serializer = TaskUpdateSerializer(task, data=data, partial=True)
        task_serializer.is_valid(raise_exception=True)
        task_serializer.save()

        task_batch_job = task.batch_job_details
        batch_job_update_data = {
            "status": BatchJobStatus.CANCELLED.value,
            "stopped_at": datetime.now(),
        }
        batch_job_serializer = BatchJobSerializer(
            task_batch_job, data=batch_job_update_data, partial=True
        )
        batch_job_serializer.is_valid(raise_exception=True)
        batch_job_serializer.save()
        if batch_job_id := task_batch_job.job_id:
            AwsManager.terminate_batch_job(
                job_id=batch_job_id, reason="Cancelled by user"
            )

        slack_message = generate_slack_message_for_task(task)
        slack_notification_handler(slack_message, task)

        data = {"message": "task_is_cancelled_successfully", "data": {}}
        return Response(data)

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        url_name="status",
        permission_classes=[IsApiKeyPresent],
    )
    def update_status(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        parent_dataset = task.iteration_dataset or task.merged_dataset
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        serializer = TaskStatusUpdateSerializer(
            task,
            data=request.data,
            context={"current_task_status": task.status},
        )
        serializer.is_valid(raise_exception=True)
        task: Task = serializer.save()
        task_status = task.status

        if task_status in [
            ProcessingStatus.ERROR.value,
            ProcessingStatus.COMPLETED.value,
        ]:
            trigger_mail_for_task_status_update(task)

        slack_message = generate_slack_message_for_task(task)
        slack_notification_handler(slack_message, task)

        task_details = TaskDetailSerializer(task).data
        data = {
            "message": "task_status_updated_successfully",
            "data": task_details,
        }
        return Response(data)

    @action(
        detail=True,
        methods=["get"],
        url_path="download",
        url_name="download",
    )
    def download_output(self, request, pk):
        task = get_object_or_404(
            Task.objects.select_related("iteration_dataset__iteration__site"),
            id=pk,
        )
        self.check_object_permissions(
            self.request, task.iteration_dataset.iteration.site
        )

        download_type = request.GET.get("download_type")
        logger.info(
            f"User downloading task output: {id} - {download_type}: {request.user.email}"
        )
        output_download_model_field = task_field_file_type_mapping.get(download_type)

        if not task.status == ProcessingStatus.COMPLETED.value:
            response = {
                "message": "task_is_not_completed",
            }
            return Response(response, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_info_object: FileInfo = getattr(
                task, output_download_model_field, None
            )
            presigned_url = AwsManager.get_download_signed_url(
                bucket_name=file_info_object.bucket_name,
                key=file_info_object.s3_key,
                file_name=file_info_object.name,
            )
            data = {
                "message": "presigned_url_for_task_output_fetched_successfully",
                "data": presigned_url,
            }
        except ClientError:
            return None

        return Response(data)
