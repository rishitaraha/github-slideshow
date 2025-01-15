import json
from unittest import mock
from uuid import uuid4

from django.urls import reverse
from rest_framework import status

from analytics_engine_manager.tests.mock import mocked_dsm_metadata
from layer_manager.constants import LayerType
from layer_manager.models import Layer, LayerFile
from project_manager.models import ProjectPermission
from shared.aws import AwsManager
from shared.constants import BatchJobStatus, FileStatus, FileType
from shared.models import BatchJob, FileInfo
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager
from site_manager.models import SitePermission
from user_manager.models import CustomUser, UserGroup


class TestFileInfo(BaseTestCase):
    def setUp(self) -> None:
        self.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="first_name2",
            last_name="last_name2",
            org=self.org,
        )

        self.test_batch_job = BatchJob.objects.create(
            job_id=uuid4(),
            env_variables={},
            status=BatchJobStatus.STARTED.value,
        )

        self.test_file_info = FileInfo.objects.create(
            name="test.mbtiles", batch_job=self.test_batch_job
        )

        self.test_group = UserGroup.objects.create(
            name="group name",
            org=self.org,
        )
        self.test_group.users.add(self.test_user.id)

        # Captured DSM COG.
        self.iteration.captured_dsm_cog = FileInfo.objects.create(
            name="captured_dsm_cog.tif",
            s3_key="path.tif",
            status=FileStatus.DONE.value,
            type=FileType.CAPTURED_DSM_COG.value,
            created_by=self.test_user,
        )

        # MBtiles.
        self.test_mbtiles_file_info_1 = FileInfo.objects.create(
            name="test.mbtiles",
            s3_key="path.mbitles",
            status=FileStatus.DONE.value,
            type=FileType.MBTiles.value,
            created_by=self.test_user,
        )
        self.test_mbtiles_file_info_2 = FileInfo.objects.create(
            name="test.mbtiles",
            s3_key="path.mbitles",
            status=FileStatus.DONE.value,
            type=FileType.MBTiles.value,
            created_by=self.user,
        )

        # Orthomosaic.
        self.test_ortho_file_info = FileInfo.objects.create(
            name="ortho.tif",
            s3_key="path.tif",
            status=FileStatus.PROCESSING.value,
            type=FileType.ORTHOMOSAIC.value,
            created_by=self.test_user,
        )

        # Orthomosaic cog.
        self.test_ortho_cog_file_info = FileInfo.objects.create(
            name="ortho_cog.tif",
            s3_key="path.tif",
            status=FileStatus.PROCESSING.value,
            type=FileType.ORTHOMOSAIC_COG.value,
            created_by=self.test_user,
            batch_job=self.test_batch_job,
        )

        self.test_layer = Layer.objects.create(
            name="Test Layer",
            iteration=self.iteration,
            site=self.site,
            type=LayerType.ORTHOMOSAIC.value,
        )

        self.test_ortho_layer_file = LayerFile.objects.create(
            layer=self.test_layer,
            file_info=self.test_ortho_file_info,
        )

        self.test_ortho_cog_layer_file = LayerFile.objects.create(
            layer=self.test_layer,
            file_info=self.test_ortho_cog_file_info,
        )

        # Project permission for a user group to view.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.test_group,
            can_view=True,
            can_manage_sites=True,
        )
        # Site permission for a user group to view.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.test_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )

        self.api_authentication(self.test_user)

    # Test add files endpoint.
    def test_create_file(self):
        data = {"filename": "demo.mbtiles", "filetype": FileType.MBTiles.value}
        response = self.client.post(reverse("files-list"), data)
        response_data = response.json()["data"]

        # Checking if status code is 201.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Checking if response contains name.
        self.assertEqual(response_data["filename"], data["filename"])

    def test_delete_file_case_1(self):
        """
        Test delete file when it is not attached to any layer.
        """
        response = self.client.delete(
            reverse("files-detail", kwargs={"pk": self.test_mbtiles_file_info_1.id})
        )

        # Checking if status code is 204.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    @mock.patch.object(
        AwsManager,
        "terminate_batch_job",
        return_value=MockedAwsManager.terminate_batch_job(),
    )
    def test_delete_file_case_2(self, mocked_output):
        """
        Test delete file when it is attached to a layer.
        """
        response = self.client.delete(
            reverse("files-detail", kwargs={"pk": self.test_ortho_file_info.id})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Checking if terminate_batch_job method is called.
        mocked_output.assert_called_once()

    def test_delete_file_case_3(self):
        """
        Test delete file when it is not attached to a layer and another user tries to delete it.
        """
        response = self.client.delete(
            reverse("files-detail", kwargs={"pk": self.test_mbtiles_file_info_2.id})
        )

        # Checking if status code is 403.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test endpoint of start upload mbtiles file.
    # Mocked AwsManager.multipart_upload method.
    @mock.patch.object(
        AwsManager,
        "multipart_upload",
        return_value=MockedAwsManager.multipart_upload(),
    )
    def test_start_uploading_mbtile(self, mock_output):
        data = {"filename": "demo2.mbtiles", "filetype": "mbtiles"}
        response = self.client.post(
            reverse("files-upload-file", kwargs={"pk": self.file_info.id}),
            data,
        )
        response_data = response.json()["data"]

        # Checking if status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Checking if response_data has upload_id.
        self.assertIsNotNone(response_data["upload_id"])
        # Checking file_info id of response.
        self.assertEqual(response_data["file_info"], str(self.file_info.id))

    # Test endpoint of start upload mbtiles file with invalid file extension.
    def test_start_uploading_invalid_mbtiles_file(self):
        data = {"filename": "filename.invalid.py", "filetype": "mbtiles"}
        response = self.client.post(
            reverse("files-upload-file", kwargs={"pk": self.file_info.id}),
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
    def test_get_presigned_url_for_mbtile(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "part_number": 1,
            "filetype": "mbtiles",
        }
        response = self.client.post(
            reverse("files-presigned-url", kwargs={"pk": self.file_info.id}),
            data,
        )
        response_data = response.json()["data"]

        # Checking status code is 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Checking if response has url.
        self.assertIsNotNone(response_data["url"])
        # Checking file_info id.
        self.assertEqual(response_data["file_info"], str(self.file_info.id))

    # Test complete_upload endpoint.
    # Mocked AwsManager.complete_multipart method.
    @mock.patch.object(
        AwsManager,
        "complete_multipart",
        return_value=MockedAwsManager.complete_multipart(),
    )
    def test_complete_mbtile_upload(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "parts": ["part 1", "part 2"],
            "filetype": "mbtiles",
        }
        response = self.client.post(
            reverse(
                "files-complete-upload",
                kwargs={"pk": self.file_info.id},
            ),
            data,
        )
        response_data = response.json()["data"]

        # Checking if status code 200.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Checking file_info id.
        self.assertEqual(response_data["file_info"]["id"], str(self.file_info.id))

    # Test update file properties.
    def test_update_file_properties(self):
        # Arrange.
        data = {
            "properties": {
                "bounds": [20, 30, 40, 50],
            },
        }
        json_data = json.dumps(data)

        # Act.
        update_response = self.client.patch(
            reverse(
                "files-properties",
                kwargs={"pk": self.iteration.captured_dsm.id},
            ),
            json_data,
            content_type="application/json",
        )
        response_data = update_response.json()["data"]

        # Assert.
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["properties"], data["properties"])

    @mock.patch(
        "shared.views.file_info_views.get_cog_metadata",
        return_value=mocked_dsm_metadata(),
    )
    def test_get_file_info_properties(self, mocked_output):
        # Arrange.
        params = {"iteration_id": self.iteration.id}

        # Act.
        get_response = self.client.get(
            reverse(
                "files-properties",
                kwargs={"pk": self.iteration.captured_dsm_cog.id},
            ),
            params,
        )
        response_data = get_response.json()["data"]

        # Assert.
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        properties_data = mocked_dsm_metadata()
        self.assertEqual(response_data["properties"], properties_data)

    def test_update_file_status(self):
        # Arrange.
        data = {"status": "done"}
        url = reverse("files-status", kwargs={"pk": self.file_info.id})

        # Act.
        response = self.client.patch(url, data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["status"], data["status"])

    def test_update_file_batch_status(self):
        # Arrange.
        data = {"status": "completed"}
        url = reverse("files-batch-job-status", kwargs={"pk": self.test_file_info.id})

        # Act.
        response = self.client.patch(url, data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["status"], data["status"])
