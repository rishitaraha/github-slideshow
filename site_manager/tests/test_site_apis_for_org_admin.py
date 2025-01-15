from unittest import mock

from django.urls import reverse
from rest_framework import status

from org_manager.models import Organisation
from project_manager.models import Project
from shared.aws import AwsManager
from shared.constants import FileStatus
from shared.models import FileInfo
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager

from ..constants import SiteType
from ..models import Site
from .helpers import create_test_production_kpi_csv


class TestSiteForOrgAdmin(BaseTestCase):
    """
    Test Site endpoints for org admin.
    """

    def setUp(self):
        self.test_org = Organisation.objects.create(name="Test Org")
        self.test_project = Project.objects.create(name="Project 2", org=self.test_org)
        self.test_site = Site.objects.create(
            name="My Site 2",
            project=self.project,
            type=SiteType.MINE_SITE.value,
            latitude=1,
            longitude=1,
            boundary="id",
            base_dsm=FileInfo.objects.create(
                name="base_dsm.tif",
                s3_key="path",
                status=FileStatus.STARTED.value,
            ),
        )

        self.api_authentication(self.org_admin)

    # Test add site endpoint.
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
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Test list site endpoint with authentication.
    def test_list_site_authenticated(self):
        params = {"project_id": self.project.id, "search": "site"}
        response = self.client.get(reverse("site-list"), params)
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["name"] for item in response_data["sites"]]),
            sorted([self.site.name, self.test_site.name]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test list site endpoint without authentication.
    def test_list_site_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("site-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Testing list site with a project of different organisation.
    def test_site_list_with_different_org_project(self):
        params = {"project_id": self.test_project.id}
        response = self.client.get(reverse("site-list"), params)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
            reverse("site-detail", kwargs={"pk": self.site.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete site endpoint.
    def test_delete_site(self):
        # Act.
        response = self.client.delete(
            reverse("site-detail", kwargs={"pk": self.site.id})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

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
            reverse("site-upload-file", kwargs={"pk": self.site.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertIsNotNone(response_data["upload_id"])
        self.assertEqual(response_data["site"], str(self.site.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test endpoint of start upload base dsm tif file with invalid file extension.
    def test_start_uploading_invalid_base_dsm_file(self):
        data = {"filename": "filename.invalid.py", "filetype": "base_dsm"}
        response = self.client.post(
            reverse("site-upload-file", kwargs={"pk": self.site.id}),
            data,
        )
        # Checking if status code is 400.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test endpoint of start upload legend image file with invalid file extension.
    def test_start_uploading_invalid_legend_image_file(self):
        data = {"filename": "filename.invalid.py", "filetype": "legend_image"}
        response = self.client.post(
            reverse("site-upload-file", kwargs={"pk": self.site.id}),
            data,
        )

        # Checking if status code is 400.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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
            reverse("site-presigned-url", kwargs={"pk": self.site.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertIsNotNone(response_data["url"])
        self.assertEqual(response_data["site"], str(self.site.id))
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
                kwargs={"pk": self.site.id},
            ),
            data,
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["site"], str(self.site.id))
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

    # Test delete_base_dsm endpoint when delete is failed.
    # Mocked delete_file_from_s3 function with return_value True ( means file deletion failed ).
    @mock.patch("site_manager.views.site_views.delete_file_from_s3", return_value=False)
    def test_delete_base_dsm_fail(self, mack_output):
        response = self.client.delete(
            reverse(
                "site-delete-base-dsm",
                kwargs={"pk": self.test_site.id},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Test add permission of a site.
    def test_add_site_permission(self):
        data = {
            "user_group": str(self.user_group.id),
            "can_view": True,
            "can_manage_iterations_and_layers": False,
        }

        response = self.client.post(
            reverse("site-permission", kwargs={"pk": self.site.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["user_group"], data["user_group"])
        self.assertEqual(response_data["can_view"], data["can_view"])
        self.assertEqual(
            response_data["can_manage_iterations_and_layers"],
            data["can_manage_iterations_and_layers"],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test add production target.
    def test_upload_production_kpi(self):
        # Arrange.
        data = {
            "production_kpi_file": create_test_production_kpi_csv(),
        }

        # Act.
        response = self.client.post(
            reverse("site-kpi-production-kpi", kwargs={"pk": self.site.id}),
            data=data,
        )
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response_data)
        self.assertEqual(len(response_data["created_production_kpi"]), 1)
        self.assertEqual(len(response_data["updated_production_kpi"]), 1)
