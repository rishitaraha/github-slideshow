from rest_framework import serializers

from processing_workflow_manager.constants import (
    JobType,
    ProcessingBatchJobEnvironmentVariable,
)
from shared.exception_handling import ValidationErrors

from ..models import MergedDataset, ProcessingIterationData


class CoordinateValuesNormalized(serializers.DecimalField):
    def to_representation(self, value):
        return value.normalize()


class DatasetQueryParamSerializer(serializers.Serializer):
    iteration_dataset = serializers.PrimaryKeyRelatedField(
        queryset=ProcessingIterationData.objects.all().select_related(
            "iteration", "image_folder_path", "iteration__site"
        ),
        required=False,
    )
    merged_dataset = serializers.PrimaryKeyRelatedField(
        queryset=MergedDataset.objects.all().select_related("site"),
        required=False,
    )

    def validate(self, data):
        if not data.get("iteration_dataset") and not data.get("merged_dataset"):
            raise serializers.ValidationError(
                ValidationErrors.PARENT_DATASET_ID_REQUIRED.value
            )

        return super().validate(data)


class ProcessingErrorStatusSerializer(serializers.Serializer):
    environment = serializers.JSONField(required=True)
    job_type = serializers.ChoiceField(choices=JobType.choices(), required=False)
    task_id = serializers.UUIDField(required=False)
    merged_dataset_id = serializers.UUIDField(required=False)

    def validate(self, data):
        environment = data.get("environment")
        job_type = None
        task_id = None
        merged_dataset_id = None
        for env_data in environment:
            if env_data["name"] == ProcessingBatchJobEnvironmentVariable.JobType.value:
                job_type = env_data["value"]
            elif (
                env_data["name"]
                == ProcessingBatchJobEnvironmentVariable.MergedDatasetId.value
            ):
                merged_dataset_id = env_data["value"]
            elif env_data["name"] == ProcessingBatchJobEnvironmentVariable.TaskID.value:
                task_id = env_data["value"]

        if job_type == JobType.ProcessTask.value and not task_id:
            raise serializers.ValidationError(
                ValidationErrors.PARENT_DATASET_ID_REQUIRED.value
            )
        elif job_type == JobType.ProcessMergedDataset.value and not merged_dataset_id:
            raise serializers.ValidationError(
                ValidationErrors.PARENT_DATASET_ID_REQUIRED.value
            )

        data["job_type"] = job_type
        data["task_id"] = task_id
        data["merged_dataset_id"] = merged_dataset_id

        return super().validate(data)
