from unittest import mock

from django.urls import reverse
from rest_framework import status

from project_manager.models import ProjectPermission
from shared.aws import AwsManager
from shared.constants import FileStatus
from shared.models import FileInfo
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager

from ..constants import SiteType
from ..models import Site, SitePermission


class TestSiteWithoutViewProjectPermission(BaseTestCase):
    """
    Testing sites endpoints when user have
        - view site permission.
        - manage site permission.
        - not view project permission.
    """

    def setUp(self):
        self.test_site = Site.objects.create(
            name="My Site 2",
            project=self.project,
            type=SiteType.MINE_SITE.value,
            latitude=1,
            longitude=1,
            boundary="id",
            base_dsm=FileInfo.objects.create(
                name="base_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.STARTED.value,
            ),
        )
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=True,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.test_site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )
        self.api_authentication()

    def test_create_site(self):
        data = {
            "name": "Test Site",
            "project": self.project.id,
            "type": SiteType.MINE_SITE.value,
            "latitude": 1,
            "longitude": 1,
            "boundary": "id",
        }
        response = self.client.post(reverse("site-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_site(self):
        params = {"project_id": self.project.id}
        response = self.client.get(reverse("site-list"), params)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_site(self):
        response = self.client.get(
            reverse("site-detail", kwargs={"pk": self.test_site.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_site(self):
        data = {"name": "Updated Name"}
        response = self.client.patch(
            reverse("site-detail", kwargs={"pk": self.test_site.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Mocked AwsManager.multipart_upload method.
    @mock.patch.object(
        AwsManager,
        "multipart_upload",
        return_value=MockedAwsManager.multipart_upload(),
    )
    def test_start_uploading(self, mock_output):
        data = {"filename": "filename.tif", "filetype": "base_dsm"}
        response = self.client.post(
            reverse("site-upload-file", kwargs={"pk": self.test_site.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Mocked AwsManager.get_upload_signed_url method.
    @mock.patch.object(
        AwsManager,
        "get_upload_signed_url",
        return_value=MockedAwsManager.get_upload_signed_url(),
    )
    def test_get_presigned_url(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "part_number": 1,
            "filetype": "base_dsm",
        }
        response = self.client.post(
            reverse("site-presigned-url", kwargs={"pk": self.test_site.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Mocked AwsManager.complete_multipart method.
    @mock.patch.object(
        AwsManager,
        "complete_multipart",
        return_value=MockedAwsManager.complete_multipart(),
    )
    def test_complete_upload(self, mock_output):
        data = {
            "upload_id": "upload_id",
            "parts": ["part 1", "part 2"],
            "filetype": "base_dsm",
        }
        response = self.client.post(
            reverse(
                "site-complete-upload",
                kwargs={"pk": self.test_site.id},
            ),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Mocked delete_file_from_s3 function with return_value True ( means file deleted successfully ).
    @mock.patch("site_manager.views.site_views.delete_file_from_s3", return_value=True)
    def test_delete_base_dsm(self, mack_output):
        response = self.client.delete(
            reverse(
                "site-delete-base-dsm",
                kwargs={"pk": self.test_site.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get site financial years.
    def test_get_site_financial_years(self):
        # Act
        response = self.client.get(
            reverse("site-kpi-financial-years", kwargs={"pk": self.test_site.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
