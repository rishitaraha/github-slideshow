import os
from unittest import mock

from django.core.files import File
from django.urls import reverse

from processing_workflow_manager.models.geotag_image_models import GeotagImage
from project_manager.models import ProjectPermission
from shared.aws.aws_manager import AwsManager
from shared.constants import EPSG
from shared.exception_handling.api_errors.validation_errors import ValidationErrors
from shared.tests.mock import MockedAwsManager
from site_manager.models.site_models import SitePermission

from ..constants import GeotagImageEntity
from . import ProcessingBaseTestCase
from .test_utils.test_geotags_utils import invalid_utf8_line


class GeotagImageTestCaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_geotag_image_file_upload_with_invalid_utf8_data(self):
        # Write that line with those invalid bytes in file opened write binary mode
        with open(
            f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_invalid_utf8_data.csv",
            "wb",
        ) as invalid_data_geotag_file:
            invalid_data_geotag_file.write(invalid_utf8_line)

        # open gcp file in read binary mode
        invalid_data_geotag_file = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_invalid_utf8_data.csv",
                "rb",
            )
        )
        data = {
            "geotag_image_file": invalid_data_geotag_file,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "geotag_rotation_angle": "omega_phi_kappa",
            "column_order": [
                "filename",
                "latitude",
                "longitude",
                "altitude",
            ],
        }

        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        response_error_slug = response_json["meta"]["slug"]
        error_slug = ValidationErrors.INVALID_FILE_DATA.value.slug
        self.assertEqual(response_error_slug, error_slug)

    def test_complete_geotag_file_upload_wgs84(self):
        # Arrange.
        geotag_file_wgs84 = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data.csv",
                "r",
            )
        )
        data = {
            "geotag_image_file": geotag_file_wgs84,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": self.iteration_dataset_wgs84.geotag_column_order,
        }

        # Act.
        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )

        # Assert.
        response_data = response.json()["data"]
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_data["total_images"], 3)
        self.assertEqual(response_data["enabled_images"], 3)
        geotag_image_counts = GeotagImage.objects.filter(
            iteration_dataset=self.iteration_dataset_wgs84,
            is_image_available=True,
        ).count()
        self.assertEqual(geotag_image_counts, 3)

    def test_geotag_file_upload_with_duplicate_columns(self):
        invalid_geotag_file = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data.csv",
                "r",
            )
        )

        data = {
            "geotag_image_file": invalid_geotag_file,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": [
                "filename",
                "latitude",
                "longitude",
                "altitude",
                "latitude",
                "none",
            ],
        }

        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        response_json = response.json()
        response_error_slug = response_json["meta"]["slug"]
        error_slug = ValidationErrors.INVALID_GEOTAG_COLUMNS.value.slug
        self.assertEqual(response_error_slug, error_slug)

    def test_complete_geotag_file_upload_utm_zone(self):
        geotag_file_utm_zone = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data_utm_accuracy.csv",
                "r",
            )
        )
        data = {
            "geotag_image_file": geotag_file_utm_zone,
            "geotag_horizontal_crs": EPSG.WGS84_UTM_ZONE_42.value,
            "iteration_dataset": self.iteration_dataset_utm_zone.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": self.iteration_dataset_utm_zone.geotag_column_order,
        }

        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        geotag_image_counts = GeotagImage.objects.filter(
            iteration_dataset=self.iteration_dataset_utm_zone
        ).count()
        self.assertEqual(geotag_image_counts, 6)  # file contains 6 geotag image data

    def test_fetch_geotag_images(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("geotag-images-list"), data=data)
        self.assertEqual(response.json()["data"]["total"], 5)

    def test_fetch_geotag_images_without_image(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotags_without_images": True,
        }
        response = self.client.get(reverse("geotag-images-list"), data=data)

        self.assertEqual(response.json()["data"]["total"], 1)

    def test_fetch_geotag_images_without_geotags(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "images_without_geotags": True,
        }
        response = self.client.get(reverse("geotag-images-list"), data=data)
        self.assertEqual(response.json()["data"]["total"], 1)

    def test_fetch_geotag_images_with_geotags(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "images_with_geotags": True,
        }
        response = self.client.get(reverse("geotag-images-list"), data=data)
        self.assertEqual(response.json()["data"]["total"], 3)

    def test_bulk_update_geotag_images(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_image_ids": [
                self.geotag_image_wgs_84_1.id,
                self.geotag_image_wgs_84_2.id,
            ],
            "is_geotag_disabled": True,
            "is_image_disabled": True,
        }
        response = self.client.patch(reverse("geotag-images-bulk-update"), data=data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()["data"]
        self.assertEqual(response_data["total"], 2)

    def test_update_geotag_image(self):
        data = {
            "x_coordinate": 25.76,
            "is_image_disabled": True,
        }
        response = self.client.patch(
            reverse(
                "geotag-images-detail",
                kwargs={"pk": str(self.geotag_image_wgs_84_1.id)},
            ),
            data=data,
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()["data"]
        geotag_image_data = response_data["geotag_image"]
        self.assertEqual(geotag_image_data["x_coordinate"], 25.76)
        self.assertEqual(geotag_image_data["is_image_disabled"], True)

    def test_bulk_delete_geotag_images_without_ids(self):
        response = self.client.post(
            reverse("geotag-images-bulk_delete"),
            {
                "iteration_dataset": self.iteration_dataset_wgs84.id,
                "geotag_image_ids": [],
                "entity": GeotagImageEntity.IMAGE_DATA.value,
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_bulk_delete_geotag_images_geotag_data(self):
        all_geotag_images = self.iteration_dataset_wgs84.geotagimages.all()
        all_geotag_ids = all_geotag_images.values_list("id", flat=True)

        response = self.client.post(
            reverse("geotag-images-bulk_delete"),
            {
                "iteration_dataset": self.iteration_dataset_wgs84.id,
                "geotag_image_ids": all_geotag_ids,
                "entity": GeotagImageEntity.GEOTAG_DATA.value,
            },
        )
        self.assertEqual(response.status_code, 204)

        self.iteration_dataset_wgs84.refresh_from_db()
        self.assertEqual(self.iteration_dataset_wgs84.geotagimages.all().count(), 5)
        self.assertEqual(self.iteration_dataset_wgs84.are_geotags_present, True)

        self.geotag_image_wgs_84_1.refresh_from_db()
        self.assertIsNone(self.geotag_image_wgs_84_1.x_coordinate)
        self.assertEqual(self.geotag_image_wgs_84_1.is_deleted, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_available, True)
        self.assertEqual(self.geotag_image_wgs_84_1.is_geotag_disabled, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_disabled, False)

    def test_bulk_delete_geotag_images_image_data(self):
        all_geotag_images = self.iteration_dataset_wgs84.geotagimages.all()
        all_geotag_ids = all_geotag_images.values_list("id", flat=True)

        response = self.client.post(
            reverse("geotag-images-bulk_delete"),
            {
                "iteration_dataset": self.iteration_dataset_wgs84.id,
                "geotag_image_ids": all_geotag_ids,
                "entity": GeotagImageEntity.IMAGE_DATA.value,
            },
        )
        self.assertEqual(response.status_code, 204)

        self.iteration_dataset_wgs84.refresh_from_db()
        self.assertEqual(self.iteration_dataset_wgs84.are_geotags_present, True)

        self.geotag_image_wgs_84_1.refresh_from_db()
        self.assertIsNotNone(self.geotag_image_wgs_84_1.x_coordinate)
        self.assertEqual(self.geotag_image_wgs_84_1.is_deleted, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_available, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_geotag_disabled, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_disabled, False)

    def test_bulk_delete_geotag_images_geotag_image(self):
        all_geotag_images = self.iteration_dataset_wgs84.geotagimages.all()
        all_geotag_ids = all_geotag_images.values_list("id", flat=True)

        response = self.client.post(
            reverse("geotag-images-bulk_delete"),
            {
                "iteration_dataset": self.iteration_dataset_wgs84.id,
                "geotag_image_ids": all_geotag_ids,
                "entity": GeotagImageEntity.GEOTAG_IMAGE.value,
            },
        )
        self.assertEqual(response.status_code, 204)

        self.iteration_dataset_wgs84.refresh_from_db()
        self.assertEqual(self.iteration_dataset_wgs84.are_geotags_present, False)

        self.geotag_image_wgs_84_1.refresh_from_db()
        self.assertIsNotNone(self.geotag_image_wgs_84_1.x_coordinate)
        self.assertEqual(self.geotag_image_wgs_84_1.is_deleted, True)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_available, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_geotag_disabled, False)
        self.assertEqual(self.geotag_image_wgs_84_1.is_image_disabled, False)

    def test_bulk_delete_geotag_images_failure(self):
        response = self.client.post(
            reverse("geotag-images-bulk_delete"),
            {
                "iteration_dataset": self.iteration_dataset_wgs84.id,
                "geotag_image_ids": [str(self.gcp_utm_1.id)],
                "entity": GeotagImageEntity.GEOTAG_IMAGE.value,
            },
        )
        self.assertEqual(response.status_code, 400)

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_fetch_geotag_image_presigned_url(self, _):
        # Act.
        response = self.client.get(
            reverse(
                "geotag-images-presigned-url",
                args=[str(self.geotag_image_wgs_84_1.id)],
            )
        )

        # Assert.
        self.assertEqual(response.status_code, 200)

    def test_not_found_geotag_image_presigned_url(self):
        # Act.
        response = self.client.get(
            reverse(
                "geotag-images-presigned-url",
                args=[str(self.iteration_dataset_utm_zone.id)],
            )
        )

        # Assert.
        self.assertEqual(response.status_code, 404)


class GeotagImageTestCaseForMember(ProcessingBaseTestCase):
    # Test for member user.
    def setUp(self):
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group_with_manage_iteration,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group_with_manage_iteration,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.user_2)

    def test_complete_geotag_file_upload_wgs84_without_permissions(self):
        self.api_authentication(self.user)
        geotag_file_wgs84 = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data.csv",
                "r",
            )
        )
        # Arrange.
        data = {
            "geotag_image_file": geotag_file_wgs84,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": self.iteration_dataset_wgs84.geotag_column_order,
        }

        # Act.
        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )

        # Assert.
        self.assertEqual(response.status_code, 403)

    def test_complete_geotag_file_upload_wgs84_with_permissions(self):
        # Arrange.
        geotag_file_wgs84 = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data.csv",
                "r",
            )
        )
        data = {
            "geotag_image_file": geotag_file_wgs84,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": self.iteration_dataset_wgs84.geotag_column_order,
        }

        # Act.
        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )

        # Assert.
        self.assertEqual(response.status_code, 201)

    def test_complete_geotag_file_upload_wgs84_without_feature_flag(self):
        self.api_authentication(self.user_of_org2)
        geotag_file_wgs84 = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/geotags_data.csv",
                "r",
            )
        )
        # Arrange.
        data = {
            "geotag_image_file": geotag_file_wgs84,
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "geotag_vertical_crs": "Ellipsoidal",
            "column_order": self.iteration_dataset_wgs84.geotag_column_order,
        }

        # Act.
        response = self.client.post(
            reverse("geotag-images-list"),
            data,
            format="multipart",
        )

        # Assert.
        self.assertEqual(response.status_code, 403)

    def test_fetch_geotag_image_presigned_url_without_permission(self):
        self.api_authentication(self.user_of_org2)
        # Act.
        response = self.client.get(
            reverse(
                "geotag-images-presigned-url",
                args=[str(self.geotag_image_wgs_84_1.id)],
            )
        )

        # Assert.
        self.assertEqual(response.status_code, 403)

    # TODO: Add testcase for geotag image bulk update, update and list endpoints.
