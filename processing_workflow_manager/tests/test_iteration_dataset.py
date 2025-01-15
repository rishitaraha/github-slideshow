from django.urls import reverse
from rest_framework import status

from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_iteration_dataset_tests import (
    TestCanManageIterationDataset,
    TestCannotManageIterationDataset,
)


class TestIterationDatasetForOrgAdmin(TestCanManageIterationDataset):
    # Condition: Has Manage Iteration permission.
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_iteration_dataset_creation_without_feature_enabled(self):
        self.api_authentication(self.org_admin_without_feature_flag)
        data = {"random": self.iteration.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_iteration_dataset_creation_without_authentication(self):
        self.client.force_authenticate(user=None)
        data = {"random": self.iteration.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_iteration_dataset_update_without_feature_enabled(self):
        self.api_authentication(self.org_admin_without_feature_flag)
        response = self.client.patch(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_iteration_dataset_update_without_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.patch(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestIterationDatasetForMemberUser(TestCannotManageIterationDataset):
    # Condition: Does not have Manage Iteration permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestIterationDatasetForMemberUserWithManageIteration(
    TestCanManageIterationDataset
):
    # Condition: Has Manage Iteration permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.api_authentication(self.user)
