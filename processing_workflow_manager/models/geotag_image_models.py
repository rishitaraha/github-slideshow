from django.contrib.gis.db import models as gismodels
from django.db import models
from django_softdelete.models import DeletedManager, SoftDeleteModel

from shared.models import BaseModel

from ..constants import ImageOrientationTypeSlug
from ..managers import GeotagImageModelManager
from .merged_dataset_models import MergedDataset
from .processing_iteration_data_models import ProcessingIterationData
from .task_models import Task


class GeotagImage(BaseModel, SoftDeleteModel):
    iteration_dataset = models.ForeignKey(
        ProcessingIterationData,
        on_delete=models.CASCADE,
        db_index=True,
        null=True,
        related_name="geotagimages",
    )
    merged_dataset = models.ForeignKey(
        MergedDataset,
        on_delete=models.CASCADE,
        db_index=True,
        null=True,
        related_name="geotagimages",
    )

    location_wgs84 = gismodels.PointField(dim=3, null=True)
    x_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    y_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    z_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)

    filename = models.TextField()
    is_image_available = models.BooleanField(default=False)
    is_geotag_disabled = models.BooleanField(default=False)
    is_image_disabled = models.BooleanField(default=False)

    x_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    y_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    horizontal_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    vertical_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    omega = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    omega_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    phi = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    phi_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    kappa = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    kappa_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    yaw = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    yaw_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    pitch = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    pitch_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    roll = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    roll_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )

    image_orientation = models.TextField(
        choices=ImageOrientationTypeSlug.choices(), null=True, default=None
    )

    # Managers.
    objects = GeotagImageModelManager()
    deleted_objects = DeletedManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "iteration_dataset_id",
                    "merged_dataset_id",
                    "filename",
                ],
                name="unique_geotag",
            ),
            models.CheckConstraint(
                check=models.Q(iteration_dataset__isnull=False)
                | models.Q(merged_dataset__isnull=False),
                name="iteration_or_merged_dataset_required_geotag_image",
            ),
        ]


class TaskGeotagImage(BaseModel):
    geotag_image = models.ForeignKey(
        GeotagImage,
        null=True,
        on_delete=models.SET_NULL,
        related_name="taskgeotagimages",
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        db_index=True,
        related_name="taskgeotagimages",
    )

    x_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    y_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    z_coordinate = models.DecimalField(max_digits=17, decimal_places=10, null=True)
    location_wgs84 = gismodels.PointField(dim=3, null=True)

    filename = models.TextField()
    is_image_available = models.BooleanField(default=False)
    is_geotag_disabled = models.BooleanField(default=False)
    is_image_disabled = models.BooleanField(default=False)
    is_image_aligned = models.BooleanField(default=False)
    is_used_for_processing = models.BooleanField(default=True)

    x_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    y_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    horizontal_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )
    vertical_accuracy = models.DecimalField(
        max_digits=6, decimal_places=3, null=True, blank=True
    )

    omega = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    omega_accuracy = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True
    )
    phi = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    phi_accuracy = models.DecimalField(
        max_digits=6, decimal_places=4, null=True, blank=True
    )
    kappa = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    kappa_accuracy = models.DecimalField(
        max_digits=6, decimal_places=4, null=True, blank=True
    )
    yaw = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    yaw_accuracy = models.DecimalField(
        max_digits=6, decimal_places=4, null=True, blank=True
    )
    pitch = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    pitch_accuracy = models.DecimalField(
        max_digits=6, decimal_places=4, null=True, blank=True
    )
    roll = models.DecimalField(max_digits=7, decimal_places=4, null=True, blank=True)
    roll_accuracy = models.DecimalField(
        max_digits=6, decimal_places=4, null=True, blank=True
    )

    norm_error = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    error_x = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    error_y = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    error_z = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )

    image_orientation = models.TextField(
        choices=ImageOrientationTypeSlug.choices(), null=True, default=None
    )
