import json
from datetime import datetime
from unittest import SkipTest, mock

from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from django.urls import reverse
from rest_framework import status

from analytics_engine_manager.tests.mock import (
    mocked_elevation_profile,
    mocked_generate_3d_shape_file,
)
from iteration_manager.models import Iteration
from layer_manager.constants import LayerType
from layer_manager.models import Feature, Layer, LayerFile
from processing_workflow_manager.models import ProcessingIterationData
from rainbow.env_variables import EnvVariable
from shared.aws import AwsManager
from shared.constants import FileStatus, FileType
from shared.constants.gis.crs import EPSG, VerticalCRS
from shared.models import FileInfo
from shared.tests import BaseTestCase
from shared.tests.constants import WKTGeometry
from shared.tests.mock import MockedAwsManager
from user_manager.models import CustomUser, UserGroup


class TestCanManageIterations(BaseTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="VFGko4M3#W*7Zou*x7MB2",
            first_name="first_name2",
            last_name="last_name2",
            org=cls.org,
        )
        cls.test_captured_dsm = FileInfo.objects.create(
            name="test_captured_dsm.tif",
            s3_key="s3_key_of_test_captured_dsm.tif",
            status=FileStatus.DONE.value,
            type=FileType.CAPTURED_DSM.value,
        )
        cls.test_ortho = FileInfo.objects.create(
            name="test_ortho.tif",
            s3_key="s3_key_of_test_ortho.tif",
            status=FileStatus.DONE.value,
            type=FileType.ORTHOMOSAIC.value,
        )
        cls.test_ortho_cog = FileInfo.objects.create(
            name="test_ortho_cog.tif",
            s3_key="s3_key_of_test_ortho_cog.tif",
            status=FileStatus.DONE.value,
            type=FileType.ORTHOMOSAIC_COG.value,
        )
        cls.test_iteration = Iteration.objects.create(
            name="Test Iteration 2",
            date=datetime.now(),
            site=cls.site,
            captured_dsm=cls.test_captured_dsm,
        )
        cls.test_layer = Layer.objects.create(
            name="Test Layer",
            iteration=cls.iteration,
            site=cls.site,
            type=LayerType.ORTHOMOSAIC.value,
        )
        cls.test_layer_file = LayerFile.objects.create(
            layer=cls.test_layer, file_info=cls.test_ortho_cog
        )
        cls.test_layer_file = LayerFile.objects.create(
            layer=cls.test_layer, file_info=cls.test_ortho
        )
        cls.test_feature = Feature.objects.create(
            name="Test Feature",
            geometry=WKTGeometry.LINESTRING.value,
            layer=cls.test_layer,
            properties={"area": 55.06},
            info="some info",
        )
        cls.test_group = UserGroup.objects.create(
            name="group name",
            org=cls.org,
        )
        cls.test_group.users.add(cls.test_user.id)
        cls.test_iteration_dataset = ProcessingIterationData.objects.create(
            iteration=cls.test_iteration,
            image_folder_path=FileInfo.objects.create(
                name="iteration_images",
                is_folder=True,
                type=FileType.IMAGES_FOLDER.value,
                bucket_name=EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
                s3_key="iteration_id/Images/",
                status=FileStatus.DONE.value,
            ),
            geotag_column_order=["latitude", "longitude", "altitude", "omega"],
            geotag_horizontal_crs=PostGISSpatialRefSys.objects.get(
                srid=EPSG.WGS84.value
            ),
            geotag_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
            gcp_horizontal_crs=PostGISSpatialRefSys.objects.get(srid=EPSG.WGS84.value),
            gcp_vertical_crs=VerticalCRS.ELLIPSOIDAL.value,
        )

    def setUp(self):
        raise SkipTest("Abstract test")

    # Test add iteration endpoint.
    def test_create_iteration(self):
        data = {
            "name": "Test Iteration",
            "site": self.site.id,
            "date": "2022-2-1",
        }
        response = self.client.post(reverse("iteration-list"), data)
        response_data = response.json()["data"]
        # Checking if response contains name.
        self.assertEqual(response_data["name"], data["name"])
        # Checking if status code is 201.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Test get iteration endpoint.
    def test_get_iteration(self):
        params = {"exclude_fields": ["iteration_dataset"]}
        response = self.client.get(
            reverse(
                "iteration-detail",
                kwargs={
                    "pk": self.test_iteration.id,
                },
            ),
            params,
        )
        response_data = response.json()["data"]
        # Checking if status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Checking if response has iteration.
        self.assertEqual(response_data["name"], self.test_iteration.name)
        # Checking if response does not has iteration dataset.
        self.assertIsNone(response_data.get("iteration_dataset"))

    def test_get_iteration_with_iteration_dataset(self):
        response = self.client.get(
            reverse(
                "iteration-detail",
                kwargs={"pk": self.test_iteration.id},
            ),
            data={"iteration_dataset": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()["data"]
        # Checks if iteration_dataset is present.
        self.assertEqual(
            response_data["iteration_dataset"]["id"],
            str(self.test_iteration_dataset.id),
        )

    # Test update iteration endpoint.
    def test_update_iteration(self):
        data = {"name": "Updated Name"}
        response = self.client.patch(
            reverse("iteration-detail", kwargs={"pk": self.iteration.id}), data
        )
        response_data = response.json()["data"]
        # Checking if name is updated.
        self.assertEqual(response_data["name"], data["name"])
        # Checking if status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete iteration endpoint.
    def test_delete_iteration(self):
        # Act.
        response = self.client.delete(
            reverse("iteration-detail", kwargs={"pk": self.test_iteration.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test endpoint of start upload captured dsm tif file.
    # Mocked AwsManager.multipart_upload method.
    @mock.patch.object(
        AwsManager,
        "multipart_upload",
        return_value=MockedAwsManager.multipart_upload(),
    )
    def test_start_uploading_dsm(self, mock_output):
        data = {"filename": "filename.tif", "filetype": "captured_dsm"}
        response = self.client.post(
            reverse("iteration-upload-file", kwargs={"pk": self.iteration.id}),
            data,
        )
        response_data = response.json()["data"]
        # Checking if response_data has upload_id.
        self.assertIsNotNone(response_data["upload_id"])
        # Checking iteration id of response.
        self.assertEqual(response_data["iteration"], str(self.iteration.id))
        # Checking if status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test endpoint of start upload captured dsm tif file with invalid file extension.
    def test_start_uploading_invalid_captured_dsm_file(self):
        data = {"filename": "filename.invalid.py", "filetype": "captured_dsm"}
        response = self.client.post(
            reverse("iteration-upload-file", kwargs={"pk": self.iteration.id}),
            data,
        )

        # Checking if status code is 400.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test endpoint of get presigned url for uploading captured dsm.
    # Mocked AwsManager.get_upload_signed_url method.
    @mock.patch.object(
        AwsManager,
        "get_upload_signed_url",
        return_value=MockedAwsManager.get_upload_signed_url(),
    )
    def test_get_presigned_url_for_dsm(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "part_number": 1,
            "filetype": "captured_dsm",
        }
        response = self.client.post(
            reverse("iteration-presigned-url", kwargs={"pk": self.iteration.id}),
            data,
        )
        response_data = response.json()["data"]
        # Checking if response has url.
        self.assertIsNotNone(response_data["url"])
        # Checking iteration id.
        self.assertEqual(response_data["iteration"], str(self.iteration.id))
        # Checking status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test complete_upload endpoint.
    # Mocked AwsManager.complete_multipart method.
    @mock.patch.object(
        AwsManager,
        "complete_multipart",
        return_value=MockedAwsManager.complete_multipart(),
    )
    @mock.patch.object(
        AwsManager,
        "submit_batch_job",
        return_value=MockedAwsManager.submit_batch_job(),
    )
    def test_complete_dsm_upload(self, *mock_output):
        data = {
            "upload_id": "upload_id",
            "parts": ["part 1", "part 2"],
            "filetype": "captured_dsm",
        }
        response = self.client.post(
            reverse(
                "iteration-complete-upload",
                kwargs={"pk": self.iteration.id},
            ),
            data,
        )
        response_data = response.json()["data"]
        # Checking iteration id.
        self.assertEqual(response_data["iteration"], str(self.iteration.id))
        # Checking if status code 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete_captured_dsm endpoint when delete is success.
    # Mocked delete_file_from_s3 function with return_value True ( means file deleted successfully ).
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_s3",
        return_value=True,
    )
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_analytics_engine_efs",
        return_value="Capture DSM file deleted",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def test_delete_captured_dsm(self, *mack_output):
        response = self.client.delete(
            reverse(
                "iteration-captured-dsm",
                kwargs={"pk": self.iteration.id},
            )
        )
        # checking status code.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete_captured_dsm endpoint when delete is failed.
    # Mocked delete_file_from_s3 function with return_value True ( means file deletion failed ).
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_s3",
        return_value=False,
    )
    def test_delete_captured_dsm_fail(self, mack_output):
        response = self.client.delete(
            reverse(
                "iteration-captured-dsm",
                kwargs={"pk": self.iteration.id},
            )
        )
        # Checking status code is 200 or not.
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Test Elevation Profile.
    # TODO: Add data validation tests for elevation profile endpoints.
    @mock.patch(
        "iteration_manager.views.iteration_views.get_elevation_profile",
        return_value=mocked_elevation_profile(),
    )
    def test_elevation_profile_with_line_wkt(self, mock_output):
        # Arrange.
        data = {
            "iterations": [self.test_iteration.id],
            "line_wkt": WKTGeometry.LINESTRING.value,
        }

        # Act.
        response = self.client.post(reverse("iteration-elevation-profile"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @mock.patch(
        "iteration_manager.views.iteration_views.get_elevation_profile",
        return_value=mocked_elevation_profile(),
    )
    def test_elevation_profile_with_feature(self, mock_output):
        # Arrange.
        data = {
            "iterations": [self.test_iteration.id],
            "feature": str(self.test_feature.id),
        }

        # Act.
        response = self.client.post(reverse("iteration-elevation-profile"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test Download Elevation path.
    @mock.patch(
        "iteration_manager.views.iteration_views.generate_3d_shape_file",
        return_value=mocked_generate_3d_shape_file(),
    )
    def test_download_elevation_path_with_line_wkt(self, mock_output):
        # Arrange.
        params = {
            "iterations": [self.iteration.id],
            "line_wkt": WKTGeometry.LINESTRING.value,
        }

        # Act.
        response = self.client.get(
            reverse("iteration-download-elevation-path"), data=params
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/zip")

    @mock.patch(
        "iteration_manager.views.iteration_views.generate_3d_shape_file",
        return_value=mocked_generate_3d_shape_file(),
    )
    def test_download_elevation_path_with_feature(self, mock_output):
        # Arrange.
        params = {
            "iterations": [self.iteration.id],
            "feature": str(self.test_feature.id),
        }

        # Act.
        response = self.client.get(
            reverse("iteration-download-elevation-path"), data=params
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/zip")

    @mock.patch.object(
        AwsManager,
        "invoke_lambda_function",
        return_value=MockedAwsManager.invoke_lambda_function(),
    )
    @mock.patch.object(
        AwsManager,
        "submit_batch_job",
        return_value=MockedAwsManager.submit_batch_job(),
    )
    @mock.patch(
        "iteration_manager.serializers.subtract_dsm_serializer.subtract_dsm",
        return_value="{}",
    )
    def test_subtract_dsm(self, *mock_output):
        # Arrange.
        data = {
            "date": "2022-12-12",
            "first_iteration": str(self.iteration.id),
            "new_iteration_name": "Subtracted Iteration Name",
            "ortho_layer": str(self.test_layer.id),
            "second_iteration": str(self.test_iteration.id),
            "threshold_value": 0,
        }
        # Act.
        response = self.client.post(reverse("iteration-subtract-dsm"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response_data["name"], data["new_iteration_name"])
        self.assertEqual(response_data["date"], data["date"])
        self.assertEqual(response_data["layer"]["files"][0]["type"], "orthomosaic")

    def test_check_terrain_tiles_permission(self):
        # Arrange.
        data = {
            "iteration": self.iteration.id,
            "s3_key": "OUTPUT_S3_KEY",
        }

        # Act.
        response = self.client.post(
            reverse("iteration-check-terrain-tiles-permission"), data
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @mock.patch(
        "iteration_manager.views.iteration_views.send_email",
        return_value=True,
    )
    def test_analytics_request_case1(self, *mock_output):
        """
        When all the payloads are valid.
        """
        # Arrange
        data = {
            "polygon_wkt": WKTGeometry.POLYGON.value,
            "selected_outputs": [
                "Haul Road Gradient",
                "Haul Road Width",
                "Bench Analysis - Toe & Crest",
            ],
        }

        url = reverse(
            "iteration-generate-analytics", kwargs={"pk": self.test_iteration.id}
        )

        # Act
        response = self.client.post(
            url, json.dumps(data), content_type="application/json"
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @mock.patch(
        "iteration_manager.views.iteration_views.send_email",
        return_value=True,
    )
    def test_analytics_request_case2(self, *mock_output):
        """
        When the payload has an invalid polygon wkt.
        """
        # Arrange
        data = {
            "polygon_wkt": WKTGeometry.INVALID_POLYGON.value,
            "selected_outputs": [
                "Haul Road Gradient",
                "Haul Road Width",
                "Bench Analysis - Toe & Crest",
            ],
        }

        url = reverse(
            "iteration-generate-analytics", kwargs={"pk": self.test_iteration.id}
        )

        # Act
        response = self.client.post(
            url, json.dumps(data), content_type="application/json"
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @mock.patch(
        "iteration_manager.views.iteration_views.send_email",
        return_value=True,
    )
    def test_analytics_request_case3(self, *mock_output):
        """
        When the payload has invalid selected outputs.
        """
        # Arrange
        data = {
            "polygon_wkt": WKTGeometry.POLYGON.value,
            "selected_outputs": [
                "Haul Road Gradient",
                "Haul Road Width",
                "Bench Analysis - Toe & Crest",
                "xyz",
            ],
        }

        url = reverse(
            "iteration-generate-analytics", kwargs={"pk": self.test_iteration.id}
        )

        # Act
        response = self.client.post(
            url, json.dumps(data), content_type="application/json"
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @mock.patch(
        "iteration_manager.views.iteration_views.send_email",
        return_value=True,
    )
    def test_analytics_request_case4(self, *mock_output):
        """
        When the generate analytics feature flag is not enabled.
        """
        # Arrange.
        self.api_authentication(self.org_admin_without_feature_flag)

        data = {
            "polygon_wkt": WKTGeometry.POLYGON.value,
            "selected_outputs": [
                "Haul Road Gradient",
                "Haul Road Width",
                "Bench Analysis - Toe & Crest",
            ],
        }

        url = reverse(
            "iteration-generate-analytics", kwargs={"pk": self.test_iteration.id}
        )

        # Act.
        response = self.client.post(
            url, json.dumps(data), content_type="application/json"
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
