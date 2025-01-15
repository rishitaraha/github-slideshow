from django.contrib.gis.db import models as gismodels
from django.db import models

from shared.models import BaseModel

from ..constants import GCPType
from .geotag_image_models import GeotagImage, TaskGeotagImage
from .merged_dataset_models import MergedDataset
from .processing_iteration_data_models import ProcessingIterationData
from .task_models import Task


class GCP(BaseModel):
    label = models.TextField()
    type = models.TextField(
        choices=GCPType.choices(), default=GCPType.CONTROLPOINT.value
    )
    x_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    y_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    z_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    location_wgs84 = gismodels.PointField(dim=3, null=True)

    iteration_dataset = models.ForeignKey(
        ProcessingIterationData,
        on_delete=models.CASCADE,
        null=True,
        related_name="gcps",
    )
    merged_dataset = models.ForeignKey(
        MergedDataset, on_delete=models.CASCADE, null=True, related_name="gcps"
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(iteration_dataset__isnull=False)
                | models.Q(merged_dataset__isnull=False),
                name="iteration_or_merged_dataset_required_gcp",
            )
        ]


class TaskGCP(BaseModel):
    label = models.TextField(blank=True)
    type = models.TextField(
        default=GCPType.CONTROLPOINT.value,
        choices=GCPType.choices(),
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    x_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    y_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    z_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    location_wgs84 = gismodels.PointField(dim=3, null=True)

    # Record must still exist when source GCP is deleted.
    gcp = models.ForeignKey(GCP, null=True, on_delete=models.SET_NULL)


class GCPImageTag(BaseModel):
    gcp = models.ForeignKey(GCP, on_delete=models.CASCADE)
    geotag_image = models.ForeignKey(GeotagImage, on_delete=models.CASCADE)
    image_x = models.DecimalField(max_digits=6, decimal_places=2)
    image_y = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        unique_together = ("gcp", "geotag_image")


class TaskGCPImageTag(BaseModel):
    task_gcp = models.ForeignKey(TaskGCP, on_delete=models.CASCADE)
    task_geotag_image = models.ForeignKey(TaskGeotagImage, on_delete=models.CASCADE)
    image_x = models.DecimalField(max_digits=6, decimal_places=2)
    image_y = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task_gcp_id", "task_geotag_image_id"],
                name="unique_task_gcp_image_tags",
            )
        ]


class ApproxGCPImageTag(BaseModel):
    gcp = models.ForeignKey(GCP, on_delete=models.CASCADE)
    geotag_image = models.ForeignKey(GeotagImage, on_delete=models.CASCADE)
    image_x = models.DecimalField(max_digits=6, decimal_places=2)
    image_y = models.DecimalField(max_digits=6, decimal_places=2)
