from datetime import datetime
from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from iteration_manager.models import Iteration
from layer_manager.constants import LayerType
from layer_manager.models import Layer, LayerFile
from shared.aws import AwsManager
from shared.constants import FileStatus, FileType
from shared.models import FileInfo
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager
from user_manager.models import CustomUser, UserGroup


class TestCannotManageIterations(BaseTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="*vFGko4M3#W*7Zou*x7MB2",
            first_name="first_name2",
            last_name="last_name2",
            org=cls.org,
        )
        cls.test_iteration = Iteration.objects.create(
            name="Test Iteration 2",
            date=datetime.now(),
            site=cls.site,
        )
        cls.test_group = UserGroup.objects.create(
            name="group name",
            org=cls.org,
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
        cls.test_group.users.add(cls.test_user.id)

    def setUp(self):
        raise SkipTest("Abstract test")

    # Test add iteration endpoint for user with only view permission.
    def test_cannot_create_iteration(self):
        data = {
            "name": "Test Iteration 2",
            "site": self.site.id,
            "date": "2022-2-1",
        }
        response = self.client.post(reverse("iteration-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get iteration endpoint.
    def test_cannot_get_iteration(self):
        response = self.client.get(
            reverse("iteration-detail", kwargs={"pk": self.test_iteration.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test update iteration endpoint for user with only view permission.
    def test_cannot_update_iteration(self):
        data = {"name": "Updated Name"}
        self.api_authentication(self.test_user)
        response = self.client.patch(
            reverse("iteration-detail", kwargs={"pk": self.iteration.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete iteration endpoint for user with only view permission.
    def test_cannot_delete_iteration(self):
        self.api_authentication(self.test_user)
        response = self.client.delete(
            reverse("iteration-detail", kwargs={"pk": self.test_iteration.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test endpoint of start upload captured dsm tif file for unauthorized user.
    @mock.patch.object(
        AwsManager,
        "multipart_upload",
        return_value=MockedAwsManager.multipart_upload(),
    )
    def test_cannot_upload_dsm(self, mock_output):
        data = {"filename": "filename.tif", "filetype": "captured_dsm"}
        self.api_authentication(self.test_user)
        response = self.client.post(
            reverse("iteration-upload-file", kwargs={"pk": self.iteration.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test endpoint of get presigned url for uploading captured dsm for unauthorized user.
    @mock.patch.object(
        AwsManager,
        "get_upload_signed_url",
        return_value=MockedAwsManager.get_upload_signed_url(),
    )
    def test_cannot_get_presigned_url_for_dsm(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "part_number": 1,
            "filetype": "captured_dsm",
        }
        self.api_authentication(self.test_user)
        response = self.client.post(
            reverse("iteration-presigned-url", kwargs={"pk": self.iteration.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test complete_upload endpoint for unauthorized user.
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
    def test_cannot_complete_dsm_upload(self, *mock_output):
        data = {
            "upload_id": "upload_id",
            "parts": ["part 1", "part 2"],
            "filetype": "captured_dsm",
        }
        self.api_authentication(self.test_user)
        response = self.client.post(
            reverse("iteration-complete-upload", kwargs={"pk": self.iteration.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete_captured_dsm endpoint when delete is success for unauthorized user.
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_s3",
        return_value=True,
    )
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_analytics_engine_efs",
        return_value="Capture DSM file deleted",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def test_cannot_delete_captured_dsm(self, *mack_output):
        self.api_authentication(self.test_user)
        response = self.client.delete(
            reverse(
                "iteration-captured-dsm",
                kwargs={"pk": self.iteration.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete_captured_dsm endpoint when delete is failed for unauthorized user.
    @mock.patch(
        "iteration_manager.views.iteration_views.delete_file_from_s3",
        return_value=False,
    )
    def test_cannot_delete_captured_dsm_fail(self, mack_output):
        self.api_authentication(self.test_user)
        response = self.client.delete(
            reverse(
                "iteration-captured-dsm",
                kwargs={"pk": self.iteration.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_subtract_dsm(self):
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

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
