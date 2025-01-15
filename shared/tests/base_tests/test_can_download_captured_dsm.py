from datetime import datetime
from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from iteration_manager.models import Iteration
from project_manager.models import Project
from site_manager.constants import SiteType
from site_manager.models import Site

from ...constants.files import FileStatus, FileType
from ...models.file_models import FileInfo
from ...tests import MockedAwsManager
from ..base_test_case import BaseTestCase


class TestCanDownloadCapturedDsm(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # Arrange
        cls.project2 = Project.objects.create(name="Test Project 2", org=cls.org)
        cls.file_info2 = FileInfo.objects.create(
            name="test_download.txt",
            s3_key="test/path/test_download.txt",
            status=FileStatus.DONE.value,
            type=FileType.CAPTURED_DSM.value,
            created_by=cls.user,
            bucket_name="test-bucket",
        )
        cls.site2 = Site.objects.create(
            name="Test Site 2",
            project=cls.project2,
            type=SiteType.MINE_SITE.value,
            latitude=1,
            longitude=1,
            boundary="id",
        )
        cls.iteration2 = Iteration.objects.create(
            name="Test Iteration 2",
            date=datetime.now(),
            site=cls.site2,
            captured_dsm=cls.file_info2,
        )

    def setUp(self):
        raise SkipTest("Helper test")

    def test_download_file(self):
        kwargs = {"pk": str(self.file_info2.id)}

        # Mock the S3 checks and URL generation.
        @mock.patch(
            "shared.views.file_info_views.does_file_exist_in_s3", return_value=True
        )
        @mock.patch(
            "shared.views.file_info_views.get_download_url",
            return_value=MockedAwsManager.get_download_signed_url(),
        )
        def run_test(self, mock_get_url, mock_exists):
            # Act
            response = self.client.get(reverse("files-download-file", kwargs=kwargs))
            response_data = response.json()

            # Assert
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("download_url", response_data["data"])
            self.assertEqual(
                response_data["data"]["download_url"],
                MockedAwsManager.get_download_signed_url(),
            )
            mock_exists.assert_called_once()
            mock_get_url.assert_called_once()

        run_test(self)
