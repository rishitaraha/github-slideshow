from django.db import models

from shared.models import BaseModel

from ..constants import DatasetType
from .merged_dataset_models import MergedDataset
from .processing_iteration_data_models import ProcessingIterationData
from .task_models import Task


class MergedDatasetInputDataset(BaseModel):
    # Merged dataset generated after merging all the input dataset
    output_merged_dataset = models.ForeignKey(
        MergedDataset,
        on_delete=models.CASCADE,
        db_index=True,
        related_name="input_dataset",
    )
    input_dataset_type = models.TextField(
        choices=DatasetType.choices(),
    )
    input_iteration_data = models.ForeignKey(
        ProcessingIterationData, on_delete=models.CASCADE, null=True
    )
    input_task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True)
    input_merged_dataset = models.ForeignKey(
        MergedDataset,
        on_delete=models.CASCADE,
        null=True,
    )

    # Properties
    @property
    def input_dataset_name(self) -> str:
        if self.input_dataset_type == DatasetType.ITERATION_DATASET.value:
            return self.input_iteration_data.name
        elif self.input_dataset_type == DatasetType.MERGED_DATASET.value:
            return self.input_merged_dataset.name
        elif self.input_dataset_type == DatasetType.TASK.value:
            return self.input_task.name

    @property
    def input_dataset_serial_id(self) -> str:
        if self.input_dataset_type == DatasetType.ITERATION_DATASET.value:
            return self.input_iteration_data.serial_id
        elif self.input_dataset_type == DatasetType.MERGED_DATASET.value:
            return self.input_merged_dataset.serial_id
        elif self.input_dataset_type == DatasetType.TASK.value:
            return self.input_task.serial_id

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="check_task_or_iteration_dataset_or_merged_dataset",
                check=models.Q(
                    input_dataset_type=DatasetType.ITERATION_DATASET.value,
                    input_iteration_data__isnull=False,
                )
                | models.Q(
                    input_dataset_type=DatasetType.TASK.value, input_task__isnull=False
                )
                | models.Q(
                    input_dataset_type=DatasetType.MERGED_DATASET.value,
                    input_merged_dataset__isnull=False,
                ),
            ),
        ]
