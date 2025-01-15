from datetime import datetime

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from processing_workflow_manager.constants import JobType, ProcessingStatus
from processing_workflow_manager.helpers import (
    generate_slack_message_for_task,
    send_processing_progress_details_to_redis,
    slack_notification_handler,
)
from processing_workflow_manager.models import MergedDataset, Task
from processing_workflow_manager.permissions.task_permissions import IsApiKeyPresent
from shared.constants.files import BatchJobStatus

from ..serializers import ProcessingErrorStatusSerializer


class FailedProcessingStatusUpdateView(APIView):
    permission_classes = [IsApiKeyPresent]

    def patch(self, request):
        serializer = ProcessingErrorStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serialized_data = serializer.validated_data

        slack_message = ""
        job_type = serialized_data.get("job_type")
        task_id = serialized_data.get("task_id")
        merged_dataset_id = serialized_data.get("merged_dataset_id")

        success_response_data = {"message": "failed_status_updated_successfully."}
        failure_response_data = {"message": "failed_to_update_status"}

        if job_type == JobType.ProcessTask.value:
            task = get_object_or_404(Task, id=task_id)
            current_task_status = task.status
            # Error or Cancelled state means that it is already processed in TaskStatusUpdate or CancelTaskView
            if current_task_status == ProcessingStatus.ERROR.value:
                return Response(success_response_data, status=status.HTTP_200_OK)
            elif current_task_status == ProcessingStatus.CANCELLED.value:
                return Response(
                    failure_response_data, status=status.HTTP_400_BAD_REQUEST
                )
            send_processing_progress_details_to_redis(
                str(task_id),
                current_state=task.status,
                next_state=ProcessingStatus.ERROR.value,
            )

            task.status = ProcessingStatus.ERROR.value
            task.save()

            task.batch_job_details.stopped_at = datetime.now()
            task.batch_job_details.status = BatchJobStatus.FAILED.value
            task.batch_job_details.save()
            slack_message = generate_slack_message_for_task(task)
            slack_notification_handler(slack_message, task)

        elif job_type == JobType.ProcessMergedDataset.value:
            merged_dataset = get_object_or_404(MergedDataset, id=merged_dataset_id)
            current_merging_status = merged_dataset.merging_status
            # Error or Cancelled state means that it is already processed in MergedDatasetViewSet or CancelTaskView
            if current_merging_status == ProcessingStatus.ERROR.value:
                return Response(success_response_data, status=status.HTTP_200_OK)
            elif current_merging_status == ProcessingStatus.CANCELLED.value:
                return Response(
                    failure_response_data, status=status.HTTP_400_BAD_REQUEST
                )

            send_processing_progress_details_to_redis(
                str(merged_dataset_id),
                current_state=merged_dataset.merging_status,
                next_state=ProcessingStatus.ERROR.value,
            )

            merged_dataset.merging_status = ProcessingStatus.ERROR.value
            merged_dataset.save()

            # Cancel the continued after merging task post terminating the merging process.
            if task := Task.objects.filter(merged_dataset=merged_dataset).first():
                task.status = ProcessingStatus.CANCELLED.value
                task.save()
                task.batch_job_details.status = BatchJobStatus.CANCELLED.value
                task.batch_job_details.save()
            # TODO: Handle slack alert for merged dataset

        return Response(success_response_data, status=status.HTTP_200_OK)
