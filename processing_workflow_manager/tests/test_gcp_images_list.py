from datetime import datetime
from decimal import Decimal
from operator import itemgetter
from unittest import mock
from uuid import uuid4

from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.urls import reverse

from iteration_manager.models.iteration_models import Iteration
from rainbow.env_variables import EnvVariable
from shared.aws.aws_manager import AwsManager
from shared.constants.files import BatchJobStatus, FileStatus, FileType
from shared.constants.gis.crs import EPSG, VerticalCRS
from shared.models.file_models import FileInfo
from shared.models.process_models import BatchJob
from shared.tests.mock import MockedAwsManager

from ..constants import ImageOrientationExifType
from ..models import (
    GCP,
    ApproxGCPImageTag,
    GCPImageTag,
    GeotagImage,
    ProcessingIterationData,
)
from ..serializers import gcp_serializers
from ..tests import ProcessingBaseTestCase


class GcpImageListTestcaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)
        self.test_iteration = Iteration.objects.create(
            name="Test Iteration",
            date=datetime.now(),
            site=self.site,
            captured_dsm=FileInfo.objects.create(
                name="captured_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM.value,
                org=self.org,
            ),
            captured_dsm_cog=FileInfo.objects.create(
                name="captured_dsm_cog.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM_COG.value,
                org=self.org,
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
        self.test_iteration_dataset_wgs84 = ProcessingIterationData.objects.create(
            iteration=self.test_iteration,
            image_folder_path=FileInfo.objects.create(
                name="iteration_images",
                type=FileType.IMAGES_FOLDER.value,
                is_folder=True,
                bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                s3_key="iteration_id/Images/",
                status=FileStatus.DONE.value,
            ),
            geotag_column_order=[
                "filename",
                "x_coordinate",
                "y_coordinate",
                "z_coordinate",
            ],
            geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            geotag_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            gcp_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(srid=EPSG.WGS84.value),
            are_gcps_present=True,
            are_geotags_present=True,
        )

        self.test_gcp = GCP.objects.create(
            label="GCP1",
            x_coordinate=Decimal(77.77825058),
            y_coordinate=Decimal(13.12965646),
            z_coordinate=Decimal(798.1062),
            type="checkpoint",
            iteration_dataset=self.test_iteration_dataset_wgs84,
        )
        self.geotag_image_1 = GeotagImage.objects.create(
            filename="DSC00001.JPG",
            x_coordinate=self.test_gcp.x_coordinate + Decimal(0.01),
            y_coordinate=self.test_gcp.y_coordinate + Decimal(0.01),
            z_coordinate=Decimal(912.0344),
            iteration_dataset=self.test_iteration_dataset_wgs84,
            is_image_available=True,
        )
        self.geotag_image_2 = GeotagImage.objects.create(
            filename="DSC00002.JPG",
            x_coordinate=self.test_gcp.x_coordinate + Decimal(0.02),
            y_coordinate=self.test_gcp.y_coordinate + Decimal(0.02),
            z_coordinate=Decimal(912.0344),
            iteration_dataset=self.test_iteration_dataset_wgs84,
            is_image_available=True,
        )
        self.geotag_image_3 = GeotagImage.objects.create(
            filename="DSC00003.JPG",
            x_coordinate=self.test_gcp.x_coordinate + Decimal(0.03),
            y_coordinate=self.test_gcp.y_coordinate + Decimal(0.03),
            z_coordinate=Decimal(912.0344),
            iteration_dataset=self.test_iteration_dataset_wgs84,
            is_image_available=True,
        )
        self.geotag_image_4 = GeotagImage.objects.create(
            filename="DSC00004.JPG",
            x_coordinate=self.test_gcp.x_coordinate + Decimal(0.04),
            y_coordinate=self.test_gcp.y_coordinate + Decimal(0.04),
            z_coordinate=Decimal(912.0344),
            iteration_dataset=self.test_iteration_dataset_wgs84,
            is_image_available=True,
        )
        self.geotag_image_5 = GeotagImage.objects.create(
            filename="DSC00005.JPG",
            x_coordinate=self.test_gcp.x_coordinate + Decimal(0.05),
            y_coordinate=self.test_gcp.y_coordinate + Decimal(0.05),
            z_coordinate=Decimal(912.0344),
            iteration_dataset=self.test_iteration_dataset_wgs84,
            is_image_available=True,
        )
        self.gcp_image_path = reverse("gcps-images", args=[self.test_gcp.id])

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    @mock.patch.object(
        gcp_serializers,
        "get_image_orientation_slug_from_exif",
        return_value=ImageOrientationExifType.HORIZONTAL_NORMAL.value,
    )
    def test_gcp_images_list_order_tagged_over_approx(self, *mock_output):
        self.approx_gcp_image_tag_1 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_3,
            image_x=1000,
            image_y=2000,
        )
        self.tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_2,
            image_x=1000,
            image_y=2000,
        )
        self.approx_gcp_image_tag_2 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_1,
            image_x=1000,
            image_y=2000,
        )
        self.tagged_gcp_image_2 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_4,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.get(self.gcp_image_path)
        self.assertEqual(response.status_code, 200)

        response_images = response.json()["data"]["images"]
        expected_order = [
            self.geotag_image_2.filename,
            self.geotag_image_4.filename,
            self.geotag_image_1.filename,
            self.geotag_image_3.filename,
            self.geotag_image_5.filename,
        ]
        self.assertEqual(
            expected_order,
            list(map(itemgetter("image_filename"), response_images)),
        )

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    @mock.patch.object(
        gcp_serializers,
        "get_image_orientation_slug_from_exif",
        return_value=ImageOrientationExifType.HORIZONTAL_NORMAL.value,
    )
    def test_gcp_images_list_order_tagged_over_untagged(self, *mock_output):
        self.approx_gcp_image_tag_1 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_3,
            image_x=1000,
            image_y=2000,
        )
        self.approx_gcp_image_tag_2 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_2,
            image_x=1000,
            image_y=2000,
        )
        self.tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_5,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.get(self.gcp_image_path)
        self.assertEqual(response.status_code, 200)
        response_images = response.json()["data"]["images"]
        expected_order = [
            self.geotag_image_5.filename,
            self.geotag_image_2.filename,
            self.geotag_image_3.filename,
            self.geotag_image_1.filename,
            self.geotag_image_4.filename,
        ]
        self.assertEqual(
            expected_order,
            list(map(itemgetter("image_filename"), response_images)),
        )

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    @mock.patch.object(
        gcp_serializers,
        "get_image_orientation_slug_from_exif",
        return_value=ImageOrientationExifType.HORIZONTAL_NORMAL.value,
    )
    def test_gcp_images_list_ordered_by_distance_when_no_tagged_images_present(
        self, *mock_output
    ):
        self.approx_gcp_image_tag_1 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_4,
            image_x=1000,
            image_y=2000,
        )
        self.approx_gcp_image_tag_2 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_3,
            image_x=1000,
            image_y=2000,
        )
        self.approx_gcp_image_tag_3 = ApproxGCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_5,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.get(self.gcp_image_path)
        self.assertEqual(response.status_code, 200)
        response_images = response.json()["data"]["images"]
        expected_order = [
            self.geotag_image_3.filename,
            self.geotag_image_4.filename,
            self.geotag_image_5.filename,
            self.geotag_image_1.filename,
            self.geotag_image_2.filename,
        ]
        self.assertEqual(
            expected_order,
            list(map(itemgetter("image_filename"), response_images)),
        )

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    @mock.patch.object(
        gcp_serializers,
        "get_image_orientation_slug_from_exif",
        return_value=ImageOrientationExifType.HORIZONTAL_NORMAL.value,
    )
    def test_gcp_images_list_ordered_by_distance_when_no_approx_images_present(
        self, *mock_output
    ):
        self.tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_3,
            image_x=1000,
            image_y=2000,
        )
        self.tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_2,
            image_x=1000,
            image_y=2000,
        )
        self.tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.test_gcp,
            geotag_image=self.geotag_image_5,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.get(self.gcp_image_path)
        self.assertEqual(response.status_code, 200)
        response_images = response.json()["data"]["images"]
        expected_order = [
            self.geotag_image_2.filename,
            self.geotag_image_3.filename,
            self.geotag_image_5.filename,
            self.geotag_image_1.filename,
            self.geotag_image_4.filename,
        ]
        self.assertEqual(
            expected_order,
            list(map(itemgetter("image_filename"), response_images)),
        )

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    @mock.patch.object(
        gcp_serializers,
        "get_image_orientation_slug_from_exif",
        return_value=ImageOrientationExifType.HORIZONTAL_NORMAL.value,
    )
    def test_gcp_images_list_ordered_by_distance_when_no_image_tags_present(
        self, *mock_output
    ):
        response = self.client.get(self.gcp_image_path)
        self.assertEqual(response.status_code, 200)
        response_images = response.json()["data"]["images"]
        expected_order = [
            self.geotag_image_1.filename,
            self.geotag_image_2.filename,
            self.geotag_image_3.filename,
            self.geotag_image_4.filename,
            self.geotag_image_5.filename,
        ]
        self.assertEqual(
            expected_order,
            list(map(itemgetter("image_filename"), response_images)),
        )
