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
from .helpers import create_test_production_kpi_csv


class TestSiteWithManageSitePermission(BaseTestCase):
    """
    Test site endpoints for user with
        - view project permission.
        - view site permission.
        - manage sites permission.
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
            can_view=True,
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

    # Only org_admin can create a site so a member can't create a site.
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

    # Test list site endpoint with authentication.
    def test_list_site(self):
        params = {"project_id": self.project.id}
        response = self.client.get(reverse("site-list"), params)
        response_data = response.json()["data"]
        self.assertEqual(
            [item["name"] for item in response_data["sites"]],
            [self.test_site.name],
        )
        self.assertEqual(response_data["total"], 1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test get site endpoint.
    def test_get_site(self):
        response = self.client.get(
            reverse("site-detail", kwargs={"pk": self.test_site.id})
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], self.test_site.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update site endpoint.
    def test_update_site(self):
        data = {"name": "Updated Name"}
        response = self.client.patch(
            reverse("site-detail", kwargs={"pk": self.test_site.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_site(self):
        # Act.
        response = self.client.delete(
            reverse("site-detail", kwargs={"pk": self.test_site.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test endpoint of start upload base dsm tif file.
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
        response_data = response.json()["data"]
        self.assertIsNotNone(response_data["upload_id"])
        self.assertEqual(response_data["site"], str(self.test_site.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test endpoint of get presigned url for uploading base dsm.
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
        response_data = response.json()["data"]
        self.assertIsNotNone(response_data["url"])
        self.assertEqual(response_data["site"], str(self.test_site.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test complete_upload endpoint.
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
        response_data = response.json()["data"]
        self.assertEqual(response_data["site"], str(self.test_site.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete_base_dsm endpoint when delete is success.
    # Mocked delete_file_from_s3 function with return_value True ( means file deleted successfully ).
    @mock.patch("site_manager.views.site_views.delete_file_from_s3", return_value=True)
    def test_delete_base_dsm(self, mack_output):
        response = self.client.delete(
            reverse(
                "site-delete-base-dsm",
                kwargs={"pk": self.test_site.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # Test update permission of a site.
    def test_add_site_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": True,
            "can_manage_iterations_and_layers": False,
        }

        response = self.client.post(
            reverse("site-permission", kwargs={"pk": self.site.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test add production target.
    def test_upload_production_kpi(self):
        # Arrange.
        data = {
            "production_kpi_file": create_test_production_kpi_csv(),
        }

        # Act.
        response = self.client.post(
            reverse("site-kpi-production-kpi", kwargs={"pk": self.test_site.id}),
            data=data,
        )
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response_data)
        self.assertEqual(len(response_data["created_production_kpi"]), 2)
        self.assertEqual(len(response_data["updated_production_kpi"]), 0)
