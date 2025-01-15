from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.contrib.postgres.fields import ArrayField
from django.db import models

from iteration_manager.models import Iteration
from processing_workflow_manager.constants import GeotagRotationAngle
from shared.constants import VerticalCRS
from shared.models import BaseModel, BatchJob, FileInfo


class ProcessingIterationData(BaseModel):
    iteration = models.OneToOneField(
        Iteration, on_delete=models.DO_NOTHING, related_name="processing_data"
    )
    is_archived = models.BooleanField(default=False)

    image_folder_path = models.OneToOneField(
        FileInfo,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="processing_iteration_image_folder_path",
    )

    geotag_column_order = ArrayField(models.TextField(), null=True)

    are_geotags_present = models.BooleanField(default=False)
    are_gcps_present = models.BooleanField(default=False)
    is_gcp_tagged = models.BooleanField(default=False)

    geotag_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    geotag_vertical_crs = models.TextField(
        null=True,
        blank=True,
        choices=VerticalCRS.choices(),
    )
    gcp_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    gcp_vertical_crs = models.TextField(
        null=True,
        blank=True,
        choices=VerticalCRS.choices(),
    )

    is_preparing_geotags = models.BooleanField(default=False)
    exif_extractor_job_id = models.ForeignKey(
        BatchJob,
        on_delete=models.DO_NOTHING,
        null=True,
    )
    rotation_angle_type = models.TextField(
        choices=GeotagRotationAngle.choices(), null=True, default=None
    )

    number_of_images = models.PositiveIntegerField(null=True, blank=True)
    number_of_images_enabled = models.PositiveIntegerField(null=True, blank=True)
