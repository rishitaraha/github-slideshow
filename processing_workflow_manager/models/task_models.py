from django.contrib.gis.db import models as gismodels
from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.db import models
from sequences import get_next_value

from shared.constants import EPSG, VerticalCRS
from shared.models import BaseModel, BatchJob, FileInfo
from user_manager.models import CustomUser

from ..constants import (
    ContinuedFromDatasetType,
    CroppingRegionBehaviour,
    GeotagRotationAngle,
    ProcessingStatus,
    TaskStageNameInDatabase,
)
from .merged_dataset_models import MergedDataset
from .processing_iteration_data_models import ProcessingIterationData


class Task(BaseModel):
    serial_id = models.IntegerField(blank=True, null=True, editable=False)
    name = models.TextField()

    status = models.TextField(
        choices=ProcessingStatus.choices(),
        default=ProcessingStatus.PENDING.value,
    )

    iteration_dataset = models.ForeignKey(
        ProcessingIterationData,
        on_delete=models.CASCADE,
        null=True,
        related_name="tasks",
    )
    merged_dataset = models.ForeignKey(
        MergedDataset, on_delete=models.CASCADE, null=True, related_name="tasks"
    )
    options = models.JSONField(null=True)
    batch_job_details = models.OneToOneField(
        BatchJob,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="task_batch_job",
    )

    preset_id = models.CharField(max_length=255, null=True)

    x_average_error = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    y_average_error = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    z_average_error = models.DecimalField(
        max_digits=20, decimal_places=10, null=True, blank=True
    )
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )

    end_stage = models.TextField(choices=TaskStageNameInDatabase.choices(), null=True)

    continued_from_task = models.ForeignKey(
        "self",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="continued_tasks",
    )

    continued_from = models.TextField(
        choices=ContinuedFromDatasetType.choices(),
        null=True,
        default=None,
    )
    # Output Data Info
    is_sparse_point_cloud_present = models.BooleanField(default=False)
    is_dense_point_cloud_present = models.BooleanField(default=False)
    is_dem_present = models.BooleanField(default=False)
    is_ortho_present = models.BooleanField(default=False)

    rotation_angle_type = models.TextField(
        choices=GeotagRotationAngle.choices(),
        null=True,
        default=None,
    )
    clipping_boundary = gismodels.GeometryCollectionField(null=True, dim=3)

    # Geotags and GCP CRS
    input_geotag_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    input_gcp_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    input_geotag_vertical_crs = models.TextField(
        null=True, default=None, choices=VerticalCRS.choices()
    )
    input_gcp_vertical_crs = models.TextField(choices=VerticalCRS.choices(), null=True)
    output_horizontal_crs = models.ForeignKey(
        PostGISSpatialRefSys,
        related_name="+",
        on_delete=models.DO_NOTHING,
        default=None,
        null=True,
    )
    output_vertical_crs = models.TextField(
        choices=VerticalCRS.choices(),
        null=True,
        default=None,
    )

    cropping_region = gismodels.GeometryCollectionField(null=True, dim=3)
    cropping_region_behaviour = models.TextField(
        null=True, default=None, choices=CroppingRegionBehaviour.choices()
    )
    output_folder_path = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_folder_task",
    )
    output_project_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_project_file_task",
    )
    output_dense_point_cloud_file_info = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_dense_point_cloud_file_task",
    )
    output_dem = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_dem_task",
    )
    output_dem_cog = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_dem_cog_task",
    )
    output_ortho = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_ortho_task",
    )
    output_ortho_cog = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_ortho_cog_task",
    )
    output_ortho_tile_zip = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_ortho_tile_zip_task",
    )
    output_report = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_report_task",
    )
    output_all_assets_zip = models.OneToOneField(
        FileInfo,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="output_all_assets_zip_task",
    )
    # TODO: Below fields to be added?
    # "dem_metadata", "ortho_metadata",

    # Properties
    @property
    def input_gcp_horizontal_crs_obj(self) -> str:
        if not self.input_gcp_horizontal_crs:
            return None
        return EPSG(self.input_gcp_horizontal_crs.srid)

    @property
    def input_geotag_horizontal_crs_obj(self) -> str:
        if not self.input_geotag_horizontal_crs:
            return None
        return EPSG(self.input_geotag_horizontal_crs.srid)

    @property
    def output_horizontal_crs_obj(self) -> str:
        if not self.output_horizontal_crs:
            return None
        return EPSG(self.output_horizontal_crs.srid)

    @property
    def continued_from_task_name(self) -> str:
        if self.continued_from_task:
            return self.continued_from_task.name
        return None

    def save(self, *args, **kwargs):
        # TODO:  Validate parent dataset and cropping behavior
        if self._state.adding:
            serial_id_value = None
            if self.iteration_dataset:
                serial_id_value = get_next_value(
                    self._meta.db_table
                    + str(self.iteration_dataset.iteration.site.project.org.id)
                )
            else:
                serial_id_value = get_next_value(
                    self._meta.db_table + str(self.merged_dataset.site.project.org.id)
                )
            self.serial_id = serial_id_value
        super().save(*args, **kwargs)

    # TODO: Generate output paths for all outputs and store in FileInfo model
