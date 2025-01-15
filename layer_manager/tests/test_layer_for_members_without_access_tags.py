from django.urls import reverse
from rest_framework import status

from layer_manager.constants import LayerType
from project_manager.models import ProjectPermission
from site_manager.models import SitePermission

from .base_tests import (
    TestCannotManageLayers,
    TestCannotViewLayers,
    TestCanViewEmptyLayers,
)


# All following tests cases, access tags are not given to user group.
class TestLayerForMemberCase9(
    TestCanViewEmptyLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, View Site & Manage Iteration & Layers permission.
    def setUp(self):
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

    # Test add layer endpoint.
    def test_create_layer(self):

        data = {
            "name": "Test layer",
            "iteration": self.iteration.id,
            "source_id": "some test source id",
            "type": LayerType.VECTOR.value,
            "access_tags": [self.access_tag.id],
        }
        response = self.client.post(reverse("layers-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Test create layer endpoint without passing access tags.
    def test_create_layer_without_passing_access_tags(self):

        # Arrange.
        data = {
            "name": "Test layer",
            "iteration": self.iteration.id,
            "source_id": "some test source id",
            "type": LayerType.VECTOR.value,
        }

        # Act.
        response = self.client.post(reverse("layers-list"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestLayerForMemberCase10(
    TestCanViewEmptyLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project, View Site permission.
    # Does not has Manage Iteration & Layers permission.
    def setUp(self):
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


class TestLayerForMemberCase11(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project & Manage Iteration & Layers permission,
    # Does not has View Site permission.
    def setUp(self):
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
        self.api_authentication(self.user)


class TestLayerForMemberCase12(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Project permission.
    # Does not has Manage Iteration & Layers and View Site permission.
    def setUp(self):
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
        self.api_authentication(self.user)


class TestLayerForMemberCase13(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site & Manage Iteration & Layers permission.
    # Does not has View Project permission.
    def setUp(self):
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
        self.api_authentication(self.user)


class TestLayerForMemberCase14(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has View Site permission.
    # Does not has View Project & Manage Iteration & Layers permission.
    def setUp(self):
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
        self.api_authentication(self.user)


class TestLayerForMemberCase15(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Has Manage Iteration & Layers permission.
    # Does not has View Project, View Site permission.
    def setUp(self):
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
        self.api_authentication(self.user)


class TestLayerForMemberCase16(
    TestCannotViewLayers,
    TestCannotManageLayers,
):
    # Condition: Does not has View Project, View Site Manage Iteration & Layers permission.
    def setUp(self):
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
        self.api_authentication(self.user)
