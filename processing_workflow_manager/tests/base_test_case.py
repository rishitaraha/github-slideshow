from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.contrib.gis.geos import Point

from iteration_manager.models import Iteration
from processing_workflow_manager.constants import (
    ProcessingStatus,
    TaskStageNameInDatabase,
)
from processing_workflow_manager.models import (
    GCP,
    DefaultPreset,
    GeotagImage,
    OrgPreset,
    ProcessingIterationData,
    Task,
)
from rainbow.env_variables import EnvVariable
from shared.constants import EPSG, BatchJobStatus, FileStatus, FileType, VerticalCRS
from shared.models import BatchJob, FileInfo
from shared.tests import BaseTestCase


class ProcessingBaseTestCase(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.dummy_uuid = "c69afd16-e8b0-4b54-aebc-89e9a84367c3"
        cls.default_preset_1 = DefaultPreset.objects.create(
            name="Standard", value="default preset 1"
        )
        cls.default_preset_2 = DefaultPreset.objects.create(
            name="Sample", value="default preset 2"
        )
        cls.org_preset = OrgPreset.objects.create(
            name="org_preset", value="organisation preset", org=cls.org
        )

        cls.sample_batch_job = BatchJob.objects.create(
            job_id=uuid4(),
            status=BatchJobStatus.STARTED.value,
            env_variables=[],
        )

        cls.setup_iteration_dataset()
        cls.setup_gcp_data()
        cls.setup_geotags_data()
        cls.setup_task_data()

    @classmethod
    def setup_iteration_dataset(cls):
        # Processing Iteration Data.
        cls.iteration_without_iteration_dataset = Iteration.objects.create(
            name="Test Iteration",
            date=datetime.now(),
            site=cls.site,
            captured_dsm=FileInfo.objects.create(
                name="captured_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM.value,
                org=cls.org,
            ),
            captured_dsm_cog=FileInfo.objects.create(
                name="captured_dsm_cog.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM_COG.value,
                org=cls.org,
                batch_job=BatchJob.objects.create(
                    job_id=uuid4(),
                    env_variables=[
                        {
                            "name": "OUTPUT_S3_KEY",
                            "value": "OUTPUT_S3_KEY",
                        }
                    ],
                    status=BatchJobStatus.COMPLETED.value,
                ),
            ),
        )
        cls.iteration_dataset_wgs84 = ProcessingIterationData.objects.create(
            iteration=cls.iteration,
            image_folder_path=FileInfo.objects.create(
                name="iteration_images",
                is_folder=True,
                type=FileType.IMAGES_FOLDER.value,
                bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                s3_key="iteration_id/Images/",
                status=FileStatus.DONE.value,
            ),
            geotag_column_order=[
                "filename",
                "latitude",
                "longitude",
                "altitude",
            ],
            geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            geotag_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(srid=EPSG.WGS84.value),
            gcp_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            are_gcps_present=True,
            are_geotags_present=True,
        )

        cls.iteration_utm_zone = Iteration.objects.create(
            name="Test Iteration",
            date=datetime.now(),
            site=cls.site,
            captured_dsm=FileInfo.objects.create(
                name="captured_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM.value,
                org=cls.org,
            ),
            captured_dsm_cog=FileInfo.objects.create(
                name="captured_dsm_cog.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM_COG.value,
                org=cls.org,
                batch_job=BatchJob.objects.create(
                    job_id=uuid4(),
                    env_variables=[
                        {
                            "name": "OUTPUT_S3_KEY",
                            "value": "OUTPUT_S3_KEY",
                        }
                    ],
                    status=BatchJobStatus.COMPLETED.value,
                ),
            ),
            terrain_tiles=BatchJob.objects.create(
                job_id=uuid4(),
                env_variables=[
                    {
                        "name": "OUTPUT_S3_KEY",
                        "value": "OUTPUT_S3_KEY",
                    }
                ],
                status=BatchJobStatus.COMPLETED.value,
            ),
        )

        cls.iteration_dataset_utm_zone = ProcessingIterationData.objects.create(
            iteration=cls.iteration_utm_zone,
            image_folder_path=FileInfo.objects.create(
                name="iteration_images",
                is_folder=True,
                type=FileType.IMAGES_FOLDER.value,
                bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                s3_key="iteration_id/Images/",
                status=FileStatus.DONE.value,
            ),
            geotag_column_order=[
                "filename",
                "northing",
                "easting",
                "altitude",
                "omega",
                "phi",
            ],
            geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84_UTM_ZONE_42.value
            ),
            geotag_vertical_crs=VerticalCRS.EGM96.value,
            gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84_UTM_ZONE_42.value
            ),
            gcp_vertical_crs=VerticalCRS.EGM96.value,
            are_gcps_present=True,
        )

    @classmethod
    def setup_geotags_data(cls):
        # Geotags Data.
        # Valid geotag image
        cls.geotag_image_wgs_84_1 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77482063),
            y_coordinate=Decimal(85.5669248),
            z_coordinate=Decimal(343.149),
            location_wgs84=Point(
                float(23.77612866), float(85.56735879), float(294.193)
            ),
            filename="DSC000001.JPG",
            is_image_available=True,
            y_accuracy="123.1",
        )

        # Geotag without image
        cls.geotag_image_wgs_84_2 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.774820711),
            y_coordinate=Decimal(85.5669248),
            z_coordinate=Decimal(343.149),
            location_wgs84=Point(
                float(23.77612866), float(85.56735879), float(294.193)
            ),
            filename="DSC000002.JPG",
            is_image_available=False,
        )

        # Image without geotag
        cls.geotag_image_wgs_84_3 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_wgs84,
            filename="DSC000003.JPG",
            is_image_available=True,
        )

        # Invalid geotag with altitude missing
        cls.geotag_image_wgs_84_4 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.774820711),
            y_coordinate=Decimal(85.5669248),
            z_coordinate=Decimal(294.193),
            location_wgs84=Point(
                float(23.77612866), float(85.56735879), float(294.193)
            ),
            filename="DSC000003.JPG",
            is_image_available=True,
        )

        cls.geotag_image_wgs_84_5 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.774820711),
            y_coordinate=Decimal(85.5669248),
            z_coordinate=Decimal(294.193),
            location_wgs84=Point(
                float(23.77612866), float(85.56735879), float(294.193)
            ),
            filename="DSC_000005.JPG",
            is_image_available=True,
        )

        cls.geotag_image_utm_1 = GeotagImage.objects.create(
            iteration_dataset=cls.iteration_dataset_utm_zone,
            x_coordinate=Decimal(2380598.7),
            y_coordinate=Decimal(444324.56),
            z_coordinate=Decimal(294.193),
            filename="DSC000042.JPG",
            is_image_available=True,
        )

    @classmethod
    def setup_gcp_data(cls):
        # GCPs.
        cls.gcp_wgs84_1 = GCP.objects.create(
            label="GCP1",
            type="controlpoint",
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77612866),
            y_coordinate=Decimal(85.56735879),
            z_coordinate=Decimal(294.193),
        )
        cls.gcp_wgs84_2 = GCP.objects.create(
            label="GCP2",
            type="controlpoint",
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77612866),
            y_coordinate=Decimal(85.56735879),
            z_coordinate=Decimal(294.193),
        )
        cls.gcp_wgs84_3 = GCP.objects.create(
            label="GCP3",
            type="checkpoint",
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77612866),
            y_coordinate=Decimal(85.56735879),
            z_coordinate=Decimal(294.193),
        )
        cls.gcp_wgs84_4 = GCP.objects.create(
            label="GCP4",
            type="checkpoint",
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77612866),
            y_coordinate=Decimal(85.56735879),
            z_coordinate=Decimal(294.193),
        )
        cls.gcp_wgs84_5 = GCP.objects.create(
            label="GCP5",
            type="checkpoint",
            iteration_dataset=cls.iteration_dataset_wgs84,
            x_coordinate=Decimal(23.77612866),
            y_coordinate=Decimal(85.56735879),
            z_coordinate=Decimal(294.193),
        )

        cls.gcp_utm_1 = GCP.objects.create(
            label="GCP5",
            type="checkpoint",
            iteration_dataset=cls.iteration_dataset_utm_zone,
            x_coordinate=Decimal(2380598.7),
            y_coordinate=Decimal(444324.56),
            z_coordinate=Decimal(294.193),
        )

    @classmethod
    def setup_task_data(cls):
        cls.task_iteration_dataset_wgs84_1 = Task.objects.create(
            serial_id=1,
            name="Test Task WGS84 1",
            status=ProcessingStatus.COMPLETED.value,
            iteration_dataset=cls.iteration_dataset_wgs84,
            options='{"option1": "value1"}',
            preset_id=cls.default_preset_1.id,
            x_average_error=0.1234567890,
            y_average_error=0.1234567890,
            z_average_error=0.1234567890,
            created_by=cls.user,
            end_stage=TaskStageNameInDatabase.GENERATE_ORTHOMOSAIC.value,
            is_ortho_present=True,
            rotation_angle_type=None,
            input_geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            input_gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            input_geotag_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            input_gcp_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            output_folder_path=FileInfo.objects.create(
                name="output folder",
                s3_key="output_folder",
                status=FileStatus.DONE.value,
                type=FileType.IMAGES_FOLDER.value,
                org=cls.org,
            ),
            output_project_file_info=FileInfo.objects.create(
                name="output project file",
                s3_key="output_project_file",
                status=FileStatus.DONE.value,
                type=FileType.PROJECT_FILE.value,
                org=cls.org,
            ),
            output_ortho=FileInfo.objects.create(
                name="output ortho file",
                s3_key="output_ortho_file",
                status=FileStatus.DONE.value,
                type=FileType.ORTHOMOSAIC.value,
                org=cls.org,
            ),
            batch_job_details=BatchJob.objects.create(
                job_id=uuid4(),
                env_variables=[
                    {
                        "name": "OUTPUT_S3_KEY",
                        "value": "OUTPUT_S3_KEY",
                    }
                ],
                status=BatchJobStatus.COMPLETED.value,
            ),
        )

        cls.task_pending_iteration_dataset_wgs84_2 = Task.objects.create(
            serial_id=1,
            name="Test Task WGS84 2",
            status=ProcessingStatus.PENDING.value,
            iteration_dataset=cls.iteration_dataset_wgs84,
            options='{"option1": "value1"}',
            preset_id=cls.default_preset_2.id,
            created_by=cls.user,
            end_stage=TaskStageNameInDatabase.GENERATE_ORTHOMOSAIC.value,
            rotation_angle_type=None,
            input_geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            input_gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            input_geotag_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            input_gcp_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            output_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            output_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            batch_job_details=BatchJob.objects.create(
                job_id=uuid4(),
                env_variables=[
                    {
                        "name": "OUTPUT_S3_KEY",
                        "value": "OUTPUT_S3_KEY",
                    }
                ],
                status=BatchJobStatus.PENDING.value,
            ),
        )
