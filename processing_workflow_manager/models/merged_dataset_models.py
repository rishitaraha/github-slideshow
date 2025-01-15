from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.contrib.postgres.fields import ArrayField
from django.db import models
from sequences import get_next_value

from shared.constants import VerticalCRS
from shared.models import BaseModel, BatchJob, FileInfo
from site_manager.models import Site

from ..constants import DatasetAlignmentMethod, GeotagRotationAngle, ProcessingStatus


class MergedDataset(BaseModel):
    serial_id = models.TextField(blank=True, null=True, editable=False)
    name = models.TextField()

    number_of_images = models.IntegerField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    is_align_before_merge = models.BooleanField(default=False)
    alignment_method = models.TextField(
        choices=DatasetAlignmentMethod.choices(), null=True, default=None
    )

    are_geotags_present = models.BooleanField(default=False)
    is_preparing_gcp = models.BooleanField(default=False)
    are_gcps_present = models.BooleanField(default=False)
    is_gcp_tagged = models.BooleanField(default=False)

    is_sparse_point_cloud_merged = models.BooleanField(default=False)
    is_dense_point_cloud_merged = models.BooleanField(default=False)
    is_dem_merged = models.BooleanField(default=False)
    is_ortho_merged = models.BooleanField(default=False)

    is_marker_present = models.BooleanField(default=False)
    is_sparse_point_cloud_present = models.BooleanField(default=False)
    is_dense_point_cloud_present = models.BooleanField(default=False)
    is_dem_present = models.BooleanField(default=False)
    is_ortho_present = models.BooleanField(default=False)
    is_report_present = models.BooleanField(default=False)

    geotag_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    geotag_vertical_crs = models.TextField(
        choices=VerticalCRS.choices(),
    )
    geotag_rotation_angle_type = models.TextField(
        choices=GeotagRotationAngle.choices(),
        default=GeotagRotationAngle.OMEGA_PHI_KAPPA.value,
    )
    geotag_column_order = ArrayField(models.TextField(), null=True)

    gcp_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    gcp_vertical_crs = models.TextField(choices=VerticalCRS.choices(), null=True)

    merging_status = models.TextField(
        default=ProcessingStatus.PENDING.value,
        choices=ProcessingStatus.choices(),
    )
    batch_job_details = models.OneToOneField(
        BatchJob, null=True, on_delete=models.DO_NOTHING
    )

    output_psx_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="output_psx_file_merged_dataset",
    )
    output_report_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="output_report_file_merged_dataset",
    )
    output_dense_point_cloud_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="output_dense_point_cloud_file_merged_dataset",
    )
    output_dem_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="output_dem_file_merged_dataset",
    )
    output_ortho_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="output_ortho_file_merged_dataset",
    )

    input_image_s3_folder_info = models.OneToOneField(
        FileInfo,
        null=True,
        on_delete=models.DO_NOTHING,
        related_name="input_image_s3_folder_merged_dataset",
    )

    site = models.ForeignKey(Site, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if self.__getstate__().get("adding"):
            self.serial_id = get_next_value(
                self._meta.db_table + str(self.site.project.org.id)
            )

        # TODO: If state is 'adding' generate file info details for all outputs.
        # TODO: Add validaton functions processing_started_at and update status
        # TODO: Punch datetime processing_stopped_at and processing_started_at
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="check_alignment_method_if_align_before_merge",
                check=models.Q(is_align_before_merge=False)
                | models.Q(is_align_before_merge=True, alignment_method__isnull=False),
            ),
        ]
