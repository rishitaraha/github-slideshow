from django.urls import reverse

from processing_workflow_manager.tests.base_test_case import ProcessingBaseTestCase
from project_manager.models import ProjectPermission
from site_manager.models.site_models import SitePermission


class GeotagImageDownloadTestCaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_download_geotag_images_wgs84(self):
        data = {
            "geotag_column_order": ["filename", "latitude", "longitude", "altitude"],
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.content)

    def test_download_geotag_images_wgs84(self):
        data = {
            "geotag_column_order": ["filename", "easting", "northing", "altitude"],
            "iteration_dataset": self.iteration_dataset_utm_zone.id,
        }
        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.content)

    def test_download_geotag_with_invalid_column_order(self):
        data = {
            "geotag_column_order": ["xy", "latitude", "longitude", "altitude"],
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class GeotagImageDownloadTestCaseForMember(ProcessingBaseTestCase):
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

    def test_geotag_image_download_for_member_user_with_permissions(self):
        data = {
            "geotag_column_order": ["filename", "latitude", "longitude", "altitude"],
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.content)

    def test_geotag_image_download_for_member_user_without_permissions(self):
        self.api_authentication(self.user)
        data = {
            "geotag_column_order": ["filename", "latitude", "longitude", "altitude"],
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }

        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_geotag_image_download_for_member_user_without_feature_flag(self):
        # Test for member user without feature flag for org.
        self.api_authentication(self.user_of_org2)
        data = {
            "geotag_column_order": ["filename", "latitude", "longitude", "altitude"],
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }

        response = self.client.get(
            reverse("geotag-images-download"),
            data=data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)
