from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from project_manager.models import Project
from site_manager.constants import SiteType
from site_manager.models import Site

from ...constants.files import FileStatus, FileType
from ...models.file_models import FileInfo
from ..base_test_case import BaseTestCase


class TestCannotDownloadBaseDsm(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # Arrange
        cls.project2 = Project.objects.create(name="Test Project 2", org=cls.org)
        cls.file_info2 = FileInfo.objects.create(
            name="test_download.txt",
            s3_key="test/path/test_download.txt",
            status=FileStatus.DONE.value,
            type=FileType.BASE_DSM.value,
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
            base_dsm=cls.file_info2,
        )

    def setUp(self):
        raise SkipTest("Helper test")

    def test_download_file(self):
        kwargs = {"pk": str(self.file_info2.id)}

        # Act
        response = self.client.get(reverse("files-download-file", kwargs=kwargs))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
