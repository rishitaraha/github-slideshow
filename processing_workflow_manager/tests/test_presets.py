from django.urls import reverse

from processing_workflow_manager.tests.base_test_case import ProcessingBaseTestCase
from project_manager.models import ProjectPermission
from site_manager.models import SitePermission


class PresetTestCase(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_preset_list(self):
        response = self.client.get(
            reverse("presets-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        response_json = response.json()
        presets_length = len(response_json["data"]["presets"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(presets_length, 3)


class PresetTestCaseForMember(ProcessingBaseTestCase):
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

    def test_preset_list_for_member_with_permission(self):
        response = self.client.get(
            reverse("presets-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        response_json = response.json()
        presets_length = len(response_json["data"]["presets"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(presets_length, 3)

    def test_preset_list_for_member_user_without_permissions(self):
        self.api_authentication(self.user)
        response = self.client.get(
            reverse("presets-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)

    def test_preset_list_for_member_user_without_feature_flag(self):
        # Test for member user without feature flag for org.
        self.api_authentication(self.user_of_org2)
        response = self.client.get(
            reverse("presets-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)
