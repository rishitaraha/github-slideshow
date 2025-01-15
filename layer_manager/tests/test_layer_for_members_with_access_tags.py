from django.urls import reverse
from rest_framework import status

from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_tests import (
    TestCanManageLayers,
    TestCannotManageLayers,
    TestCannotViewLayers,
    TestCanViewLayers,
)


# All following tests cases, access tags are attached to user group.
class TestLayerForMemberCase1(
    TestCanViewLayers,
    TestCanManageLayers,
):
    # Condition: Has View Project, View Site permission and Manage Iteration & Layers permission.
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
        self.layer.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.vector_layer.access_tags.add(self.access_tag)
        self.api_authentication(self.user)

    # Test update layer endpoint by not passing access tags.
    def test_update_layer_with_no_access_tags(self):
        # Arrange.
        data = {"name": "Updated Name"}

        # Act.
        response = self.client.patch(
            reverse("layers-detail", kwargs={"pk": self.layer.id}), data
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update layer endpoint by passing empty array in access tags.
    def test_update_layer_with_empty_access_tags(self):
        # Arrange.
        data = '{"name": "Updated Name", "access_tags": []}'

        # Act.
        response = self.client.patch(
            reverse("layers-detail", kwargs={"pk": self.layer.id}),
            data,
            content_type="application/json",
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestLayerForMemberCase2(
    TestCanViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, View Site permission.
    # Does not has Manage Iteration & Layers permission.
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
        self.layer.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.vector_layer.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase3(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project permission.
    # Does not has View Site, Manage Iteration & Layers permission.
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
            can_view=False,
            can_manage_iterations_and_layers=False,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase4(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, Manage Iteration & Layers permission.
    # Does not has View Site permission.
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
            can_view=False,
            can_manage_iterations_and_layers=True,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase5(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site, Manage Iteration & Layers permission.
    # Does not has View Project permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
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
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase6(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site permission.
    # Does not has View Project, Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
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
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase7(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has Manage Iteration & Layers permission.
    # Does not has View Project, View Site permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=True,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)


class TestLayerForMemberCase8(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Does not has View Project, View Site, Manage Iteration & Layers permission.
    def setUp(self):
        # Arrange.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=False,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=False,
            can_manage_iterations_and_layers=False,
        )
        self.user_group.access_tags.add(self.access_tag)
        self.layer2.access_tags.add(self.access_tag)
        self.api_authentication(self.user)
