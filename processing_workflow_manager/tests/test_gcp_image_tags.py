from unittest import mock

from django.urls import reverse

from project_manager.models import ProjectPermission
from shared.aws.aws_manager import AwsManager
from shared.exception_handling.api_errors.validation_errors import ValidationErrors
from shared.tests.mock import MockedAwsManager
from site_manager.models.site_models import SitePermission

from ..models import GCPImageTag
from ..tests import ProcessingBaseTestCase


class GCPImageTestCaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)
        self.update_gcp_image_tags_path = reverse("gcp-image-tags-update")
        self.request_data = {
            "gcp": self.gcp_wgs84_1.id,
            "gcp_image_tags": [
                {
                    "image_id": self.geotag_image_wgs_84_1.id,
                    "image_x": 1920.1,
                    "image_y": 1080.12,
                },
                {
                    "image_id": self.geotag_image_wgs_84_2.id,
                    "image_x": 1233.3,
                    "image_y": 334.4,
                },
            ],
        }

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_create_gcp_image_tags_for_iteration_dataset(self, *mock_output):
        response = self.client.put(
            path=self.update_gcp_image_tags_path, data=self.request_data, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(GCPImageTag.objects.filter(gcp=self.gcp_wgs84_1).count(), 2)

    def test_error_invalid_gcp_id(self):
        invalid_data = self.request_data
        invalid_data["gcp"] = str(self.gcp_utm_1.id)

        response = self.client.put(
            path=self.update_gcp_image_tags_path, data=invalid_data, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["meta"]["slug"],
            ValidationErrors.INVALID_IMAGE_TO_TAG.value.slug,
        )

    def test_error_duplicate_image_id(self):
        invalid_data = self.request_data
        invalid_data["gcp_image_tags"].append(
            {
                "image_id": self.geotag_image_wgs_84_2.id,
                "image_x": 1233.3,
                "image_y": 334.4,
            },
        )

        response = self.client.put(
            path=self.update_gcp_image_tags_path, data=invalid_data, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["meta"]["slug"],
            ValidationErrors.DUPLICATE_GCP_IMAGE_TAGS.value.slug,
        )

    def test_error_different_dataset_image_id(self):
        invalid_data = self.request_data
        invalid_data["gcp_image_tags"].append(
            {
                "image_id": self.geotag_image_utm_1.id,
                "image_x": 1233.3,
                "image_y": 334.4,
            },
        )

        response = self.client.put(
            path=self.update_gcp_image_tags_path, data=invalid_data, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["meta"]["slug"],
            ValidationErrors.INVALID_IMAGE_TO_TAG.value.slug,
        )

    def test_delete_gcp_image_tags(self):
        tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.gcp_wgs84_1,
            geotag_image=self.geotag_image_wgs_84_1,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.delete(
            f"/processing/gcp-image-tags/delete/?gcp={str(self.gcp_wgs84_1.id)}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["meta"]["message"],
            "gcp_image_tags_deleted_successfully",
        )
        self.assertFalse(GCPImageTag.objects.filter(id=tagged_gcp_image_1.id).exists())


class GCPImageTestCaseForMembers(ProcessingBaseTestCase):
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
        self.gcp_image_tag_path = reverse("gcp-image-tags-update")
        self.request_data = {
            "gcp": self.gcp_wgs84_1.id,
            "gcp_image_tags": [
                {
                    "image_id": self.geotag_image_wgs_84_1.id,
                    "image_x": 1920.1,
                    "image_y": 1080.12,
                },
                {
                    "image_id": self.geotag_image_wgs_84_2.id,
                    "image_x": 1233.3,
                    "image_y": 334.4,
                },
            ],
        }
        self.api_authentication(self.user_2)

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_gcp_image_tags_for_member_user_with_permissions(self, *mock_output):
        self.api_authentication(self.user_2)
        response = self.client.put(
            path=self.gcp_image_tag_path, data=self.request_data, format="json"
        )
        self.assertEqual(response.status_code, 200)

    def test_gcp_image_tags_for_member_user_without_permissions(self):
        self.api_authentication(self.user)
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)

    def test_gcp_image_tags_for_member_user_without_feature_flag(self):
        # Test for member user without feature flag for org.
        self.api_authentication(self.user_of_org2)
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)

    def test_delete_gcp_image_tags(self):
        self.api_authentication(self.user)
        tagged_gcp_image_1 = GCPImageTag.objects.create(
            gcp=self.gcp_wgs84_1,
            geotag_image=self.geotag_image_wgs_84_1,
            image_x=1000,
            image_y=2000,
        )
        response = self.client.delete(
            f"/processing/gcp-image-tags/delete/?gcp={str(self.gcp_wgs84_1.id)}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["meta"]["message"],
            "gcp_image_tags_deleted_successfully",
        )
        self.assertFalse(GCPImageTag.objects.filter(id=tagged_gcp_image_1.id).exists())
